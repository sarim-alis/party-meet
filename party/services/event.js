import api from "./api";

// Get all events
export const getEvents = async (category = null, view = "all") => {
  try {
    const params = { view };
    if (category && category !== "All") {
      params.category = category;
    }
    const response = await api.get("/events", { params });

    if (response.data.success) {
      return {
        events: response.data.data,
        isAdmin: response.data.isAdmin || false,
      };
    }
    throw new Error(response.data.message || "Failed to fetch events");
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch events";
  }
};

// Create event
export const createEvent = async (eventData) => {
  try {
    const response = await api.post("/events", eventData);

    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to create event");
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to create event";
  }
};

// Join event
export const joinEvent = async (eventId) => {
  try {
    const response = await api.post(`/events/${eventId}/join`);

    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to join event");
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to join event";
  }
};

// Leave event
export const leaveEvent = async (eventId) => {
  try {
    const response = await api.post(`/events/${eventId}/leave`);

    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to leave event");
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to leave event";
  }
};

// Delete event
export const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(`/events/${eventId}`);

    if (response.data.success) {
      return true;
    }
    throw new Error(response.data.message || "Failed to delete event");
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to delete event";
  }
};

