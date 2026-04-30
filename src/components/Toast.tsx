import { useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import { useAppState, useAppDispatch } from "../context/AppContext";

export default function Toast() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (state.toastMessage) {
      const timer = setTimeout(() => dispatch({ type: "CLEAR_TOAST" }), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.toastMessage, dispatch]);

  return (
    <Snackbar
      open={!!state.toastMessage}
      autoHideDuration={2000}
      onClose={() => dispatch({ type: "CLEAR_TOAST" })}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity="success" variant="filled" sx={{ minWidth: 200 }}>
        {state.toastMessage}
      </Alert>
    </Snackbar>
  );
}
