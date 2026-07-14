import { useState } from "react";
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Checkbox, 
  FormControlLabel, 
  Stack, 
  TextField, 
  Typography, 
  Alert,
  InputAdornment,
  IconButton
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await login(username, password, rememberMe);
    
    setLoading(false);
    
    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <Box sx={{ display: "flex", width: "100vw", height: "100vh", bgcolor: "background.default" }}>
      {/* Left Side - Branding (45%) */}
      <Box 
        sx={{ 
          width: "45%", 
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 6
        }}
      >
        <Stack spacing={4} alignItems="center" textAlign="center">
          <Box 
            component="img" 
            src="/vite.svg" 
            alt="Logo" 
            sx={{ width: 120, height: 120, filter: "brightness(0) invert(1)" }} 
          />
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              {APP_NAME}
            </Typography>
            <Typography variant="h6" fontWeight={400} sx={{ opacity: 0.9 }}>
              Hệ thống quản lý và thống kê sản xuất
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Right Side - Login Form (55%) */}
      <Box 
        sx={{ 
          width: "55%", 
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 4
        }}
      >
        <Card sx={{ width: "100%", maxWidth: 480, p: 2 }}>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight={700} gutterBottom color="text.primary">
                    Đăng nhập
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Vui lòng đăng nhập để tiếp tục
                  </Typography>
                </Box>

                {error && <Alert severity="error">{error}</Alert>}

                <Stack spacing={3}>
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
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.5, fontSize: "1rem" }}
                >
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
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
