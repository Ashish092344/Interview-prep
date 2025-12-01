import express from "express";
import { clerkWebhookHandler } from "../controllers/webhookController.js";

const router = express.Router();

// Clerk → /api/webhooks
router.post(
  "/webhooks",
  express.raw({ type: "application/json" }),
  clerkWebhookHandler
);

export default router;
