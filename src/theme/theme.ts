import { createTheme } from "@mui/material/styles";

const shared = {
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: `-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`,
    fontSize: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 600 } as const },
    },
    MuiDrawer: {
      styleOverrides: { paper: { border: "none" } as const },
    },
    MuiDialog: {
      styleOverrides: { paper: { backgroundImage: "none" } as const },
    },
    MuiCard: {
      styleOverrides: { root: { backgroundImage: "none" } as const },
    },
  },
} as const;

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    background: { default: "#0d0d0d", paper: "#1a1a1a" },
    text: { primary: "#cccccc", secondary: "#888888" },
    primary: { main: "#a78bfa", light: "#c4b5fd" },
    error: { main: "#f87171" },
    success: { main: "#4ade80" },
    info: { main: "#60a5fa" },
    divider: "#2e2e2e",
  },
  components: {
    ...shared.components,
    MuiOutlinedInput: {
      styleOverrides: { root: { backgroundColor: "#242424" } as const },
    },
    MuiSelect: {
      styleOverrides: { root: { backgroundColor: "#242424" } as const },
    },
  },
});

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: "light",
    background: { default: "#f5f5f5", paper: "#ffffff" },
    text: { primary: "#1a1a1a", secondary: "#6b6b6b" },
    primary: { main: "#7c3aed", light: "#a78bfa" },
    error: { main: "#dc2626" },
    success: { main: "#16a34a" },
    info: { main: "#2563eb" },
    divider: "#e5e5e5",
  },
  components: {
    ...shared.components,
    MuiOutlinedInput: {
      styleOverrides: { root: { backgroundColor: "#ffffff" } as const },
    },
    MuiSelect: {
      styleOverrides: { root: { backgroundColor: "#ffffff" } as const },
    },
  },
});
