// src/components/layout/AppShell.jsx
import React, { memo } from 'react';
import Box from '@mui/material/Box';
import StatusBar from './StatusBar';

/**
 * AppShell – root layout: [Sidebar | Content] + StatusBar(28px)
 * Props:
 *   statusBarProps: props forwarded to StatusBar
 *   sidebar       : React.ReactNode
 *   children      : React.ReactNode (main content)
 */
const AppShell = memo(function AppShell({ statusBarProps, sidebar, children }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {sidebar}
        {children}
      </Box>

      <StatusBar {...statusBarProps} />
    </Box>
  );
});

export default AppShell;
