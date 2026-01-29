import React, { createContext, useContext, ReactNode } from 'react';
import { useGolfData } from '@/hooks/useGolfData';

type GolfContextType = ReturnType<typeof useGolfData>;

const GolfContext = createContext<GolfContextType | undefined>(undefined);

export function GolfProvider({ children }: { children: ReactNode }) {
  const golfData = useGolfData();

  return (
    <GolfContext.Provider value={golfData}>
      {children}
    </GolfContext.Provider>
  );
}

export function useGolf() {
  const context = useContext(GolfContext);
  if (context === undefined) {
    throw new Error('useGolf must be used within a GolfProvider');
  }
  return context;
}
