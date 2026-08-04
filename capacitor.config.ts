import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ambikabeauty.billmanager",
  appName: "Ambika Beauty Bill Manager",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#030712",
      showSpinner: false,
    },
  },
};

export default config;
