import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // by adding this field browser will send the cookies to server automatically, on every single req
});
// Add request interceptor to include Clerk auth token
axiosInstance.interceptors.request.use(async (config) => {
  try {
    // Get the Clerk session token
    const token = await window.Clerk?.session?.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error getting Clerk token:", error);
  }

  return config;
});

export default axiosInstance;

