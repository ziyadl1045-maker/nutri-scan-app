import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      "welcome": "Eat smarter, live better.",
      "scan_any_barcode": "Scan any barcode to instantly get AI-driven health insights.",
      "join_tournaments": "Join tournaments, track your habits, and chat with your personal nutritionist.",
      "log_in_google": "Log In with Google",
      "log_in_apple": "Log In with Apple",
      "instant_scanning": "Instant Scanning",
      "instant_scanning_desc": "Lightning fast barcode detection for millions of products worldwide.",
      "ai_analysis": "AI Analysis",
      "ai_analysis_desc": "Get deep insights into sugar, lipids, and overall health impact.",
      "better_habits": "Better Habits",
      "better_habits_desc": "Understand what you eat and improve your diet effortlessly.",
      "dashboard": "Dashboard",
      "scan": "Scan",
      "chat": "Chat",
      "profile": "Profile"
    }
  },
  fr: {
    translation: {
      "welcome": "Mangez mieux, vivez mieux.",
      "scan_any_barcode": "Scannez n'importe quel code-barres pour obtenir instantanément des informations santé basées sur l'IA.",
      "join_tournaments": "Rejoignez des tournois, suivez vos habitudes et discutez avec votre nutritionniste personnel.",
      "log_in_google": "Se connecter avec Google",
      "log_in_apple": "Se connecter avec Apple",
      "instant_scanning": "Scan instantané",
      "instant_scanning_desc": "Détection de code-barres ultra-rapide pour des millions de produits dans le monde.",
      "ai_analysis": "Analyse IA",
      "ai_analysis_desc": "Obtenez des informations approfondies sur le sucre, les lipides et l'impact global sur la santé.",
      "better_habits": "Meilleures habitudes",
      "better_habits_desc": "Comprenez ce que vous mangez et améliorez votre alimentation sans effort.",
      "dashboard": "Tableau de bord",
      "scan": "Scanner",
      "chat": "Chat",
      "profile": "Profil"
    }
  },
  ar: {
    translation: {
      "welcome": "كُل بذكاء، لتعيش أفضل.",
      "scan_any_barcode": "امسح أي رمز شريطي للحصول فوراً على رؤى صحية مدعومة بالذكاء الاصطناعي.",
      "join_tournaments": "انضم إلى المسابقات، وتتبع عاداتك، وتحدث مع أخصائي التغذية الخاص بك.",
      "log_in_google": "تسجيل الدخول باستخدام جوجل",
      "log_in_apple": "تسجيل الدخول باستخدام أبل",
      "instant_scanning": "مسح فوري",
      "instant_scanning_desc": "كشف سريع للرموز الشريطية لملايين المنتجات حول العالم.",
      "ai_analysis": "تحليل الذكاء الاصطناعي",
      "ai_analysis_desc": "احصل على رؤى عميقة حول السكر والدهون والتأثير الصحي العام.",
      "better_habits": "عادات أفضل",
      "better_habits_desc": "افهم ما تأكله وحسّن نظامك الغذائي بسهولة.",
      "dashboard": "لوحة التحكم",
      "scan": "مسح",
      "chat": "دردشة",
      "profile": "الملف الشخصي"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;
