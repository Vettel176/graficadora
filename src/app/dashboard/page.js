'use client';
import React, { useState } from 'react';
import { Box, Button, Collapse, Typography, Paper, Divider } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, BarChart as ChartIcon } from '@mui/icons-material';
import DashboardPersonalized from '../../components/Dashboard/DashboardPersonalized';
import Charts from '../../components/Charts/Charts';

export default function DashboardPage() {
  const [editingChart, setEditingChart] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  //Refresh page, after delete or update
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const handleEditTrigger = (chart) => {
    setEditingChart(chart); // 1. Guardamos la info
    setShowEditor(true);    // 2. Abrimos el Collapse
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* DASHBOARD CON LAS GRÁFICAS EXISTENTES */}
      <Box sx={{ mt: 2 }}>
        <DashboardPersonalized key={refreshKey} onEditChart={handleEditTrigger}/>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center', mb: 4 }}>
        <Button
          variant="contained"
          startIcon={showEditor ? <CloseIcon /> : <AddIcon />}
          color={showEditor ? "error" : "primary"}
          onClick={() => {
            if (showEditor) setEditingChart(null); // Limpiar si cerramos manualmente
            setShowEditor(!showEditor);
          }}
          sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
        >
          {showEditor ? "Cerrar Editor" : "Nueva Gráfica"}
        </Button>
      </Box>

      {/* COMPONENTE COLAPSABLE (EL EDITOR) */}
      <Collapse in={showEditor} unmountOnExit>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 5, 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px',
            backgroundColor: '#f8fafc' 
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <ChartIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: '600' }}>
              Editor de Gráficas / Widgets SQL
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          {showEditor && (
          <Charts editData={editingChart} 
            onFinished={() => {
            setEditingChart(null);
            setShowEditor(false);
            //Actualizacion de pagina para ver cambios al terminar
            handleRefresh();
          }} 
        />
          )}
        </Paper>
      </Collapse>
    </Box>
  );
}