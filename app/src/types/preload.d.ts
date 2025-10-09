export { };

declare global {
  interface Window {
    electron: {
      store: {
        get: (key: string) => any;
        set: (key: string, val: any) => void;
        getAll: () => Record<string, any>;
        setAll: (settings: Record<string, any>) => void;
        // any other methods you've defined...
      };
      getCurrentWifi: () => Promise<any>;
      connectToWifi: (opts: { ssid: string; password: string }) => Promise<void>;
      getWifiQuality: () => Promise<number>;
    };
  }
}