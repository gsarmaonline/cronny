import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px',
  borderRadius: '4px',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    background: 'rgba(255, 167, 38, 0.1)',
  },
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Montserrat", sans-serif',
  fontWeight: 600,
  letterSpacing: '2px',
  color: '#ffa726',
  textShadow: '0 0 8px rgba(255, 167, 38, 0.3)',
  position: 'relative',
  '&::before': {
    content: '">"',
    position: 'absolute',
    left: '-20px',
    color: '#ffa726',
    opacity: 0.7,
  },
}));

interface LogoProps {
  variant?: 'small' | 'large';
  showSubtitle?: boolean;
}

const Logo: React.FC<LogoProps> = ({ variant = 'small', showSubtitle = false }) => {
  return (
    <LogoContainer>
      <LogoText
        variant={variant === 'small' ? 'h6' : 'h5'}
        sx={{
          '&::after': {
            content: '""',
            position: 'absolute',
            right: '-4px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '2px',
            height: '1em',
            backgroundColor: '#ffa726',
            animation: 'blink 1s step-end infinite',
          },
        }}
      >
        CRONNY
      </LogoText>
      {showSubtitle && (
        <Typography
          variant="caption"
          sx={{
            color: '#ffa726',
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