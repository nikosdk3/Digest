'use client';

import { createContext, useContext, useState } from 'react';
import env, { EnvConfigType } from '../services/environment';

interface EnvContextType {
  envConfig: EnvConfigType;
}

const EnvContext = createContext<EnvContextType | undefined>(undefined);

export const EnvProvider = ({ children }: { children: React.ReactNode }) => {
  const [envConfig] = useState<EnvConfigType>(env);

  return <EnvContext.Provider value={{ envConfig }}>{children}</EnvContext.Provider>;
};

export const useEnv = (): EnvContextType => {
  const context = useContext(EnvContext);
  if (!context) throw new Error('useEnv must be used within EnvProvider');
  return context;
};
