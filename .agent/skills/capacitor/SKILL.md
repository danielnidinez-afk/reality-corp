---
name: capacitor
description: "Experten-Skill für Cross-Platform Mobile Apps mit Capacitor (iOS & Android). Behandelt Web-to-Native Bridge, Plugin-Konfiguration, Haptics, Push-Notifications und Asset-Synchronisation."
metadata:
  version: "7.0.0"
  license: MIT
---

# Capacitor Cross-Platform Mobile Standards

## 1. Zweck
Dieser Skill führt die Web-Codebasis von *REALITY CORP* mit nativen iOS- und Android-Runtimes zusammen, um das Spiel als native App in den App Stores bereitzustellen.

## 2. Kernrichtlinien

### 2.1 Konfiguration (`capacitor.config.ts`)
- Konfiguriere Server-, WebView- und Plugin-Einstellungen typensicher:
  ```typescript
  import type { CapacitorConfig } from '@capacitor/cli';

  const config: CapacitorConfig = {
    appId: 'com.realitycorp.tycoon',
    appName: 'Reality Corp',
    webDir: 'build',
    server: {
      androidScheme: 'https',
      cleartext: false
    },
    plugins: {
      SplashScreen: {
        launchAutoHide: false
      }
    }
  };
  export default config;
  ```

### 2.2 Native API Interaktionen
- Prüfe vor Aufruf nativer Plugins immer die Plattform-Verfügbarkeit (`Capacitor.isNativePlatform()`), damit der Code im Browser nicht abstürzt.
- Verwende Haptics dezent für signifikante Spiel-Meilensteine via `@capacitor/haptics`:
  ```typescript
  import { Haptics, ImpactStyle } from '@capacitor/haptics';

  export async function triggerHapticSuccess() {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  }
  ```

### 2.3 Synchronisation & Build Flow
- Nach jedem Web-Build ausführen: `npx cap sync`.
- Keine manuellen Änderungen in den generierten Verzeichnissen `android/` oder `ios/`, außer für native Berechtigungen (`AndroidManifest.xml`, `Info.plist`).

