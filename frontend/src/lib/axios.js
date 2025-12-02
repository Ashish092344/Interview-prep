import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://interview-prep-2k8k.onrender.com/api",
  withCredentials: true,
});

// ✅ Add request interceptor with better error handling
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Wait for Clerk to be ready
      if (window.Clerk) {
        await window.Clerk.load();
        const token = await window.Clerk.session?.getToken();
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error("Error getting Clerk token:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized - redirecting to login");
      // Optional: redirect to login page
      // window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
