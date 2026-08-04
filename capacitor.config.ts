// Capacitor config — used only when converting to Android APK
// Run: npx cap add android && npx cap sync

const config = {
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
