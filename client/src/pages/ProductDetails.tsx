import { useRoute, Link } from "wouter";
import { useProduct } from "@/hooks/use-products";
import { HealthGauge } from "@/components/HealthGauge";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Share2, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductDetails() {
  const [match, params] = useRoute("/product/:barcode");
  const barcode = match ? params.barcode : null;
  const { data: product, isLoading, error } = useProduct(barcode);

  // Mock score derivation (since backend logic is hidden)
  // In real app, this comes from backend
  const score = product ? Math.floor(Math.random() * 90) + 10 : 0; 

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <Info className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't find a product with barcode {barcode}. It might not be in our database yet.
        </p>
        <Link href="/scan" className="px-6 py-3 bg-primary text-white rounded-xl font-medium">
          Scan Another
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-6 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <Link href="/scan">
          <div className="p-2 -ml-2 hover:bg-gray-100 rounded-full cursor-pointer transition">
            <ArrowLeft className="w-6 h-6 text-slate-800" />
          </div>
        </Link>
        <h1 className="font-bold text-slate-800">Product Analysis</h1>
        <Share2 className="w-6 h-6 text-slate-800" />
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Product Identity */}
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-2xl mx-auto mb-4 shadow-md border border-gray-100 flex items-center justify-center">
            {/* Placeholder for product image if not available */}
             <span className="text-2xl font-bold text-gray-300">IMG</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-display mb-1">{product.name}</h2>
          <p className="text-muted-foreground">{product.brand || "Unknown Brand"}</p>
        </div>

        {/* Gauge */}
        <HealthGauge score={score} />

        {/* Nutrients Grid */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Nutritional Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            <NutrientCard 
              label="Sugars" 
              value={`${product.nutriments?.sugars || 0}g`} 
              status={parseFloat(product.nutriments?.sugars) > 10 ? "High" : "Low"}
              color={parseFloat(product.nutriments?.sugars) > 10 ? "red" : "green"}
            />
             <NutrientCard 
              label="Fat" 
              value={`${product.nutriments?.fat || 0}g`} 
              status={parseFloat(product.nutriments?.fat) > 15 ? "High" : "Medium"}
              color="orange"
            />
            <NutrientCard 
              label="Protein" 
              value={`${product.nutriments?.proteins || 0}g`} 
              status="Good"
              color="green"
            />
            <NutrientCard 
              label="Salt" 
              value={`${product.nutriments?.salt || 0}g`} 
              status="Low"
              color="green"
            />
          </div>
        </div>

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
