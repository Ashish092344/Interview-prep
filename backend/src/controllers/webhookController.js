// clerkWebhook.js
import { Webhook } from "svix";
import User from "../models/User.js";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  throw new Error("Missing CLERK_WEBHOOK_SECRET");
}

export const clerkWebhookHandler = async (req, res) => {
  const payload = req.body; // raw string (IMPORTANT)
  const headers = req.headers;

  const svix_id = headers["svix-id"];
  const svix_timestamp = headers["svix-timestamp"];
  const svix_signature = headers["svix-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ message: "Missing Svix headers" });
  }

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("❌ Clerk webhook signature invalid:", err.message);
    return res.status(400).json({ message: "Invalid signature" });
  }

  const eventType = evt.type;
  const data = evt.data;

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      const clerkId = data.id;
      const first = data.first_name || "";
      const last = data.last_name || "";
      const image = data.image_url || "";

      // Extract primary email
      let email = "";
      if (Array.isArray(data.email_addresses)) {
        const primaryId = data.primary_email_address_id;
        const primary = data.email_addresses.find(e => e.id === primaryId);
        email = primary?.email_address || data.email_addresses[0]?.email_address;
      }

      // --- FIX: USE EMAIL FOR UPSERT, NOT CLERK ID ---
      const user = await User.findOneAndUpdate(
        { email }, 
        {
          clerkId,
          email,
          name: `${first} ${last}`.trim(),
          profileImage: image
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log("✅ User saved/updated:", email);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).json({ message: "Webhook handler error" });
  }
};
