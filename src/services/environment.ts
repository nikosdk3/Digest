import { AppService } from '../types/system';

export interface EnvConfigType {
  appService: () => Promise<AppService>;
}

const environmentConfig: EnvConfigType = {
  appService: async () => {
    const { appService } = await import('./appService');
    return appService;
  },
};

export default environmentConfig;
