import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.drsgroup.nozzleflowpro',
  appName: 'nozzleflow-pro',
  webDir: 'build',
  server: {
    hostname: 'localhost:3001',
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
  },
  android: {
    minWebViewVersion: 55,
  },
};

export default config;
