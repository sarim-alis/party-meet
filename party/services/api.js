import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const getBaseURL = () => {
  const LOCAL_IP = "192.168.18.254";

  if (Platform.OS === "android") { return `http://${LOCAL_IP}:5000/api`;}
  return `http://${LOCAL_IP}:5000/api`;
};

const API_BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Add token to requests.
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) { config.headers.Authorization = `Bearer ${token}`;}
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
