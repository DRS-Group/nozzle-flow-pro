import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.drsgroup.nozzleflowpro',
  appName: 'nozzleflow-pro',
  webDir: 'build',
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
  },
  android: {
    minWebViewVersion: 106,
  },

  // server: {
  //   cleartext: false,
  //   url: 'http://192.168.0.129:3001',
  // },
};

export default config;
