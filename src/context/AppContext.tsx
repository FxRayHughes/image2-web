import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { AppState, AppAction, GenerationTask } from "./types";
import { getActiveProfile, LS_PROMPT_HISTORY_KEY } from "../services/config";

function loadPromptHistory() {
  try {
    return JSON.parse(localStorage.getItem(LS_PROMPT_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function createInitialState(): AppState {
  return {
    configModalOpen: false,
    queueDrawerOpen: false,
    currentResult: null,
    referenceFiles: [],
    selectedSize: "auto",
    cutoutSourceFile: null,
    cutoutDevice: "gpu",
    cutoutModel: "medium",
    cutoutModelState: { message: "模型未加载", isError: false },
    tasks: [],
    activeTaskId: null,
    taskIdCounter: 0,
    lightbox: { open: false, urls: [], index: 0 },
    toastMessage: null,
    promptHistory: loadPromptHistory(),
    activeProfile: getActiveProfile(),
  };
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_CONFIG_MODAL":
      return { ...state, configModalOpen: action.open };
    case "SET_QUEUE_DRAWER":
      return { ...state, queueDrawerOpen: action.open };
    case "TOGGLE_QUEUE_DRAWER":
      return { ...state, queueDrawerOpen: !state.queueDrawerOpen };
    case "SET_CURRENT_RESULT":
      return { ...state, currentResult: action.payload };
    case "ADD_REFERENCE_FILES":
      return { ...state, referenceFiles: [...state.referenceFiles, ...action.files] };
    case "REMOVE_REFERENCE_FILE":
      return {
        ...state,
        referenceFiles: state.referenceFiles.filter((_, i) => i !== action.index),
      };
    case "SET_SELECTED_SIZE":
      return { ...state, selectedSize: action.size };
    case "SET_CUTOUT_SOURCE":
      return { ...state, cutoutSourceFile: action.file };
    case "SET_CUTOUT_DEVICE":
      return { ...state, cutoutDevice: action.device };
    case "SET_CUTOUT_MODEL":
      return { ...state, cutoutModel: action.model };
    case "SET_CUTOUT_MODEL_STATE":
      return {
        ...state,
        cutoutModelState: { message: action.message, isError: action.isError || false },
      };
    case "ADD_TASK":
      return {
        ...state,
        tasks: [action.task, ...state.tasks],
        activeTaskId: action.task.id,
        queueDrawerOpen: true,
      };
    case "UPDATE_TASK": {
      const tasks = state.tasks.map((t) =>
        t.id === action.id ? { ...t, ...action.updates } : t,
      );
      return { ...state, tasks };
    }
    case "REMOVE_TASK": {
      const task = state.tasks.find((t) => t.id === action.id);
      if (task && task.status === "running") {
        task.abortController.abort();
      }
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.id),
        activeTaskId: state.activeTaskId === action.id ? null : state.activeTaskId,
      };
    }
    case "SET_ACTIVE_TASK":
      return { ...state, activeTaskId: action.id };
    case "INCREMENT_TASK_COUNTER":
      return { ...state, taskIdCounter: state.taskIdCounter + 1 };
    case "OPEN_LIGHTBOX":
      return { ...state, lightbox: { open: true, urls: action.urls, index: action.index } };
    case "CLOSE_LIGHTBOX":
      return { ...state, lightbox: { ...state.lightbox, open: false } };
    case "SHOW_TOAST":
      return { ...state, toastMessage: action.message };
    case "CLEAR_TOAST":
      return { ...state, toastMessage: null };
    case "SET_PROMPT_HISTORY":
      return { ...state, promptHistory: action.items };
    case "ADD_PROMPT_TO_HISTORY": {
      const filtered = state.promptHistory.filter((i) => i.text !== action.text);
      const items = [{ text: action.text, time: Date.now() }, ...filtered];
      localStorage.setItem(LS_PROMPT_HISTORY_KEY, JSON.stringify(items));
      return { ...state, promptHistory: items };
    }
    case "REMOVE_PROMPT_FROM_HISTORY": {
      const items = state.promptHistory.filter((i) => i.text !== action.text);
      localStorage.setItem(LS_PROMPT_HISTORY_KEY, JSON.stringify(items));
      return { ...state, promptHistory: items };
    }
    case "SET_ACTIVE_PROFILE":
      return { ...state, activeProfile: action.profile };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  themeMode: "light" | "dark";
  setThemeMode: (mode: "light" | "dark") => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  themeMode,
  setThemeMode,
}: {
  children: ReactNode;
  themeMode: "light" | "dark";
  setThemeMode: (mode: "light" | "dark") => void;
}) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);
  return (
    <AppContext.Provider value={{ state, dispatch, themeMode, setThemeMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx.state;
}

export function useAppDispatch(): React.Dispatch<AppAction> {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppDispatch must be used within AppProvider");
  return ctx.dispatch;
}

export function useThemeMode() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useThemeMode must be used within AppProvider");
  return { mode: ctx.themeMode, setMode: ctx.setThemeMode };
}

export function createTask(
  counter: number,
  params: { prompt: string; size: string; quality: string; format: string; n: number; referenceFiles: File[] },
): GenerationTask {
  return {
    id: String(counter),
    prompt: params.prompt,
    size: params.size,
    quality: params.quality,
    format: params.format,
    n: params.n,
    referenceFiles: [...params.referenceFiles],
    status: "running",
    blobs: [],
    abortController: new AbortController(),
    createdAt: Date.now(),
  };
}
