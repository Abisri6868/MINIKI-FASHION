import axios from "axios";

const API_URL = "https://miniki-fashion-production.up.railway.app/api";

console.log("API_URL =", API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("miniki_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;