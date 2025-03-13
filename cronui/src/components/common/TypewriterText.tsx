import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  delay = 1000,
  prefix = '',
  suffix = '',
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isTyping || currentIndex >= text.length) return;

    const timer = setTimeout(() => {
      setDisplayText(prev => prev + text[currentIndex]);
      setCurrentIndex(prev => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [currentIndex, isTyping, speed, text]);

  return (
    <Typography
      variant="h5"
      sx={{
        color: '#ffa726',
        maxWidth: '600px',
        mx: 'auto',
        mb: 4,
        position: 'relative',
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
      {prefix}
      {displayText}
      {suffix}
    </Typography>
  );
};

export default TypewriterText; 