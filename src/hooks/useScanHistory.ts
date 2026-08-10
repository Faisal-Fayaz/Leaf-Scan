import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@leafscan_history";
const MAX_HISTORY_ITEMS = 50;

export type ScanHistoryItem = {
  id: string;
  timestamp: number;
  imageUri?: string;
  diagnosis: string;
  confidence: number;
  type: "disease" | "pest" | "unknown";
  crop?: string;
  classId?: string;
  isAmbiguous?: boolean;
};

function isHistoryItem(value: unknown): value is ScanHistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ScanHistoryItem>;
  return (
    typeof item.id === "string" &&
    typeof item.timestamp === "number" &&
    typeof item.diagnosis === "string" &&
    typeof item.confidence === "number"
  );
}

export function useScanHistory() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const historyRef = useRef<ScanHistoryItem[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      const safeHistory = Array.isArray(parsed) ? parsed.filter(isHistoryItem) : [];
      historyRef.current = safeHistory;
      setHistory(safeHistory);
    } catch (error) {
      console.error("Failed to load scan history:", error);
      historyRef.current = [];
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const addScan = useCallback(async (scan: Omit<ScanHistoryItem, "id" | "timestamp">) => {
    const newScan: ScanHistoryItem = {
      ...scan,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    const updatedHistory = [newScan, ...historyRef.current].slice(0, MAX_HISTORY_ITEMS);
    historyRef.current = updatedHistory;
    setHistory(updatedHistory);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  }, []);

  const clearHistory = useCallback(async () => {
    historyRef.current = [];
    setHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    history,
    loading,
    addScan,
    clearHistory,
    reloadHistory: loadHistory,
  };
}
