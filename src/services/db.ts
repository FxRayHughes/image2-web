import { DB_NAME, DB_STORE, DB_VER } from "./config";

export interface HistoryRecord {
  id?: number;
  time: number;
  mode: "generate" | "cutout";
  prompt: string;
  size: string;
  quality: string;
  format: string;
  n: number;
  blobs: Blob[];
}

let db: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (database.objectStoreNames.contains(DB_STORE)) {
        database.deleteObjectStore(DB_STORE);
      }
      const store = database.createObjectStore(DB_STORE, {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("time", "time");
    };
    req.onsuccess = () => {
      db = req.result;
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
}

export function addHistory(record: HistoryRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db!.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).add(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function getAllHistory(): Promise<HistoryRecord[]> {
  return new Promise((resolve, reject) => {
    const tx = db!.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).index("time").openCursor(null, "prev");
    const results: HistoryRecord[] = [];
    req.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export function deleteHistory(id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db!.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function clearHistory(): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db!.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
