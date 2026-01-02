// Imports.
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

// Login.
export const login = async (email, password) => {
  try {
    const response = await api.post("/users/login", {
      email,
      password,
    });

    if (response.data.success) {
      // Store token.
      await AsyncStorage.setItem("token", response.data.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.data.user));
      return response.data.data;
    }
    throw new Error(response.data.message || "Login failed");
  } catch (error) {
    throw error.response?.data?.message || error.message || "Login failed";
  }
};

// Register.
export const register = async (username, email, password, imageUri = null) => {
  try {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);

    if (imageUri) {
      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "profile.jpg",
      });
    }

    const response = await api.post("/users/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.success) {
      // Store token.
      await AsyncStorage.setItem("token", response.data.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.data.user));
      return response.data.data;
    }
    throw new Error(response.data.message || "Registration failed");
  } catch (error) {
    throw error.response?.data?.message || error.message || "Registration failed";
  }
};

// Logout.
export const logout = async () => {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
};

// Get stored token.
export const getToken = async () => {
  return await AsyncStorage.getItem("token");
};

// Get stored user.
export const getUser = async () => {
  const userStr = await AsyncStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

// Check if user is logged in.
export const isLoggedIn = async () => {
  const token = await getToken();
  return !!token;
};

