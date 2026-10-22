import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.resigrid.app',
  appName: 'ResiGrid',
  webDir: 'out',
  plugins: {
    App: {
      disableBackButtonHandler: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#00000000',
    },
  },
};

export default config;
