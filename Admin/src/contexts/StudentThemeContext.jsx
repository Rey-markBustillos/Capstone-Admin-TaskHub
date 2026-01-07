import React, { createContext, useState, useEffect } from 'react';

export const StudentThemeContext = createContext();

export const StudentThemeProvider = ({ children }) => {
  const [isLightMode, setIsLightMode] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('studentTheme');
    return savedTheme === 'light';
  });

  const toggleLightMode = () => {
    setIsLightMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('studentTheme', newMode ? 'light' : 'dark');
      return newMode;
    });
  };

  return (
    <StudentThemeContext.Provider value={{ isLightMode, toggleLightMode }}>
      {children}
    </StudentThemeContext.Provider>
  );
};
