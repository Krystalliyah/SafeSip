// src/AuthDialog.js
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useAuth } from "./AuthContext";

const AuthDialog = ({ open, onClose }) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
        await loginWithGoogle();
        onClose(); // close dialog on success
        setEmail("");
        setPassword("");
    } catch (err) {
        console.error(err);
        setError(err.message || "Google sign-in failed");
    } finally {
        setGoogleLoading(false);
    }
    };


  const handleTabChange = (event, newValue) => {
    setMode(newValue);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      onClose(); // close dialog if success
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        <Tabs
          value={mode}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Login" value="login" />
          <Tab label="Register" value="register" />
        </Tabs>
      </DialogTitle>
      <DialogContent>
        <Box
            sx={{
            mt: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            }}
        >
            {/* Google login button */}
            <Button
            variant="outlined"
            fullWidth
            onClick={handleGoogleLogin}
            disabled={googleLoading || submitting}
            startIcon={<GoogleIcon />}
            sx={{ borderRadius: 8, textTransform: "none", fontWeight: 600 }}
            >
            {googleLoading ? "Signing in..." : "Continue with Google"}
            </Button>

            <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 1 }}
            >
            or use email and password
            </Typography>

            {/* Existing email/password form */}
            <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}
            >
            <TextField
                label="Email"
                type="email"
                required
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
                label="Password"
                type="password"
                required
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="At least 6 characters"
            />

            {error && (
                <Typography color="error" variant="body2">
                {error}
                </Typography>
            )}

            <DialogActions sx={{ px: 0, pt: 2 }}>
                <Button onClick={onClose} disabled={submitting || googleLoading}>
                Cancel
                </Button>
                <Button
                type="submit"
                variant="contained"
                disabled={submitting || googleLoading}
                >
                {mode === "login" ? "Login" : "Register"}
                </Button>
            </DialogActions>
            </Box>
        </Box>
      </DialogContent>

    </Dialog>
  );
};

export default AuthDialog;
