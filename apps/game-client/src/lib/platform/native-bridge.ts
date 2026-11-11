import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/** Triggers gentle haptic tap feedback solely on native iOS/Android runtimes. */
export async function triggerLightHaptic(enabled: boolean): Promise<void> {
  if (!enabled || !Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Gracefully ignore simulator/device haptic unavailability
  }
}

/** Triggers crisp medium feedback on upgrades or mission unlocks on native runtimes. */
export async function triggerMediumHaptic(enabled: boolean): Promise<void> {
  if (!enabled || !Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Ignore
  }
}

/**
 * Registers background-pause persistence hooks across native Capacitor `appStateChange`
 * and web `visibilitychange` / `pagehide` without leaking listeners.
 */
export function registerLifecycleHooks(
  onPause: () => void,
  onVisibilityChange: (visible: boolean) => void
): () => void {
  const handleVisibility = (): void => {
    const visible = document.visibilityState === 'visible';
    onVisibilityChange(visible);
    if (!visible) {
      onPause();
    }
  };

  const handlePageHide = (): void => {
    onPause();
  };

  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('pagehide', handlePageHide);

  let nativeHandlePromise: Promise<{ remove: () => Promise<void> }> | null = null;
  if (Capacitor.isNativePlatform()) {
    nativeHandlePromise = App.addListener('appStateChange', ({ isActive }) => {
      onVisibilityChange(isActive);
      if (!isActive) {
        onPause();
      }
    });
  }

  return () => {
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('pagehide', handlePageHide);
    if (nativeHandlePromise) {
      void nativeHandlePromise.then((h) => h.remove());
    }
  };
}

