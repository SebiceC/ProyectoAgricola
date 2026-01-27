import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

// Paleta de colores
const blueColors = {
  lighter: '#e6f7ff',   // Blue-1
  100: '#bae7ff',       // Blue-2
  200: '#91d5ff',       // Blue-3
  light: '#69c0ff',     // Blue-4
  400: '#40a9ff',       // Blue-5
  main: '#1890ff',      // Blue-6
  dark: '#096dd9',      // Blue-7
  700: '#0050b3',       // Blue-8
  darker: '#003a8c',    // Blue-9
  900: '#002766'        // Blue-10
};

// Componente de modal personalizable
const CustomAlertModal = ({ 
  open, 
  handleClose, 
  message = "Valor fuera de rango", 
  title = "Valor fuera de rango",
  severity = "error", // 'error', 'warning', 'info', 'success'
  maxWidth = "xs"
}) => {
  // Estilos según la severidad
  const getHeaderStyle = () => {
    switch (severity) {
      case 'error':
        return { backgroundColor: blueColors.main, color: '#fff' };
      case 'warning':
        return { backgroundColor: blueColors.dark, color: '#fff' };
      case 'info':
        return { backgroundColor: blueColors[400], color: '#fff' };
      case 'success':
        return { backgroundColor: blueColors.dark, color: '#fff' };
      default:
        return { backgroundColor: blueColors.main, color: '#fff' };
    }
  };

  // Color del botón según severidad
  const getButtonColor = () => {
    switch (severity) {
      case 'error':
        return blueColors.main;
      case 'warning':
        return blueColors.dark;
      case 'info':
        return blueColors[400];
      case 'success':
        return blueColors.dark;
      default:
        return blueColors.main;
    }
  };

  const StyledDialogTitle = styled(DialogTitle)(getHeaderStyle);
  
  const StyledDialogContent = styled(DialogContent)({
    padding: '24px 24px 16px',
    backgroundColor: blueColors.lighter
  });
  
  const StyledDialogActions = styled(DialogActions)({
    padding: '8px 24px 24px',
    backgroundColor: blueColors.lighter,
    justifyContent: 'center' // Centra el botón
  });
  
  const StyledDialogText = styled(DialogContentText)({
    color: '#000000DE', // Casi negro para mejor contraste
    textAlign: 'center',
    margin: '8px 0'
  });

  const StyledButton = styled(Button)({
    backgroundColor: getButtonColor(),
    color: '#fff',
    '&:hover': {
      backgroundColor: blueColors.dark,
    },
    padding: '8px 24px',
    borderRadius: '4px',
    textTransform: 'none',
    fontWeight: 500,
    minWidth: '120px'
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        style: {
          borderRadius: '8px',
          overflow: 'hidden'
        }
      }}
    >
      <StyledDialogTitle id="alert-dialog-title">
        {title}
      </StyledDialogTitle>
      <StyledDialogContent>
        <StyledDialogText id="alert-dialog-description">
          {message}
        </StyledDialogText>
      </StyledDialogContent>
    </Dialog>
  );
};

export default CustomAlertModal;