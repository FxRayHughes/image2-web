export const LS_KEY = "gpt_image_2_config";
export const LS_PROFILES_KEY = "gpt_image_2_profiles";
export const LS_ACTIVE_PROFILE = "gpt_image_2_active_profile";
export const LS_THEME_KEY = "gpt_image_2_theme";
export const LS_PROMPT_HISTORY_KEY = "gpt_image_2_prompt_history";
export const DB_NAME = "gpt_image_2_db";
export const DB_STORE = "history";
export const DB_VER = 2;
export const RMBG_MODULE_URL =
  "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm";
export const RESULT_SOURCE_LABELS: Record<string, string> = {
  generate: "生图结果",
  cutout: "抠图结果",
};

export interface ApiProfile {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
}

export interface AppConfig {
  apiUrl?: string;
  apiKey?: string;
}

export interface CutoutConfig {
  device: string;
  model: string;
  output: {
    format: string;
    quality: number;
    type: string;
  };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function loadProfiles(): ApiProfile[] {
  try {
    const raw = localStorage.getItem(LS_PROFILES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const legacy = loadLegacyConfig();
  if (legacy.apiUrl || legacy.apiKey) {
    const migrated: ApiProfile = {
      id: generateId(),
      name: "默认",
      apiUrl: legacy.apiUrl || "",
      apiKey: legacy.apiKey || "",
    };
    saveProfiles([migrated]);
    setActiveProfileId(migrated.id);
    return [migrated];
  }
  return [];
}

export function saveProfiles(profiles: ApiProfile[]): void {
  localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(profiles));
}

export function getActiveProfileId(): string | null {
  return localStorage.getItem(LS_ACTIVE_PROFILE);
}

export function setActiveProfileId(id: string): void {
  localStorage.setItem(LS_ACTIVE_PROFILE, id);
}

export function getActiveProfile(): ApiProfile | null {
  const profiles = loadProfiles();
  const activeId = getActiveProfileId();
  return profiles.find((p) => p.id === activeId) || profiles[0] || null;
}

export function addProfile(name: string, apiUrl: string, apiKey: string): ApiProfile {
  const profiles = loadProfiles();
  const profile: ApiProfile = { id: generateId(), name, apiUrl, apiKey };
  profiles.push(profile);
  saveProfiles(profiles);
  return profile;
}

export function updateProfile(id: string, data: Partial<Omit<ApiProfile, "id">>): void {
  const profiles = loadProfiles();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx >= 0) {
    Object.assign(profiles[idx], data);
    saveProfiles(profiles);
  }
}

export function deleteProfile(id: string): void {
  let profiles = loadProfiles();
  profiles = profiles.filter((p) => p.id !== id);
  saveProfiles(profiles);
  if (getActiveProfileId() === id && profiles.length) {
    setActiveProfileId(profiles[0].id);
  }
}

function loadLegacyConfig(): AppConfig {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function loadConfig(): AppConfig {
  const profile = getActiveProfile();
  if (profile) return { apiUrl: profile.apiUrl, apiKey: profile.apiKey };
  return loadLegacyConfig();
}

export function saveConfig(apiUrl: string, apiKey: string): void {
  localStorage.setItem(LS_KEY, JSON.stringify({ apiUrl, apiKey }));
}

export function getCutoutConfig(): CutoutConfig {
  const deviceEl = document.getElementById("cutoutDevice") as HTMLSelectElement;
  const modelEl = document.getElementById("cutoutModel") as HTMLSelectElement;
  return {
    device: deviceEl.value,
    model: modelEl.value,
    output: {
      format: "image/png",
      quality: 1,
      type: "foreground",
    },
  };
}
