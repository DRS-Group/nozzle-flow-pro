import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.drsgroup.nozzleflowpro',
  appName: 'nozzleflow-pro',
  webDir: 'build',
  server: {
    hostname: 'localhost:3001',
    cleartext: true,
  },
  cordova: {
    accessOrigins: ['http://10.0.0.122:3000/'],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
  },
};

export default config;
