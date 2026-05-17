import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar, Toolbar, Tabs, Tab, IconButton, Typography, Drawer, Box,
  useMediaQuery, useTheme,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SettingsIcon from "@mui/icons-material/Settings";
import { useAppDispatch, useThemeMode } from "../context/AppContext";
import { LS_THEME_KEY } from "../services/config";
import LeftPanel from "./LeftPanel";
import QueueDrawer from "./QueueDrawer";
import ConfigModal from "./ConfigModal";
import Toast from "./Toast";

const DRAWER_WIDTH = 360;

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { mode, setMode } = useThemeMode();

  const tabPaths = ["/generate", "/gallery", "/prompts"];
  const currentTab = tabPaths.findIndex((p) => location.pathname.startsWith(p));
  const activeTab = currentTab >= 0 ? currentTab : 0;

  function toggleTheme() {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    localStorage.setItem(LS_THEME_KEY, next);
  }

  const leftPanelContent = <LeftPanel />;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" sx={{ bgcolor: "background.paper" }} elevation={0}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          {!isDesktop && (
            <IconButton size="small" onClick={() => setMobileDrawerOpen(true)} sx={{ mr: 1 }}>
              <SettingsIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            sx={{
              fontSize: 16,
              fontWeight: 700,
              background: "linear-gradient(135deg, #6e6e8a, #a0a0b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              flexShrink: 0,
            }}
          >
            GPT-Image-2
          </Typography>
          <Tabs
            value={activeTab}
            onChange={(_, v) => navigate(tabPaths[v])}
            sx={{ ml: 2, minHeight: 40, "& .MuiTab-root": { minHeight: 40, py: 0 } }}
          >
            <Tab label="生成" />
            <Tab label="图库" />
            <Tab label="提示词" />
          </Tabs>
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={toggleTheme} size="small">
            {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
          <IconButton onClick={() => dispatch({ type: "SET_CONFIG_MODAL", open: true })} size="small">
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {isDesktop && (
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: DRAWER_WIDTH,
                position: "relative",
                height: "100%",
                bgcolor: "background.paper",
              },
            }}
          >
            {leftPanelContent}
          </Drawer>
        )}

        {!isDesktop && (
          <Drawer
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, maxWidth: "90vw", bgcolor: "background.paper" } }}
          >
            {leftPanelContent}
          </Drawer>
        )}

        <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
          <Outlet />
        </Box>
      </Box>

      <QueueDrawer />
      <ConfigModal />
      <Toast />
    </Box>
  );
}
