import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTheme } from '../../contexts/ThemeContext';

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px',
  borderRadius: '4px',
  '&:hover': {
    background: theme.palette.mode === 'dark' 
      ? 'rgba(255, 167, 38, 0.1)' 
      : 'rgba(255, 152, 0, 0.1)',
  },
}));

interface LogoProps {
  variant?: 'small' | 'large';
  showSubtitle?: boolean;
}

const Logo: React.FC<LogoProps> = ({ variant = 'small', showSubtitle = false }) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  
  // Logo colors based on theme
  const logoColor = isDark ? '#ffa726' : '#ff9800';
  
  return (
    <LogoContainer>
      <Typography
        variant={variant === 'small' ? 'h6' : 'h5'}
        sx={{
          fontFamily: '"Montserrat", sans-serif',
          fontWeight: 600,
          letterSpacing: '2px',
          color: logoColor,
          textShadow: isDark ? '0 0 8px rgba(255, 167, 38, 0.3)' : 'none',
          position: 'relative',
          '&::before': {
            content: '">"',
            position: 'absolute',
            left: '-20px',
            color: logoColor,
            opacity: 0.7,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            right: '-4px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '2px',
            height: '1em',
            backgroundColor: logoColor,
            animation: 'blink 1s step-end infinite',
          },
        }}
      >
        CRONNY
      </Typography>
      {showSubtitle && (
        <Typography
          variant="caption"
          sx={{
            color: logoColor,
            opacity: 0.7,
            ml: 1,
          }}
        >
          Cron Job Manager
        </Typography>
      )}
    </LogoContainer>
  );
};

export default Logo; 