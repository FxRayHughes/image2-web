import { createTheme } from "@mui/material/styles";

const shared = {
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: `-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`,
    fontSize: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 } as const,
        contained: {
          background: "linear-gradient(135deg, #2a2a3a 0%, #1a1a2e 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          "&:hover": {
            background: "linear-gradient(135deg, #35354a 0%, #252540 100%)",
          },
        } as const,
      },
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
    background: { default: "#08080c", paper: "#111118" },
    text: { primary: "#d4d4dc", secondary: "#6e6e80" },
    primary: { main: "#7c7c96", light: "#a0a0b8", dark: "#4a4a60" },
    error: { main: "#e05252" },
    success: { main: "#3dbd6e" },
    info: { main: "#5a8fd4" },
    divider: "rgba(255,255,255,0.06)",
  },
  components: {
    ...shared.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(180deg, #0e0e14 0%, #111118 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        } as const,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        } as const,
        outlined: {
          borderColor: "rgba(255,255,255,0.06)",
        } as const,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.03)",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.12)",
          },
        } as const,
        notchedOutline: {
          borderColor: "rgba(255,255,255,0.06)",
        } as const,
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { backgroundColor: "rgba(255,255,255,0.03)" } as const,
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: "none",
          background: "linear-gradient(180deg, #0e0e14 0%, #111118 100%)",
        } as const,
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255,255,255,0.06)",
          "&.Mui-selected": {
            background: "linear-gradient(135deg, #2a2a3e 0%, #1e1e30 100%)",
            color: "#d4d4dc",
            borderColor: "rgba(255,255,255,0.12)",
            "&:hover": {
              background: "linear-gradient(135deg, #32324a 0%, #262640 100%)",
            },
          },
        } as const,
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #1e1e2e 0%, #14141f 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#a0a0b8",
          "&:hover": {
            background: "linear-gradient(135deg, #28283c 0%, #1c1c2c 100%)",
          },
        } as const,
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255,255,255,0.08)",
        } as const,
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: "linear-gradient(90deg, #5a5a7a, #7c7c96)",
          height: 2,
        } as const,
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: "#6e6e80",
          "&.Mui-selected": { color: "#d4d4dc" },
        } as const,
      },
    },
  },
});

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: "light",
    background: { default: "#f0f0f2", paper: "#fafafe" },
    text: { primary: "#18181e", secondary: "#5c5c6e" },
    primary: { main: "#4a4a60", light: "#6e6e84", dark: "#2e2e42" },
    error: { main: "#c93535" },
    success: { main: "#1a8a45" },
    info: { main: "#2e6fb8" },
    divider: "#dcdce4",
  },
  components: {
    ...shared.components,
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 } as const,
        contained: {
          background: "linear-gradient(135deg, #3a3a50 0%, #2a2a3e 100%)",
          color: "#fff",
          "&:hover": {
            background: "linear-gradient(135deg, #46465e 0%, #36364c 100%)",
          },
        } as const,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { backgroundColor: "#ffffff" } as const },
    },
    MuiSelect: {
      styleOverrides: { root: { backgroundColor: "#ffffff" } as const },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(180deg, #fafafe 0%, #f0f0f4 100%)",
          borderBottom: "1px solid #dcdce4",
        } as const,
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: "linear-gradient(90deg, #3a3a50, #4a4a60)",
          height: 2,
        } as const,
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            background: "linear-gradient(135deg, #3a3a50 0%, #2e2e42 100%)",
            color: "#fff",
            "&:hover": {
              background: "linear-gradient(135deg, #46465e 0%, #3a3a50 100%)",
            },
          },
        } as const,
      },
    },
  },
});
