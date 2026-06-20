/**
 * Google Play Billing abstraction for NutriScan
 * Uses cordova-plugin-purchase (CdvPurchase) in Android APK
 * Falls back gracefully on web
 *
 * Product ID (to create in Google Play Console):
 *   nutriscan_premium_monthly
 *   Pricing: 50 MAD / 5 EUR / $5 USD (set per country in Play Console)
 */

declare const CdvPurchase: any;

export const PRODUCT_ID = "nutriscan_premium_monthly";

function isAndroid(): boolean {
  return typeof (window as any).CdvPurchase !== "undefined";
}

export async function initBilling(): Promise<void> {
  if (!isAndroid()) return;
  try {
    const store = CdvPurchase.store;
    store.register([{
      id: PRODUCT_ID,
      type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
      platform: CdvPurchase.Platform.GOOGLE_PLAY,
    }]);
    await store.initialize([CdvPurchase.Platform.GOOGLE_PLAY]);
  } catch (e) {
    console.error("Billing init error:", e);
  }
}

export async function subscribePremium(): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!isAndroid()) {
    return { success: false, error: "web_only" };
  }
  return new Promise((resolve) => {
    try {
      const store = CdvPurchase.store;
      const product = store.get(PRODUCT_ID, CdvPurchase.Platform.GOOGLE_PLAY);
      if (!product || !product.offers?.[0]) {
        resolve({ success: false, error: "product_not_found" });
        return;
      }
      store.once(CdvPurchase.TransactionState.APPROVED, async (transaction: any) => {
        await transaction.verify();
        await transaction.finish();
        resolve({ success: true, token: transaction.purchaseToken });
      });
      product.offers[0].order();
    } catch (e: any) {
      resolve({ success: false, error: e.message });
    }
  });
}

export async function restorePurchases(): Promise<{ restored: boolean }> {
  if (!isAndroid()) return { restored: false };
  try {
    const store = CdvPurchase.store;
    await store.restorePurchases();
    const owned = store.get(PRODUCT_ID, CdvPurchase.Platform.GOOGLE_PLAY);
    return { restored: owned?.owned ?? false };
  } catch {
    return { restored: false };
  }
}

export async function verifyPurchaseOnServer(purchaseToken: string): Promise<boolean> {
  try {
    const res = await fetch("/api/subscription/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseToken, productId: PRODUCT_ID }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
