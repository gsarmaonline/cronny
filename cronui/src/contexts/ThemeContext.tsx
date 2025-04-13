import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, PaletteMode, useMediaQuery, CssBaseline } from '@mui/material';

type ThemeContextType = {
  mode: PaletteMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use system preference as initial state, but default to light if no preference
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<PaletteMode>('light');

  useEffect(() => {
    // Check if there's a saved theme preference in localStorage
    const savedMode = localStorage.getItem('themeMode') as PaletteMode | null;
    
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  // Create theme based on current mode
  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode,
        ...(mode === 'dark' 
          ? {
              // Dark mode
              primary: {
                main: '#ffa726', // Vibrant orange
                light: '#ffd95b',
                dark: '#c77800',
              },
              secondary: {
                main: '#ff9800', // Deep orange
                light: '#ffc947',
                dark: '#c66900',
              },
              background: {
                default: '#0a0a0a', // Very dark orange-tinted black
                paper: '#121212', // Slightly lighter orange-tinted black
              },
              text: {
                primary: '#ffa726', // Vibrant orange
                secondary: '#ff9800', // Deep orange
              },
            } 
          : {
              // Light mode
              primary: {
                main: '#ff9800', // Orange
                light: '#ffb74d',
                dark: '#f57c00',
              },
              secondary: {
                main: '#f57c00', // Deeper orange
                light: '#ffb74d',
                dark: '#e65100',
              },
              background: {
                default: '#f5f5f5', // Light gray
                paper: '#ffffff', // White
              },
              text: {
                primary: '#212121', // Dark gray
                secondary: '#757575', // Medium gray
              },
            }),
      },
      typography: {
        fontFamily: '"IBM Plex Mono", monospace',
        h1: {
          fontWeight: 600,
          letterSpacing: '0.5px',
          textShadow: mode === 'dark' ? '0 0 8px rgba(255, 167, 38, 0.5)' : 'none',
        },
        h2: {
          fontWeight: 600,
          letterSpacing: '0.5px',
          textShadow: mode === 'dark' ? '0 0 8px rgba(255, 167, 38, 0.5)' : 'none',
        },
        h3: {
          fontWeight: 600,
          letterSpacing: '0.5px',
          textShadow: mode === 'dark' ? '0 0 8px rgba(255, 167, 38, 0.5)' : 'none',
        },
        h4: {
          fontWeight: 600,
          letterSpacing: '0.5px',
          textShadow: mode === 'dark' ? '0 0 8px rgba(255, 167, 38, 0.5)' : 'none',
        },
        h5: {
          fontWeight: 600,
          letterSpacing: '0.5px',
          textShadow: mode === 'dark' ? '0 0 8px rgba(255, 167, 38, 0.5)' : 'none',
        },
        h6: {
          fontWeight: 600,
          letterSpacing: '0.5px',
          textShadow: mode === 'dark' ? '0 0 8px rgba(255, 167, 38, 0.5)' : 'none',
        },
        body1: {
          letterSpacing: '0.5px',
          textShadow: mode === 'dark' ? '0 0 4px rgba(255, 167, 38, 0.3)' : 'none',
        },
        body2: {
          letterSpacing: '0.5px',
          textShadow: mode === 'dark' ? '0 0 4px rgba(255, 167, 38, 0.3)' : 'none',
        },
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
              boxShadow: mode === 'dark' 
                ? '0 0 20px rgba(255, 167, 38, 0.1)' 
                : '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: mode === 'dark' 
                ? '1px solid rgba(255, 167, 38, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
              '&:hover': {
                boxShadow: mode === 'dark' 
                  ? '0 0 30px rgba(255, 167, 38, 0.15)' 
                  : '0 6px 8px rgba(0, 0, 0, 0.15)',
                border: mode === 'dark' 
                  ? '1px solid rgba(255, 167, 38, 0.2)' 
                  : '1px solid rgba(0, 0, 0, 0.1)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
              boxShadow: mode === 'dark' 
                ? '0 0 20px rgba(255, 167, 38, 0.1)' 
                : '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: mode === 'dark' 
                ? '1px solid rgba(255, 167, 38, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
              '&:hover': {
                boxShadow: mode === 'dark' 
                  ? '0 0 30px rgba(255, 167, 38, 0.15)' 
                  : '0 6px 8px rgba(0, 0, 0, 0.15)',
                border: mode === 'dark' 
                  ? '1px solid rgba(255, 167, 38, 0.2)' 
                  : '1px solid rgba(0, 0, 0, 0.1)',
              },
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
              boxShadow: mode === 'dark' 
                ? '0 0 20px rgba(255, 167, 38, 0.1)' 
                : '0 4px 6px rgba(0, 0, 0, 0.1)',
              borderBottom: mode === 'dark' 
                ? '1px solid rgba(255, 167, 38, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
              '& .MuiTypography-root': {
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 300,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                fontSize: '1.5rem',
                textShadow: mode === 'dark' ? '0 0 8px rgba(255, 167, 38, 0.3)' : 'none',
                '&.MuiTypography-body2': {
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  letterSpacing: 'normal',
                  textShadow: 'none',
                },
              },
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundImage: 'none',
              backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
              boxShadow: mode === 'dark' 
                ? '0 0 20px rgba(255, 167, 38, 0.1)' 
                : '0 4px 6px rgba(0, 0, 0, 0.1)',
              borderRight: mode === 'dark' 
                ? '1px solid rgba(255, 167, 38, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              letterSpacing: '0.5px',
              '&:hover': {
                boxShadow: mode === 'dark' 
                  ? '0 0 15px rgba(255, 167, 38, 0.3)' 
                  : '0 4px 8px rgba(0, 0, 0, 0.2)',
              },
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiInputBase-root': {
                fontFamily: '"IBM Plex Mono", monospace',
                letterSpacing: '0.5px',
                '&:hover': {
                  boxShadow: mode === 'dark' 
                    ? '0 0 15px rgba(255, 167, 38, 0.1)' 
                    : '0 2px 4px rgba(0, 0, 0, 0.1)',
                },
                '&.Mui-focused': {
                  boxShadow: mode === 'dark' 
                    ? '0 0 20px rgba(255, 167, 38, 0.2)' 
                    : '0 3px 6px rgba(0, 0, 0, 0.15)',
                },
              },
            },
          },
        },
      },
    });
  }, [mode]);

  const contextValue = {
    mode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 