/**
 * Google Play Billing for the Android APK.
 *
 * The web version deliberately does not pretend that a Google Play purchase
 * can be made in a browser. On Android, cordova-plugin-purchase exposes the
 * CdvPurchase global after Capacitor has loaded the Cordova plugins.
 */

export const PRODUCT_ID = "nutriscan_premium_monthly";

function getPurchaseApi(): any | null {
  if (typeof window === "undefined") return null;
  return (window as any).CdvPurchase ?? null;
}

export function isBillingAvailable(): boolean {
  return Boolean(getPurchaseApi()?.store);
}

let initialization: Promise<boolean> | null = null;

export async function initBilling(): Promise<boolean> {
  if (initialization) return initialization;

  initialization = (async () => {
    const purchaseApi = getPurchaseApi();
    if (!purchaseApi?.store) return false;

    try {
      const store = purchaseApi.store;
      store.register([{
        id: PRODUCT_ID,
        type: purchaseApi.ProductType.PAID_SUBSCRIPTION,
        platform: purchaseApi.Platform.GOOGLE_PLAY,
      }]);
      await store.initialize([purchaseApi.Platform.GOOGLE_PLAY]);
      return true;
    } catch (error) {
      console.error("Billing init error:", error);
      initialization = null;
      return false;
    }
  })();

  return initialization;
}

export async function subscribePremium(): Promise<{ success: boolean; token?: string; error?: string }> {
  const purchaseApi = getPurchaseApi();
  if (!purchaseApi?.store) return { success: false, error: "web_only" };

  const initialized = await initBilling();
  if (!initialized) return { success: false, error: "billing_unavailable" };

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: { success: boolean; token?: string; error?: string }) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    try {
      const store = purchaseApi.store;
      const product = store.get(PRODUCT_ID, purchaseApi.Platform.GOOGLE_PLAY);
      const offer = product?.getOffer?.() ?? product?.offers?.[0];
      if (!offer) {
        finish({ success: false, error: "product_not_found" });
        return;
      }

      // `approved` is the purchase event emitted by cordova-plugin-purchase.
      // The token is returned to PremiumPage, which verifies it on our server.
      store.when().approved(async (transaction: any) => {
        try {
          await transaction.verify();
          const token =
            transaction.purchaseToken ??
            transaction.parentReceipt?.purchaseToken ??
            transaction.transaction?.purchaseToken ??
            transaction.transaction?.purchaseTokenAndroid;
          if (!token) {
            finish({ success: false, error: "purchase_token_missing" });
            return;
          }
          await transaction.finish();
          finish({ success: true, token });
        } catch (error: any) {
          finish({ success: false, error: error?.message || "purchase_failed" });
        }
      });

      Promise.resolve(offer.order()).then((error: any) => {
        if (error) finish({ success: false, error: error.code || error.message || "purchase_failed" });
      }).catch((error: any) => {
        finish({ success: false, error: error?.message || "purchase_failed" });
      });
    } catch (error: any) {
      finish({ success: false, error: error?.message || "purchase_failed" });
    }
  });
}

export async function restorePurchases(): Promise<{ restored: boolean; token?: string }> {
  const purchaseApi = getPurchaseApi();
  if (!purchaseApi?.store || !(await initBilling())) return { restored: false };

  try {
    const store = purchaseApi.store;
    await store.restorePurchases();
    const product = store.get(PRODUCT_ID, purchaseApi.Platform.GOOGLE_PLAY);
    const transaction = product?.getOffer?.()?.transaction ?? product?.transaction;
    const token =
      transaction?.purchaseToken ??
      transaction?.parentReceipt?.purchaseToken ??
      store.localTransactions?.find((item: any) =>
        item.products?.some((p: any) => p.id === PRODUCT_ID)
      )?.parentReceipt?.purchaseToken;
    return { restored: Boolean(product?.owned), token };
  } catch (error) {
    console.error("Billing restore error:", error);
    return { restored: false };
  }
}

export async function verifyPurchaseOnServer(purchaseToken: string): Promise<boolean> {
  try {
    const res = await fetch("/api/subscription/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ purchaseToken, productId: PRODUCT_ID }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
