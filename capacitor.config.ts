import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.orbitdesk.app',
  appName: 'Orbit Desk',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_orbit',
      iconColor: '#82b3fe',
    },
  },
};

export default config;
