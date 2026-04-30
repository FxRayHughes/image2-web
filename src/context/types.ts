import type { ApiProfile } from "../services/config";

// ===== Result =====
export interface ResultItem {
  blob: Blob;
  url: string;
}

export interface CurrentResult {
  images: ResultItem[];
  format: string;
  mode: "generate" | "cutout";
}

// ===== Task Queue =====
export type TaskStatus = "running" | "done" | "error";

export interface GenerationTask {
  id: string;
  prompt: string;
  size: string;
  quality: string;
  format: string;
  n: number;
  referenceFiles: File[];
  status: TaskStatus;
  error?: string;
  blobs: Blob[];
  abortController: AbortController;
  createdAt: number;
}

// ===== Lightbox =====
export interface LightboxState {
  open: boolean;
  urls: string[];
  index: number;
}

// ===== Prompt History =====
export interface PromptHistoryItem {
  text: string;
  time: number;
}

// ===== App State =====
export interface AppState {
  configModalOpen: boolean;
  queueDrawerOpen: boolean;
  currentResult: CurrentResult | null;
  referenceFiles: File[];
  selectedSize: string;
  cutoutSourceFile: File | null;
  cutoutDevice: string;
  cutoutModel: string;
  cutoutModelState: { message: string; isError: boolean };
  tasks: GenerationTask[];
  activeTaskId: string | null;
  taskIdCounter: number;
  lightbox: LightboxState;
  toastMessage: string | null;
  promptHistory: PromptHistoryItem[];
  activeProfile: ApiProfile | null;
}

// ===== Actions =====
export type AppAction =
  | { type: "SET_CONFIG_MODAL"; open: boolean }
  | { type: "SET_QUEUE_DRAWER"; open: boolean }
  | { type: "TOGGLE_QUEUE_DRAWER" }
  | { type: "SET_CURRENT_RESULT"; payload: { images: ResultItem[]; format: string; mode: "generate" | "cutout" } }
  | { type: "ADD_REFERENCE_FILES"; files: File[] }
  | { type: "REMOVE_REFERENCE_FILE"; index: number }
  | { type: "SET_SELECTED_SIZE"; size: string }
  | { type: "SET_CUTOUT_SOURCE"; file: File | null }
  | { type: "SET_CUTOUT_DEVICE"; device: string }
  | { type: "SET_CUTOUT_MODEL"; model: string }
  | { type: "SET_CUTOUT_MODEL_STATE"; message: string; isError?: boolean }
  | { type: "ADD_TASK"; task: GenerationTask }
  | { type: "UPDATE_TASK"; id: string; updates: Partial<Pick<GenerationTask, "status" | "error" | "blobs">> }
  | { type: "REMOVE_TASK"; id: string }
  | { type: "SET_ACTIVE_TASK"; id: string | null }
  | { type: "INCREMENT_TASK_COUNTER" }
  | { type: "OPEN_LIGHTBOX"; urls: string[]; index: number }
  | { type: "CLOSE_LIGHTBOX" }
  | { type: "SHOW_TOAST"; message: string }
  | { type: "CLEAR_TOAST" }
  | { type: "SET_PROMPT_HISTORY"; items: PromptHistoryItem[] }
  | { type: "ADD_PROMPT_TO_HISTORY"; text: string }
  | { type: "REMOVE_PROMPT_FROM_HISTORY"; text: string }
  | { type: "SET_ACTIVE_PROFILE"; profile: ApiProfile | null };
