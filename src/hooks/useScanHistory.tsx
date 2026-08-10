import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import {
  createHistoryItem,
  HISTORY_STORAGE_KEY,
  NewScanHistoryItem,
  parseStoredHistory,
  prependHistory,
  ScanHistoryItem,
  serializeHistory,
} from "@/lib/history";

const HISTORY_IMAGE_DIRECTORY = "scan-history";
const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);

type ScanHistoryContextValue = {
  history: ScanHistoryItem[];
  loading: boolean;
  error: string | null;
  addScan: (scan: NewScanHistoryItem) => Promise<ScanHistoryItem>;
  clearHistory: () => Promise<void>;
  reloadHistory: () => Promise<void>;
};

const ScanHistoryContext = createContext<ScanHistoryContextValue | null>(null);

function getHistoryImageDirectory(): Directory {
  return new Directory(Paths.document, HISTORY_IMAGE_DIRECTORY);
}

function isManagedHistoryImage(uri: string): boolean {
  if (Platform.OS === "web") return false;
  const directoryUri = getHistoryImageDirectory().uri;
  const prefix = directoryUri.endsWith("/") ? directoryUri : `${directoryUri}/`;
  return uri.startsWith(prefix);
}

function safeFilenameId(id: string): string {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  return safe || `scan-${Date.now()}`;
}

function imageExtension(source: File): string {
  const extension = source.extension.toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.has(extension) ? extension : ".jpg";
}

async function persistHistoryImage(
  sourceUri: string,
  itemId: string
): Promise<{ uri?: string; createdUri?: string }> {
  if (Platform.OS === "web") return { uri: sourceUri };

  if (isManagedHistoryImage(sourceUri)) {
    const existing = new File(sourceUri);
    return existing.exists ? { uri: sourceUri } : {};
  }

  const source = new File(sourceUri);
  if (!source.exists) return {};

  const directory = getHistoryImageDirectory();
  directory.create({ idempotent: true, intermediates: true });
  const destination = new File(
    directory,
    `${safeFilenameId(itemId)}${imageExtension(source)}`
  );
  await source.copy(destination, { overwrite: true });
  return { uri: destination.uri, createdUri: destination.uri };
}

function deleteManagedHistoryImage(uri: string | undefined): void {
  if (!uri || !isManagedHistoryImage(uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn("Failed to remove a stored scan image:", error);
  }
}

function deleteManagedHistoryDirectory(): void {
  if (Platform.OS === "web") return;
  try {
    const directory = getHistoryImageDirectory();
    if (directory.exists) directory.delete();
  } catch (error) {
    console.warn("Failed to remove stored scan images:", error);
  }
}

async function makeImageDurable(
  item: ScanHistoryItem
): Promise<{ item: ScanHistoryItem; createdUri?: string }> {
  const sourceUri = item.imageUri ?? item.result?.imageUri;
  if (!sourceUri) return { item: { ...item, result: undefined } };

  try {
    const persisted = await persistHistoryImage(sourceUri, item.id);
    return {
      item: {
        ...item,
        imageUri: persisted.uri,
        result:
          item.result && persisted.uri
            ? { ...item.result, imageUri: persisted.uri }
            : undefined,
      },
      createdUri: persisted.createdUri,
    };
  } catch (error) {
    console.warn("Failed to preserve a scan image:", error);
    return {
      item: { ...item, imageUri: undefined, result: undefined },
    };
  }
}

export function ScanHistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<ScanHistoryItem[]>([]);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  const loadHistory = useCallback((): Promise<void> => {
    if (loadPromiseRef.current) return loadPromiseRef.current;

    setLoading(true);
    setError(null);
    const loadPromise = (async () => {
      const createdImages: string[] = [];
      try {
        const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
        const parsed = parseStoredHistory(stored);
        const durableItems: ScanHistoryItem[] = [];
        for (const item of parsed) {
          const durable = await makeImageDurable(item);
          durableItems.push(durable.item);
          if (durable.createdUri) createdImages.push(durable.createdUri);
        }

        await AsyncStorage.setItem(HISTORY_STORAGE_KEY, serializeHistory(durableItems));
        historyRef.current = durableItems;
        setHistory(durableItems);
      } catch (loadError) {
        createdImages.forEach(deleteManagedHistoryImage);
        console.error("Failed to load scan history:", loadError);
        historyRef.current = [];
        setHistory([]);
        setError("Scan history could not be loaded from this device.");
      } finally {
        setLoading(false);
      }
    })();
    loadPromiseRef.current = loadPromise;
    return loadPromise;
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const enqueueWrite = useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
    const next = writeQueueRef.current.then(operation, operation);
    writeQueueRef.current = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }, []);

  const addScan = useCallback(
    (scan: NewScanHistoryItem): Promise<ScanHistoryItem> =>
      enqueueWrite(async () => {
        await loadHistory();
        const timestamp = Date.now();
        const id = `${timestamp}-${Math.random().toString(36).slice(2, 10)}`;
        const candidate = createHistoryItem(scan, id, timestamp);
        const durable = await makeImageDurable(candidate);
        const { history: updated, removed } = prependHistory(
          historyRef.current,
          durable.item
        );

        try {
          await AsyncStorage.setItem(HISTORY_STORAGE_KEY, serializeHistory(updated));
        } catch (storageError) {
          deleteManagedHistoryImage(durable.createdUri);
          throw storageError;
        }

        historyRef.current = updated;
        setHistory(updated);
        setError(null);
        removed.forEach((item) => deleteManagedHistoryImage(item.imageUri));
        return durable.item;
      }),
    [enqueueWrite, loadHistory]
  );

  const clearHistory = useCallback(
    (): Promise<void> =>
      enqueueWrite(async () => {
        await loadHistory();
        await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
        historyRef.current = [];
        setHistory([]);
        setError(null);
        deleteManagedHistoryDirectory();
      }),
    [enqueueWrite, loadHistory]
  );

  const reloadHistory = useCallback(
    (): Promise<void> =>
      enqueueWrite(async () => {
        loadPromiseRef.current = null;
        await loadHistory();
      }),
    [enqueueWrite, loadHistory]
  );

  const value = useMemo<ScanHistoryContextValue>(
    () => ({
      history,
      loading,
      error,
      addScan,
      clearHistory,
      reloadHistory,
    }),
    [addScan, clearHistory, error, history, loading, reloadHistory]
  );

  return (
    <ScanHistoryContext.Provider value={value}>
      {children}
    </ScanHistoryContext.Provider>
  );
}

export function useScanHistory(): ScanHistoryContextValue {
  const value = useContext(ScanHistoryContext);
  if (!value) {
    throw new Error("useScanHistory must be used inside ScanHistoryProvider");
  }
  return value;
}

export type { ScanHistoryItem } from "@/lib/history";
