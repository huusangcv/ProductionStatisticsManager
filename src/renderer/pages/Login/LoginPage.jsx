import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, LockOutlined, PersonOutline } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { APP_NAME } from "../../constants/app";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const { login, savedUsername } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(savedUsername);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(!!savedUsername);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appVersion, setAppVersion] = useState("v0.1.0");

  useEffect(() => {
    window.electronAPI?.window?.setLoginMode?.();
    window.electronAPI?.app?.getVersion?.().then((result) => {
      if (result?.version) {
        setAppVersion(`v${result.version}`);
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await login(username, password, rememberMe);

    if (result.success) {
      navigate("/dashboard", { replace: true });
      return;
    }

    setLoading(false);
    setError(result.message);
  };

  return (
    <Box
      sx={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      {/* Left panel — branding + future slideshow slot */}
      <Box
        sx={{
          width: "45%",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 4,
            py: 3,
          }}
        >
          <Stack spacing={2.5} alignItems="center" textAlign="center" sx={{ maxWidth: 360 }}>
            <Typography variant="h5" fontWeight={700} lineHeight={1.3}>
              {APP_NAME}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, letterSpacing: 0.4 }}>
              Hệ thống Quản lý Dữ liệu Nội bộ
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Thống Kê Sản Xuất
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.75 }}>
              Module: Cắt & Mài
            </Typography>
          </Stack>
        </Box>

        <Typography
          variant="caption"
          sx={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", opacity: 0.65 }}
        >
          {appVersion}
        </Typography>
      </Box>

      {/* Right panel — login form */}
      <Box
        sx={{
          width: "55%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: 3,
        }}
      >
        <Card
          elevation={2}
          sx={{
            width: 420,
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
          }}
        >
          <CardContent sx={{ p: "36px" }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                    Đăng nhập
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vui lòng đăng nhập để tiếp tục
                  </Typography>
                </Box>

                {error && <Alert severity="error">{error}</Alert>}

                <Stack spacing={2.5}>
                  <TextField
                    label="Tên đăng nhập"
                    variant="outlined"
                    fullWidth
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutline />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Mật khẩu"
                    type={showPassword ? "text" : "password"}
                    variant="outlined"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            disabled={loading}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={loading}
                        color="primary"
                      />
                    }
                    label={<Typography variant="body2">Ghi nhớ đăng nhập</Typography>}
                  />
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                  sx={{ height: 48, fontSize: "0.95rem", textTransform: "none" }}
                >
                  {loading ? (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CircularProgress size={20} color="inherit" />
                      <span>Signing in...</span>
                    </Stack>
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default LoginPage;
