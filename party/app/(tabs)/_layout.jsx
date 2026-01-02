import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopColor: "#1a1a1a",
        },
        tabBarActiveTintColor: "#9333EA",
        tabBarInactiveTintColor: "#666666",
      }}
    >
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
        }}
      />
    </Tabs>
  );
}

