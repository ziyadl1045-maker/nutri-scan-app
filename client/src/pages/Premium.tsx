import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { subscribePremium, restorePurchases, verifyPurchaseOnServer } from "@/lib/billing";
import { queryClient } from "@/lib/queryClient";
import {
  Crown, Zap, MessageSquare, ShieldCheck, BarChart3,
  Bell, Download, Infinity, X, Check, Loader2, RefreshCw
} from "lucide-react";

const FEATURES = [
  {
    icon: Infinity,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    title: "Chat IA illimité",
    free: "5 messages / jour",
    premium: "Illimité",
  },
  {
    icon: X,
    color: "text-blue-600",
    bg: "bg-blue-50",
    title: "Sans publicités",
    free: "Pubs AdMob actives",
    premium: "0 publicité",
  },
  {
    icon: BarChart3,
    color: "text-purple-600",
    bg: "bg-purple-50",
    title: "Analyse nutritionnelle avancée",
    free: "Score basique",
    premium: "Rapport complet + graphiques",
  },
  {
    icon: ShieldCheck,
    color: "text-orange-600",
    bg: "bg-orange-50",
    title: "Alertes allergènes",
    free: "Non disponible",
    premium: "Alertes personnalisées",
  },
  {
    icon: Bell,
    color: "text-pink-600",
    bg: "bg-pink-50",
    title: "Suivi nutritionnel quotidien",
    free: "Non disponible",
    premium: "Objectifs + rappels",
  },
  {
    icon: Download,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    title: "Export historique scans",
    free: "Non disponible",
    premium: "PDF & CSV",
  },
];

const PRICE_INFO = [
  { flag: "🇲🇦", country: "Maroc", price: "50 MAD/mois" },
  { flag: "🇪🇺", country: "Europe", price: "5 € / mois" },
  { flag: "🇺🇸", country: "États-Unis", price: "$5 / mois" },
];

export default function PremiumPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const isPremium = user?.subscriptionStatus === "premium";
  const isAndroid = typeof (window as any).CdvPurchase !== "undefined";

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      if (!isAndroid) {
        toast({
          title: "Application Android requise",
          description: "Télécharge l'application NutriScan sur Google Play pour t'abonner.",
        });
        setLoading(false);
        return;
      }
      const result = await subscribePremium();
      if (result.success && result.token) {
        const verified = await verifyPurchaseOnServer(result.token);
        if (verified) {
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          toast({ title: "✅ Bienvenue en Premium !", description: "Profite de toutes les fonctionnalités !" });
          setLocation("/");
        } else {
          toast({ variant: "destructive", title: "Erreur", description: "Impossible de vérifier l'achat." });
        }
      } else if (result.error === "web_only") {
        toast({ title: "Application Android requise", description: "Télécharge l'app NutriScan sur Google Play." });
      } else {
        toast({ variant: "destructive", title: "Annulé", description: "Abonnement non complété." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.restored) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({ title: "✅ Achat restauré !", description: "Ton abonnement Premium est actif." });
        setLocation("/");
      } else {
        toast({ title: "Aucun achat trouvé", description: "Aucun abonnement actif sur ce compte Google Play." });
      }
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-24" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 pt-14 pb-20 text-white">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{ width: 80 + i * 40, height: 80 + i * 40, top: `${i * 10}%`, right: `${i * 5 - 10}%`, opacity: 0.3 }} />
          ))}
        </div>
        <motion.div className="relative z-10 text-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Crown className="w-8 h-8 text-yellow-300" />
          </div>
          <h1 className="text-3xl font-black mb-2">NutriScan Premium</h1>
          <p className="text-emerald-100 text-sm max-w-xs mx-auto">
            Débloquez toutes les fonctionnalités pour une nutrition optimale
          </p>
        </motion.div>
      </div>

      <div className="px-5 -mt-10 space-y-5 relative z-10">
        {/* Already Premium */}
        {isPremium && (
          <motion.div className="bg-white rounded-3xl p-6 shadow-xl shadow-emerald-100 border border-emerald-100"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Tu es déjà Premium 🎉</h2>
                <p className="text-sm text-slate-500">Profite de toutes les fonctionnalités sans limites</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Price Card */}
        {!isPremium && (
          <motion.div className="bg-white rounded-3xl p-6 shadow-xl shadow-emerald-100 border border-emerald-100"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full mb-3">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700">Abonnement mensuel</span>
              </div>
              <div className="flex justify-center gap-4 mt-3">
                {PRICE_INFO.map((p) => (
                  <div key={p.country} className="text-center">
                    <div className="text-2xl mb-1">{p.flag}</div>
                    <div className="text-sm font-bold text-slate-900">{p.price}</div>
                    <div className="text-xs text-slate-400">{p.country}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              data-testid="button-subscribe-premium"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-base shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
              {loading ? "Traitement..." : "S'abonner maintenant"}
            </button>

            <button
              onClick={handleRestore}
              disabled={restoring}
              data-testid="button-restore-purchase"
              className="w-full py-3 mt-3 rounded-2xl border border-gray-200 text-slate-600 font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Restaurer un achat existant
            </button>

            <p className="text-center text-xs text-slate-400 mt-3">
              Facturation via Google Play · Annulation à tout moment
            </p>
          </motion.div>
        )}

        {/* Features Comparison */}
        <motion.div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-100"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-lg font-bold text-slate-900 mb-5">Comparaison Free vs Premium</h2>

          {/* Header row */}
          <div className="grid grid-cols-3 gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <div>Fonctionnalité</div>
            <div className="text-center">Gratuit</div>
            <div className="text-center text-emerald-600">Premium</div>
          </div>

          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="grid grid-cols-3 gap-2 items-center py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${f.bg} flex items-center justify-center shrink-0`}>
                    <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 leading-tight">{f.title}</span>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                    {f.free === "Non disponible" ? (
                      <X className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <span>{f.free}</span>
                    )}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{f.premium}</span>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AdMob info */}
        <motion.div className="bg-blue-50 rounded-2xl p-4 border border-blue-100"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="flex gap-3">
            <MessageSquare className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-800">À propos des publicités</p>
              <p className="text-xs text-blue-600 mt-1">
                Les publicités Google AdMob sont affichées uniquement pour les utilisateurs gratuits dans l'application Android. En passant à Premium, toutes les publicités disparaissent définitivement.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
