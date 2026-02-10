import React, { createContext } from 'react';

const SidebarContext = createContext({
  isSidebarOpen: false,
  setIsSidebarOpen: () => {}
});

export const SidebarProvider = ({ children, isSidebarOpen, setIsSidebarOpen }) => {
  return (
    <SidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;
