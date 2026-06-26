import { Card, CardContent, Stack, Typography } from "@mui/material";

function SectionCard({ title, action, children, sx }) {
  return (
    <Card
      sx={{
        borderRadius: 4,
        border: "1px solid rgba(15, 23, 42, 0.06)",
        boxShadow: "0 14px 40px rgba(15, 23, 42, 0.08)",
        ...sx,
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.25, xl: 2.5 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={1.75}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: { xs: 14.5, md: 15.5, xl: 16 }, fontWeight: 700 }}
            noWrap
          >
            {title}
          </Typography>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

export default SectionCard;
