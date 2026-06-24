import { useRoute, Link, useLocation } from "wouter";
import { useProduct } from "@/hooks/use-products";
import { HealthGauge } from "@/components/HealthGauge";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Share2, Info, Search, Sparkles, Loader2, Crown, Lock, ShieldCheck, Heart, BarChart3, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { api } from "@shared/routes";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import i18n from "@/lib/i18n";

export default function ProductDetails() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isPremium = user?.subscriptionStatus === 'premium';
  const [match, params] = useRoute("/product/:barcode");
  const [, setLocation] = useLocation();
  const barcode = match ? params.barcode : null;
  const { data: product, isLoading, error } = useProduct(barcode);
  const [searchName, setSearchName] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const aiAnalyzeMutation = useMutation({
    mutationFn: async (prod: any) => {
      const res = await apiRequest("POST", "/api/products/ai-analyze", {
        product: prod,
        lang: i18n.language,
      });
      return res.json();
    },
    onSuccess: (data) => setAiAnalysis(data.analysis),
  });

  const aiLookupMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", api.products.aiLookup.path, { name });
      return res.json();
    },
  });
  
  const calculateScore = (p: any) => {
    if (!p || !p.nutriments) return 0;
    
    let points = 0;
    const n = p.nutriments as Record<string, any>;
    
    const energy = p.calories || 0;
    if (energy > 800) points += 10;
    else if (energy > 160) points += Math.floor(energy / 80);
    
    const sugars = parseFloat(n.sugars) || 0;
    if (sugars > 45) points += 10;
    else if (sugars > 4.5) points += Math.floor(sugars / 4.5);
    
    const satFat = parseFloat(n['saturated-fat']) || 0;
    if (satFat > 10) points += 10;
    else if (satFat > 1) points += Math.floor(satFat / 1);
    
    const salt = parseFloat(n.salt) || 0;
    if (salt > 0.9) points += 10;
    else if (salt > 0.1) points += Math.floor(salt / 0.1);
    
    const proteins = parseFloat(n.proteins) || 0;
    const fiber = parseFloat(n.fiber) || 0;
    const goodPoints = Math.min(5, Math.floor(proteins / 1.6)) + Math.min(5, Math.floor(fiber / 0.9));
    
    const finalScore = points - goodPoints;
    return Math.max(0, Math.min(100, 100 - (finalScore + 15) * 2));
  };

  const currentProduct = aiLookupMutation.data || product;
  const score = Math.round(
    currentProduct?.healthScore !== undefined && currentProduct?.healthScore !== null
      ? currentProduct.healthScore
      : calculateScore(currentProduct)
  );

  const getRecommendation = (s: number) => {
    if (s >= 80) return t("rec_excellent");
    if (s >= 60) return t("rec_good");
    if (s >= 40) return t("rec_moderate");
    if (s >= 20) return t("rec_poor");
    return t("rec_very_poor");
  };

  if (isLoading || aiLookupMutation.isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          {aiLookupMutation.isPending && (
            <p className="text-sm font-medium text-muted-foreground animate-pulse">
              {t("loading_ai")}
            </p>
          )}
        </div>
      </div>
    );
  }

  if ((error || !product) && !aiLookupMutation.data) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <Info className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t("product_not_found")}</h2>
        <p className="text-muted-foreground mb-8">
          {t("product_not_found_desc")} <span className="font-mono font-bold text-foreground">{barcode}</span>.{" "}
          {t("search_by_name")}
        </p>
        
        <div className="w-full max-w-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text"
              placeholder={t("enter_product_name")}
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 transition-all text-lg"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchName && aiLookupMutation.mutate(searchName)}
            />
          </div>
          <button 
            disabled={!searchName}
            onClick={() => aiLookupMutation.mutate(searchName)}
            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
          >
            <Sparkles className="w-5 h-5" />
            {t("estimate_with_ai")}
          </button>
          
          <div className="pt-4">
            <Link href="/scan" className="text-sm font-semibold text-primary hover:underline">
              {t("scan_another")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayProduct = currentProduct;
  const servingSize = displayProduct?.serving_quantity || 100;
  const multiplier = servingSize / 100;

  const getNutrientValue = (val: any) => {
    const num = parseFloat(val) || 0;
    return (num * multiplier).toFixed(1);
  };

  const getCalories = (val: any) => {
    const num = parseFloat(val) || 0;
    return Math.round(num * multiplier);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-6 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <Link href="/scan">
          <div className="p-2 -ml-2 hover:bg-gray-100 rounded-full cursor-pointer transition">
            <ArrowLeft className="w-6 h-6 text-slate-800" />
          </div>
        </Link>
        <h1 className="font-bold text-slate-800">{t("product_analysis")}</h1>
        <Share2 className="w-6 h-6 text-slate-800" />
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Product Identity */}
        <div className="text-center">
          <div className="relative w-24 h-24 bg-white rounded-2xl mx-auto mb-4 shadow-md border border-gray-100 flex items-center justify-center">
            {displayProduct.image_url ? (
              <img src={displayProduct.image_url} alt={displayProduct.name} className="w-full h-full object-contain rounded-2xl p-2" />
            ) : (
              <span className="text-2xl font-bold text-gray-300">IMG</span>
            )}
            {displayProduct.isMoroccan && (
              <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm flex items-center gap-1">
                <span>🇲🇦</span> MAROC
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-display mb-1">{displayProduct.name}</h2>
          <p className="text-muted-foreground">{displayProduct.brand || t("unknown_brand")}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
            {t("values_for")} {servingSize}g {servingSize !== 100 && `(${t("serving")})`}
          </div>
        </div>

        {/* Gauge */}
        <div className="space-y-2">
          <HealthGauge score={score} />
          <p className="text-center text-sm font-medium text-slate-600 px-4">
            {getRecommendation(score)}
          </p>
        </div>

        {/* Nutrients Grid */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t("nutrient_analysis")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <NutrientCard 
              label={t("sugars")}
              value={`${getNutrientValue(displayProduct.nutriments?.sugars)}g`} 
              status={parseFloat(displayProduct.nutriments?.sugars) * multiplier > 10 * multiplier ? t("high") : t("reasonable")}
              color={parseFloat(displayProduct.nutriments?.sugars) * multiplier > 10 * multiplier ? "red" : "green"}
            />
            <NutrientCard 
              label={t("fat")}
              value={`${getNutrientValue(displayProduct.nutriments?.fat)}g`} 
              status={parseFloat(displayProduct.nutriments?.fat) * multiplier > 15 * multiplier ? t("high") : t("moderate")}
              color={parseFloat(displayProduct.nutriments?.fat) * multiplier > 15 * multiplier ? "red" : "orange"}
            />
            <NutrientCard 
              label={t("proteins")}
              value={`${getNutrientValue(displayProduct.nutriments?.proteins)}g`} 
              status={t("healthy")}
              color="green"
            />
            <NutrientCard 
              label={t("salt")}
              value={`${(parseFloat(displayProduct.nutriments?.salt || 0) * multiplier).toFixed(2)}g`} 
              status={parseFloat(displayProduct.nutriments?.salt) * multiplier > 1.5 * multiplier ? t("high") : t("low")}
              color={parseFloat(displayProduct.nutriments?.salt) * multiplier > 1.5 * multiplier ? "red" : "green"}
            />
            <NutrientCard 
              label={t("calories_label")}
              value={`${getCalories(displayProduct.calories || displayProduct.nutriments?.energy_kcal)} kcal`} 
              status={getCalories(displayProduct.calories || displayProduct.nutriments?.energy_kcal) > 400 * multiplier ? t("high") : t("normal")}
              color={getCalories(displayProduct.calories || displayProduct.nutriments?.energy_kcal) > 400 * multiplier ? "red" : "green"}
            />
          </div>
        </div>

        {/* Additives Section */}
        {displayProduct.additives && displayProduct.additives.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">{t("chemical_additives")}</h3>
            <div className="flex flex-wrap gap-2">
              {displayProduct.additives.map((additive: string, idx: number) => (
                <div key={idx} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm font-medium">
                  {additive}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Moroccan Score */}
        {displayProduct.isMoroccan && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🇲🇦</div>
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">{t("local_product")}</h4>
                <p className="text-[10px] text-emerald-700">{t("supports_economy")}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-emerald-600">100/100</div>
              <div className="text-[8px] font-bold text-emerald-500 uppercase">Eco-Score</div>
            </div>
          </div>
        )}

        {/* Alternatives Section */}
        {displayProduct.alternatives && displayProduct.alternatives.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-900">{t("healthier_alternatives")}</h3>
            </div>
            <div className="space-y-3">
              {displayProduct.alternatives.map((alt: any, idx: number) => (
                <div key={idx} className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-bold text-slate-800 truncate">{alt.name}</p>
                    <p className="text-xs text-muted-foreground">{alt.brand}</p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-1 leading-tight">{alt.reason}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-700 bg-emerald-50">
                      {Math.round(alt.healthScore)}
                    </div>
                    <span className="text-[8px] font-bold text-emerald-600 uppercase">Score</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dietary Warnings */}
        {displayProduct.dietWarnings && displayProduct.dietWarnings.length > 0 && (
          <div className="p-4 rounded-xl bg-red-600 border border-red-700 shadow-lg shadow-red-900/20 space-y-2 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-2 text-white">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <Info className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="font-bold">{t("diet_warning")}</h3>
            </div>
            <ul className="list-disc list-inside text-sm text-red-50 space-y-1">
              {displayProduct.dietWarnings.map((warning: string, idx: number) => (
                <li key={idx} className="font-bold text-base leading-tight">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── PREMIUM SECTION ───────────────────────────────────────────── */}
        {isPremium ? (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* 1 — AI Nutritionist Opinion */}
            <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{t("prem_ai_title")}</h3>
                  <p className="text-[10px] text-slate-400">{t("prem_ai_desc")}</p>
                </div>
                <div className="ms-auto flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] text-amber-600 font-bold">Premium</span>
                </div>
              </div>

              {aiAnalysis ? (
                <div className="p-3 bg-violet-50 rounded-xl">
                  <p className="text-sm text-slate-700 leading-relaxed">{aiAnalysis}</p>
                  <button
                    onClick={() => { setAiAnalysis(null); aiAnalyzeMutation.reset(); }}
                    className="mt-2 text-[11px] text-violet-500 underline"
                  >
                    ↺ {t("prem_ai_btn")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => aiAnalyzeMutation.mutate(displayProduct)}
                  disabled={aiAnalyzeMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 active:scale-95 transition-transform"
                >
                  {aiAnalyzeMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />{t("prem_ai_loading")}</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />{t("prem_ai_btn")}</>
                  )}
                </button>
              )}
            </div>

            {/* 2 — Daily Recommended Intake (% AJR) */}
            <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{t("prem_rda_title")}</h3>
                  <p className="text-[10px] text-slate-400">{t("prem_rda_of")}</p>
                </div>
                <div className="ms-auto flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] text-amber-600 font-bold">Premium</span>
                </div>
              </div>
              {(() => {
                const n = displayProduct.nutriments || {};
                const rdaBars = [
                  { key: t("calories_label"), val: parseFloat(displayProduct.calories) || 0, max: 2000, unit: "kcal", color: "bg-orange-400" },
                  { key: t("sugars"), val: parseFloat(n.sugars) || 0, max: 90, unit: "g", color: "bg-red-400" },
                  { key: t("fat"), val: parseFloat(n.fat) || 0, max: 70, unit: "g", color: "bg-yellow-400" },
                  { key: t("proteins"), val: parseFloat(n.proteins) || 0, max: 50, unit: "g", color: "bg-blue-400" },
                  { key: t("salt"), val: parseFloat(n.salt) || 0, max: 6, unit: "g", color: "bg-purple-400" },
                ];
                return (
                  <div className="space-y-3">
                    {rdaBars.map((b) => {
                      const pct = Math.min(100, Math.round((b.val / b.max) * 100));
                      return (
                        <div key={b.key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-slate-600">{b.key}</span>
                            <span className="font-bold text-slate-800">
                              {b.val.toFixed(1)}{b.unit}
                              <span className={`ms-1 font-normal ${pct > 80 ? 'text-red-500' : 'text-slate-400'}`}>({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className={`${pct > 80 ? 'bg-red-400' : b.color} h-2 rounded-full transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* 3 — Allergens + Diet Compatibility */}
            <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{t("prem_allergen_title")}</h3>
                </div>
                <div className="ms-auto flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] text-amber-600 font-bold">Premium</span>
                </div>
              </div>

              {/* Allergen rows */}
              {(() => {
                const ingr = (displayProduct.ingredients || "").toLowerCase();
                const nameL = (displayProduct.name || "").toLowerCase();
                const brandL = (displayProduct.brand || "").toLowerCase();
                const combined = `${ingr} ${nameL} ${brandL}`;
                const allergens = [
                  { name: "Gluten", icon: "🌾", present: /gluten|blé|farine|wheat|orge|seigle|avoine/.test(combined) },
                  { name: "Lactose", icon: "🥛", present: /lait|lactose|milk|beurre|crème|fromage|whey/.test(combined) },
                  { name: "Arachides", icon: "🥜", present: /arachide|peanut|cacahuète/.test(combined) },
                  { name: "Œufs", icon: "🥚", present: /oeuf|egg|œuf/.test(combined) },
                  { name: "Soja", icon: "🫘", present: /soja|soy|soya/.test(combined) },
                ];
                return (
                  <div className="space-y-1 mb-4">
                    {allergens.map((a) => (
                      <div key={a.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{a.icon}</span>
                          <span className="text-sm text-slate-700 font-medium">{a.name}</span>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${a.present ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {a.present ? t("prem_present") : t("prem_absent")}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Diet compatibility */}
              {(user?.dietaryPreferences || []).length > 0 ? (
                <div className="space-y-2">
                  {(user!.dietaryPreferences as string[]).map((pref) => {
                    const ingr = (displayProduct.ingredients || "").toLowerCase();
                    const s = parseFloat((displayProduct.nutriments as any)?.sugars) || 0;
                    let status = t("prem_check");
                    let statusCls = "bg-amber-50 text-amber-600";
                    if (pref === "halal") {
                      const haramWarning = (displayProduct.dietWarnings || []).some((w: string) => w.startsWith("🚫 Haram"));
                      const isNonHalal = displayProduct.isHalal === false || haramWarning;
                      const isHalal = !isNonHalal && (displayProduct.isHalal === true || displayProduct.isHalalCertified === true);
                      status = isNonHalal ? t("prem_incompatible") : isHalal ? t("prem_compatible") : t("prem_check");
                      statusCls = isNonHalal ? "bg-red-50 text-red-600" : isHalal ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600";
                    } else if (pref === "vegan") {
                      const hasAnimal = /lait|viande|oeuf|poisson|poulet|boeuf|agneau/.test(ingr);
                      status = hasAnimal ? t("prem_incompatible") : t("prem_compatible");
                      statusCls = hasAnimal ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600";
                    } else if (pref === "sans_gluten") {
                      const hasGluten = /gluten|blé|farine|wheat/.test(ingr);
                      status = hasGluten ? t("prem_incompatible") : t("prem_compatible");
                      statusCls = hasGluten ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600";
                    } else if (pref === "diabetique") {
                      status = s > 10 ? t("prem_incompatible") : t("prem_compatible");
                      statusCls = s > 10 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600";
                    }
                    return (
                      <div key={pref} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-xs font-semibold text-slate-700 capitalize">{pref.replace(/_/g, " ")}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusCls}`}>{status}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-1">
                  {t("prem_no_prefs")}{" "}
                  <Link href="/profile"><span className="text-emerald-600 font-semibold">{t("prem_profile_link")}</span></Link>{" "}
                  {t("prem_for_personalized")}
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          /* Locked premium preview for free users */
          <Link href="/premium">
            <div className="relative overflow-hidden rounded-2xl border border-amber-200 cursor-pointer">
              <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-amber-800">{t("prem_lock_title")}</span>
                  </div>
                  <Lock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="space-y-2 opacity-50 pointer-events-none select-none">
                  {[t("prem_feat1"), t("prem_feat2"), t("prem_feat3")].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-600">
                      <span>→ {f}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full text-xs font-bold">
                  <Crown className="w-3.5 h-3.5" />
                  {t("prem_unlock_btn")}
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* AI Analysis CTA */}
        <Link href="/chat">
          <motion.div 
            whileTap={{ scale: 0.98 }}
            className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <h3 className="font-bold text-lg mb-1">{t("have_questions")}</h3>
            <p className="text-emerald-100 text-sm mb-4">{t("ask_nutritionist")}</p>
            <div className="inline-flex px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg text-sm font-medium">
              {t("start_chat")}
            </div>
          </motion.div>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}

function NutrientCard({ label, value, status, color }: { label: string, value: string, status: string, color: string }) {
  const colorClass = {
    red: "text-red-600 bg-red-50 border-red-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    green: "text-emerald-600 bg-emerald-50 border-emerald-100"
  }[color] || "text-gray-600 bg-gray-50 border-gray-100";

  return (
    <div className={`p-4 rounded-xl border ${colorClass} bg-opacity-50`}>
      <p className="text-sm font-medium opacity-80 mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <span className="text-xl font-bold">{value}</span>
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">{status}</span>
      </div>
    </div>
  );
}
