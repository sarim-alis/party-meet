import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, RefreshControl, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import DateTimePicker from "@react-native-community/datetimepicker";
import { logout, getUser } from "../../services/auth";
import { getEvents, createEvent, deleteEvent, joinEvent, leaveEvent } from "../../services/event";

const CATEGORIES = ["All", "Party", "Meeting", "Concert", "Festival", "Other"];

const CATEGORY_COLORS = {
  Party: "#9333EA",
  Meeting: "#3B82F6",
  Concert: "#F97316",
  Festival: "#10B981",
  Other: "#6B7280",
};

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState("all"); // 'all' or 'joined'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newEvent, setNewEvent] = useState({ name: "", date: "", location: "", category: "Party" });
  const router = useRouter();

  useEffect(() => {
    checkUserRole();
    loadEvents();
  }, [selectedCategory, viewMode]);

  const checkUserRole = async () => {
    const user = await getUser();
    setIsAdmin(user?.isAdmin || false);
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Admin always sees all events, users can toggle between all and joined
      const view = isAdmin ? "all" : viewMode;
      const result = await getEvents(selectedCategory === "All" ? null : selectedCategory, view);
      setEvents(result.events || []);
      setIsAdmin(result.isAdmin || false);
    } catch (error) {
      Toast.show({ type: "error", text1: "Error", text2: error.toString() });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.name || !newEvent.date || !newEvent.location) {
      Toast.show({ type: "error", text1: "Error", text2: "Please fill in all fields" });
      return;
    }

    try {
      await createEvent(newEvent);
      Toast.show({ type: "success", text1: "Success", text2: "Event created successfully!" });
      setShowAddModal(false);
      setNewEvent({ name: "", date: "", location: "", category: "Party" });
      loadEvents();
    } catch (error) {
      Toast.show({ type: "error", text1: "Error", text2: error.toString() });
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      await joinEvent(eventId);
      Toast.show({ type: "success", text1: "Success", text2: "Successfully joined event!" });
      loadEvents();
    } catch (error) {
      Toast.show({ type: "error", text1: "Error", text2: error.toString() });
    }
  };

  const handleLeaveEvent = async (eventId) => {
    try {
      await leaveEvent(eventId);
      Toast.show({ type: "success", text1: "Success", text2: "Successfully left event!" });
      loadEvents();
    } catch (error) {
      Toast.show({ type: "error", text1: "Error", text2: error.toString() });
    }
  };

  const handleDeleteEvent = (eventId) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEvent(eventId);
            Toast.show({ type: "success", text1: "Success", text2: "Event deleted successfully!" });
            loadEvents();
          } catch (error) {
            Toast.show({ type: "error", text1: "Error", text2: error.toString() });
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const renderEventItem = ({ item }) => (
    <View style={[styles.eventCard, { borderLeftColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other }]}>
      <View style={styles.eventHeader}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventName}>{item.name}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
      </View>
      <View style={styles.eventDetails}>
        <View style={styles.eventDetailRow}>
          <Ionicons name="calendar-outline" size={16} color="#A0A0A0" />
          <Text style={styles.eventDetailText}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.eventDetailRow}>
          <Ionicons name="location-outline" size={16} color="#A0A0A0" />
          <Text style={styles.eventDetailText}>{item.location}</Text>
        </View>
        {item.createdBy && (
          <View style={styles.eventDetailRow}>
            <Ionicons name="person-outline" size={16} color="#A0A0A0" />
            <Text style={styles.eventDetailText}>Created by: {item.createdBy.username}</Text>
          </View>
        )}
        <View style={styles.eventDetailRow}>
          <Ionicons name="people-outline" size={16} color="#A0A0A0" />
          <Text style={styles.eventDetailText}>{item.participantsCount || 0} participants</Text>
        </View>
      </View>
      {!isAdmin && (
        <TouchableOpacity
          onPress={() => (item.isJoined ? handleLeaveEvent(item.id) : handleJoinEvent(item.id))}
          style={[styles.joinButton, item.isJoined && styles.leaveButton]}
        >
          <Text style={styles.joinButtonText}>{item.isJoined ? "Leave Event" : "Join Event"}</Text>
        </TouchableOpacity>
      )}
      {isAdmin && (
        <TouchableOpacity onPress={() => handleDeleteEvent(item.id)} style={styles.deleteEventButton}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={styles.deleteEventText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Events</Text>
          {!isAdmin && (
            <View style={styles.viewModeContainer}>
              <TouchableOpacity
                onPress={() => setViewMode("all")}
                style={[styles.viewModeButton, viewMode === "all" && styles.viewModeButtonActive]}
              >
                <Text style={[styles.viewModeText, viewMode === "all" && styles.viewModeTextActive]}>All Events</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode("joined")}
                style={[styles.viewModeButton, viewMode === "joined" && styles.viewModeButtonActive]}
              >
                <Text style={[styles.viewModeText, viewMode === "joined" && styles.viewModeTextActive]}>My Events</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              style={[styles.categoryButton, selectedCategory === item && styles.categoryButtonActive]}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === item && styles.categoryButtonTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Events List */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEventItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEvents} tintColor="#9333EA" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#666666" />
            <Text style={styles.emptyText}>
              {viewMode === "joined" ? "You haven't joined any events" : "No events found"}
            </Text>
            <Text style={styles.emptySubtext}>
              {isAdmin ? "Tap + to create your first event" : viewMode === "joined" ? "Browse events to join" : "No events available"}
            </Text>
          </View>
        }
      />

      {/* Add Event Button (Admin Only) */}
      {isAdmin && (
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButtonContainer}>
          <LinearGradient colors={["#9333EA", "#F97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addButton}>
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Add Event Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Event</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Event Name"
              placeholderTextColor="#A0A0A0"
              value={newEvent.name}
              onChangeText={(text) => setNewEvent({ ...newEvent, name: text })}
            />

            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <View style={styles.dateInputContainer}>
                <Ionicons name="calendar-outline" size={20} color="#A0A0A0" />
                <Text style={[styles.dateInputText, !newEvent.date && styles.dateInputPlaceholder]}>
                  {newEvent.date ? formatDate(newEvent.date) : "Start Date"}
                </Text>
              </View>
            </TouchableOpacity>

            {Platform.OS === "ios" && showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="datetime"
                display="spinner"
                onChange={(event, date) => {
                  if (date) {
                    setSelectedDate(date);
                    const formattedDate = date.toISOString().slice(0, 16);
                    setNewEvent({ ...newEvent, date: formattedDate });
                  }
                }}
                minimumDate={new Date()}
              />
            )}
            
            {Platform.OS === "android" && (
              <Modal transparent animationType="slide" visible={showDatePicker}>
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <Text style={styles.datePickerTitle}>Select Date & Time</Text>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={selectedDate}
                      mode="datetime"
                      display="default"
                      onChange={(event, date) => {
                        if (event.type === "set" && date) {
                          setSelectedDate(date);
                          const formattedDate = date.toISOString().slice(0, 16);
                          setNewEvent({ ...newEvent, date: formattedDate });
                        }
                        setShowDatePicker(false);
                      }}
                      minimumDate={new Date()}
                    />
                  </View>
                </View>
              </Modal>
            )}

            <TextInput
              style={styles.input}
              placeholder="Location"
              placeholderTextColor="#A0A0A0"
              value={newEvent.location}
              onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
            />

            <View style={styles.categorySelector}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryOptions}>
                {CATEGORIES.filter((c) => c !== "All").map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => setNewEvent({ ...newEvent, category })}
                    style={[styles.categoryOption, newEvent.category === category && { backgroundColor: CATEGORY_COLORS[category] }]}
                  >
                    <Text style={[styles.categoryOptionText, newEvent.category === category && styles.categoryOptionTextActive]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={handleAddEvent} style={styles.saveButtonContainer}>
              <LinearGradient colors={["#9333EA", "#F97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Create Event</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  viewModeContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#1a1a1a",
  },
  viewModeButtonActive: {
    backgroundColor: "#9333EA",
  },
  viewModeText: {
    color: "#A0A0A0",
    fontSize: 12,
    fontWeight: "500",
  },
  viewModeTextActive: {
    color: "#FFFFFF",
  },
  logoutButton: {
    padding: 8,
  },
  categoryContainer: {
    paddingVertical: 16,
    paddingLeft: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: "#9333EA",
  },
  categoryButtonText: {
    color: "#A0A0A0",
    fontSize: 14,
    fontWeight: "500",
  },
  categoryButtonTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  eventCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    padding: 4,
  },
  eventDetails: {
    gap: 8,
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventDetailText: {
    color: "#A0A0A0",
    fontSize: 14,
  },
  joinButton: {
    backgroundColor: "#9333EA",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  leaveButton: {
    backgroundColor: "#EF4444",
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#A0A0A0",
    marginTop: 8,
    textAlign: "center",
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteEventButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    gap: 6,
  },
  deleteEventText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  input: {
    backgroundColor: "#000000",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  categorySelector: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  categoryOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#333333",
  },
  categoryOptionText: {
    color: "#A0A0A0",
    fontSize: 14,
    fontWeight: "500",
  },
  categoryOptionTextActive: {
    color: "#FFFFFF",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateInputText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  dateInputPlaceholder: {
    color: "#A0A0A0",
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  datePickerContainer: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  saveButtonContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
