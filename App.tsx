import React from "react";
import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar } from "expo-status-bar";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScanScreen } from "./src/screens/ScanScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import AboutScreen from "./src/screens/AboutScreen";
import type { ScanResult } from "./src/types";
import { ScanHistoryProvider } from "./src/hooks/useScanHistory";
import { I18nProvider, useI18n } from "./src/i18n";
import { colors, shadows } from "./src/theme";

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
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.canvas,
    card: colors.surface,
    text: colors.ink,
    border: colors.border,
    notification: colors.warning,
  },
};

export default function App() {
  return (
    <I18nProvider>
      <ScanHistoryProvider>
        <StatusBar style="dark" />
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Scan" component={TabNavigator} />
            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{ presentation: "modal" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ScanHistoryProvider>
    </I18nProvider>
  );
}

function TabNavigator() {
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: styles.tabBar,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, focused }) => {
          const icon =
            route.name === "Scan"
              ? focused
                ? "scan"
                : "scan-outline"
              : route.name === "History"
                ? focused
                  ? "time"
                  : "time-outline"
                : focused
                  ? "shield-checkmark"
                  : "shield-checkmark-outline";
          return (
            <View style={[styles.tabIcon, focused ? styles.tabIconActive : undefined]}>
              <Ionicons name={icon} color={color} size={21} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Scan" component={ScanScreen} options={{ tabBarLabel: t("nav.scan") }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: t("nav.history") }} />
      <Tab.Screen name="About" component={AboutScreen} options={{ tabBarLabel: t("nav.about") }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    paddingTop: 7,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.card,
  },
  tabItem: { paddingVertical: 1 },
  tabLabel: { fontSize: 11, lineHeight: 14, fontWeight: "800" },
  tabIcon: {
    width: 38,
    height: 30,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconActive: { backgroundColor: colors.primaryLight },
});
