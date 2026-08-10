import React from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScanScreen } from "./src/screens/ScanScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import AboutScreen from "./src/screens/AboutScreen";
import type { ScanResult } from "./src/types";
import { ScanHistoryProvider } from "./src/hooks/useScanHistory";

export type RootStackParamList = {
  Scan: undefined;
  Result: { result: ScanResult };
};

export type RootTabParamList = {
  Scan: undefined;
  History: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  return (
    <ScanHistoryProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Scan" component={TabNavigator} />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{ headerShown: true, title: "Diagnosis", presentation: "modal" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ScanHistoryProvider>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#4C7A3D",
        tabBarInactiveTintColor: "#7B8C74",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        tabBarStyle: { height: 66, paddingTop: 7, paddingBottom: 8, backgroundColor: "#FFFFFF" },
        tabBarIcon: ({ color, size }) => {
          const symbol = route.name === "Scan" ? "⌾" : route.name === "History" ? "▤" : "ⓘ";
          return <Text style={{ color, fontSize: size - 2, fontWeight: "800" }}>{symbol}</Text>;
        },
      })}
    >
      <Tab.Screen name="Scan" component={ScanScreen} options={{ tabBarLabel: "Scan" }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: "History" }} />
      <Tab.Screen name="About" component={AboutScreen} options={{ tabBarLabel: "About" }} />
    </Tab.Navigator>
  );
}
