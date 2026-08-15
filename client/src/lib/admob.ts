import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdOptions } from '@capacitor-community/admob';

export const ADMOB_IDS = {
  banner: 'ca-app-pub-1132707752513601/9796858334',
  interstitial: 'ca-app-pub-1132707752513601/5673780497',
};

export const isNativePlatform = () => Capacitor.isNativePlatform();

let initialization: Promise<boolean> | null = null;

export async function initAdMob(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  if (initialization) return initialization;

  initialization = AdMob.initialize({
    testingDevices: [],
    initializeForTesting: false,
  }).then(() => true).catch((error) => {
    console.error('AdMob init error:', error);
    initialization = null;
    return false;
  });

  return initialization;
}

export async function showBannerAd() {
  if (!isNativePlatform()) return;
  try {
    // AdBanner and the app root mount in the same React commit. Waiting here
    // prevents showBanner from racing initAdMob on a cold APK launch.
    if (!(await initAdMob())) return;
    const options: BannerAdOptions = {
      adId: ADMOB_IDS.banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 60,
      isTesting: false,
    };
    await AdMob.showBanner(options);
  } catch (e) {
    console.error('Banner ad error:', e);
  }
}

export async function hideBannerAd() {
  if (!isNativePlatform()) return;
  try {
    await AdMob.removeBanner();
  } catch (e) {
    console.error('Remove banner error:', e);
  }
}

export async function showInterstitialAd(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    if (!(await initAdMob())) return false;
    const options: AdOptions = {
      adId: ADMOB_IDS.interstitial,
      isTesting: false,
    };
    await AdMob.prepareInterstitial(options);
    await AdMob.showInterstitial();
    return true;
  } catch (e) {
    console.error('Interstitial ad error:', e);
    return false;
  }
}
