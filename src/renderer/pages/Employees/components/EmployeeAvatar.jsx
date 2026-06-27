import { Avatar, Badge, styled } from "@mui/material";

const StyledBadge = styled(Badge)(({ theme, ownerState }) => ({
  "& .MuiBadge-badge": {
    backgroundColor:
      ownerState.status === "Đang làm việc" ? "#10b981" : "#ef4444",
    color: ownerState.status === "Đang làm việc" ? "#10b981" : "#ef4444",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation:
        ownerState.status === "Đang làm việc"
          ? "ripple 1.2s infinite ease-in-out"
          : "none",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

function EmployeeAvatar({ src, name, status, size = 25 }) {
  const avatar = (
    <Avatar src={src} alt={name} sx={{ width: size, height: size }} />
  );

  if (status) {
    return (
      <StyledBadge
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        variant="dot"
        ownerState={{ status }}
      >
        {avatar}
      </StyledBadge>
    );
  }

  return avatar;
}

export default EmployeeAvatar;
