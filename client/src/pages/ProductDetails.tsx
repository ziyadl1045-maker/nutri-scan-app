import { useRoute, Link, useLocation } from "wouter";
import { useProduct } from "@/hooks/use-products";
import { HealthGauge } from "@/components/HealthGauge";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Share2, Info, Search, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { api } from "@shared/routes";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ProductDetails() {
  const [match, params] = useRoute("/product/:barcode");
  const [, setLocation] = useLocation();
  const barcode = match ? params.barcode : null;
  const { data: product, isLoading, error } = useProduct(barcode);
  const [searchName, setSearchName] = useState("");

  const aiLookupMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", api.products.aiLookup.path, { name });
      return res.json();
    },
  });
  
  // Real health score calculation (simplified Nutri-Score logic)
  const calculateScore = (p: any) => {
    if (!p || !p.nutriments) return 0;
    
    let points = 0;
    const n = p.nutriments as Record<string, any>;
    
    // Negative points (bad)
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
    
    // Positive points (good)
    const proteins = parseFloat(n.proteins) || 0;
    const fiber = parseFloat(n.fiber) || 0;
    
    const goodPoints = Math.min(5, Math.floor(proteins / 1.6)) + Math.min(5, Math.floor(fiber / 0.9));
    
    const finalScore = points - goodPoints;
    
    // Map to 0-100 scale (inverted because finalScore is higher for bad products)
    // Nutri-Score ranges from -15 (best) to 40 (worst)
    // Let's normalize: 0 is worst, 100 is best
    return Math.max(0, Math.min(100, 100 - (finalScore + 15) * 2));
  };

  const currentProduct = aiLookupMutation.data || product;
  const score = currentProduct?.healthScore !== undefined && currentProduct?.healthScore !== null 
    ? currentProduct.healthScore 
    : calculateScore(currentProduct);

  const getRecommendation = (s: number) => {
    if (s >= 80) return "Excellent product! You can enjoy this daily.";
    if (s >= 60) return "Good choice for a balanced diet.";
    if (s >= 40) return "Moderate. Try to consume this occasionally.";
    if (s >= 20) return "Poor nutritional quality. Limit your consumption.";
    return "Very poor. Better to find a healthier alternative.";
  };

  if (isLoading || aiLookupMutation.isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          {aiLookupMutation.isPending && <p className="text-sm font-medium text-muted-foreground animate-pulse">AI is estimating nutrition...</p>}
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
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-8">
          We couldn't find a product with barcode <span className="font-mono font-bold text-foreground">{barcode}</span>. 
          Would you like to search by name instead?
        </p>
        
        <div className="w-full max-w-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Enter product name (e.g. Whole Milk)"
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
            Estimate with AI
          </button>
          
          <div className="pt-4">
            <Link href="/scan" className="text-sm font-semibold text-primary hover:underline">
              Scan Another Product
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
        <h1 className="font-bold text-slate-800">Analyse du Produit</h1>
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
          <p className="text-muted-foreground">{displayProduct.brand || "Marque inconnue"}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
            Valeurs pour {servingSize}g {servingSize !== 100 && "(Portion)"}
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
          <h3 className="text-lg font-bold text-slate-900 mb-4">Analyse Nutritionnelle</h3>
          <div className="grid grid-cols-2 gap-4">
            <NutrientCard 
              label="Sucres" 
              value={`${getNutrientValue(displayProduct.nutriments?.sugars)}g`} 
              status={parseFloat(displayProduct.nutriments?.sugars) * multiplier > 10 * multiplier ? "Élevé" : "Raisonnable"}
              color={parseFloat(displayProduct.nutriments?.sugars) * multiplier > 10 * multiplier ? "red" : "green"}
            />
            <NutrientCard 
              label="Lipides" 
              value={`${getNutrientValue(displayProduct.nutriments?.fat)}g`} 
              status={parseFloat(displayProduct.nutriments?.fat) * multiplier > 15 * multiplier ? "Élevé" : "Modéré"}
              color={parseFloat(displayProduct.nutriments?.fat) * multiplier > 15 * multiplier ? "red" : "orange"}
            />
            <NutrientCard 
              label="Protéines" 
              value={`${getNutrientValue(displayProduct.nutriments?.proteins)}g`} 
              status="Sain"
              color="green"
            />
            <NutrientCard 
              label="Sel" 
              value={`${(parseFloat(displayProduct.nutriments?.salt || 0) * multiplier).toFixed(2)}g`} 
              status={parseFloat(displayProduct.nutriments?.salt) * multiplier > 1.5 * multiplier ? "Élevé" : "Faible"}
              color={parseFloat(displayProduct.nutriments?.salt) * multiplier > 1.5 * multiplier ? "red" : "green"}
            />
            <NutrientCard 
              label="Calories" 
              value={`${getCalories(displayProduct.calories || displayProduct.nutriments?.energy_kcal)} kcal`} 
              status={getCalories(displayProduct.calories || displayProduct.nutriments?.energy_kcal) > 400 * multiplier ? "Élevé" : "Normal"}
              color={getCalories(displayProduct.calories || displayProduct.nutriments?.energy_kcal) > 400 * multiplier ? "red" : "green"}
            />
          </div>
        </div>

        {/* Additives Section */}
        {displayProduct.additives && displayProduct.additives.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Chemical Additives</h3>
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
                <h4 className="font-bold text-emerald-900 text-sm">Produit Local</h4>
                <p className="text-[10px] text-emerald-700">Soutient l'économie marocaine</p>
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
              <h3 className="text-lg font-bold text-slate-900">Alternatives plus saines</h3>
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
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 space-y-2">
            <div className="flex items-center gap-2 text-red-700">
              <Info className="w-5 h-5" />
              <h3 className="font-bold">Attention Régime</h3>
            </div>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
              {displayProduct.dietWarnings.map((warning: string, idx: number) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Analysis CTA */}
        <Link href="/chat">
          <motion.div 
            whileTap={{ scale: 0.98 }}
            className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <h3 className="font-bold text-lg mb-1">Have questions?</h3>
            <p className="text-emerald-100 text-sm mb-4">Ask our AI nutritionist about this product.</p>
            <div className="inline-flex px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg text-sm font-medium">
              Start Chat
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
