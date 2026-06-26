import { Card, CardContent, Container, Stack, Typography } from "@mui/material";

function LoginPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4">Login</Typography>
            <Typography variant="body2" color="text.secondary">
              Placeholder screen only. No login logic.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default LoginPage;
