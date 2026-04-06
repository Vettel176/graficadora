'use client';
import React, { useState } from 'react';
import { 
  Box, CssBaseline, Drawer, AppBar, Toolbar, List, 
  Typography, Divider, IconButton, ListItem, 
  ListItemButton, ListItemIcon, ListItemText, Badge, Avatar 
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Home as HomeIcon, 
  BarChart as ChartIcon, 
  Dashboard as DashIcon,
  Notifications as NotificationsIcon,
  AccountCircle
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

const drawerWidth = 240;

export default function RootLayout({ children }) {
  const router = useRouter();
  
  return (
    <html lang="es">
      <body>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          
          {/* HEADER */}
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#1e293b' }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <Typography variant="h6" noWrap component="div">
                SQL Dashboard Builder 🚀
              </Typography>
              <Box>
                <IconButton color="inherit">
                  <Badge badgeContent={4} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
                <IconButton color="inherit">
                  <Avatar sx={{ width: 32, height: 32, ml: 1 }}>U</Avatar>
                </IconButton>
              </Box>
            </Toolbar>
          </AppBar>

          {/* SIDEBAR */}
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', backgroundColor: '#f8fafc' },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                {[
                  { text: 'Home', icon: <HomeIcon />, path: '/' },
                  { text: 'Configuracion', icon: <ChartIcon />, path: '/configuracion' },
                  { text: 'Dashboard', icon: <DashIcon />, path: '/dashboard' },
                ].map((item) => (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton onClick={() => router.push(item.path)}>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>

          {/* CONTENIDO PRINCIPAL */}
          <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Toolbar />
            <Box sx={{ flex: 1 }}>
              {children}
            </Box>
            
            {/* FOOTER */}
            <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
              <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} SQL Chart Sandbox - Desarrollado con Next.js 14
              </Typography>
            </Box>
          </Box>
        </Box>
      </body>
    </html>
  );
}