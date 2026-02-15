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
      "profile": "Profile",
      "welcome_back": "Welcome back,",
      "recent_scans": "Recent Scans",
      "view_all": "View All",
      "no_scans_yet": "No scans yet",
      "scan_history": "Scan History",
      "first_name": "First Name",
      "last_name": "Last Name",
      "age": "Age",
      "gender": "Gender",
      "select": "Select",
      "male": "Male",
      "female": "Female",
      "other": "Other",
      "saving": "Saving...",
      "save_changes": "Save Changes",
      "sign_out": "Sign Out",
      "profile_updated": "Profile updated",
      "profile_saved_desc": "Your information has been saved.",
      "scan_any_barcode_title": "Scan Product",
      "analyze_barcodes": "Analyze barcodes instantly",
      "enter_barcode": "Enter barcode manually",
      "manual": "Manual",
      "analyze": "Analyze"
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
      "profile": "Profil",
      "welcome_back": "Bon retour,",
      "recent_scans": "Scans récents",
      "view_all": "Voir tout",
      "no_scans_yet": "Aucun scan pour le moment",
      "scan_history": "Historique des scans",
      "first_name": "Prénom",
      "last_name": "Nom",
      "age": "Âge",
      "gender": "Genre",
      "select": "Sélectionner",
      "male": "Homme",
      "female": "Femme",
      "other": "Autre",
      "saving": "Enregistrement...",
      "save_changes": "Enregistrer les modifications",
      "sign_out": "Se déconnecter",
      "profile_updated": "Profil mis à jour",
      "profile_saved_desc": "Vos informations ont été enregistrées.",
      "scan_any_barcode_title": "Scanner un produit",
      "analyze_barcodes": "Analysez les codes-barres instantanément",
      "enter_barcode": "Entrer le code-barres manuellement",
      "manual": "Clavier",
      "analyze": "Analyser"
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
      "profile": "الملف الشخصي",
      "welcome_back": "مرحباً بك،",
      "recent_scans": "عمليات المسح الأخيرة",
      "view_all": "عرض الكل",
      "no_scans_yet": "لا توجد عمليات مسح بعد",
      "scan_history": "تاريخ المسح",
      "first_name": "الاسم الأول",
      "last_name": "اسم العائلة",
      "age": "العمر",
      "gender": "الجنس",
      "select": "اختر",
      "male": "ذكر",
      "female": "أنثى",
      "other": "آخر",
      "saving": "جاري الحفظ...",
      "save_changes": "حفظ التغييرات",
      "sign_out": "تسجيل الخروج",
      "profile_updated": "تم تحديث الملف الشخصي",
      "profile_saved_desc": "تم حفظ معلوماتك بنجاح.",
      "scan_any_barcode_title": "مسح المنتج",
      "analyze_barcodes": "تحليل الباركود فوراً",
      "enter_barcode": "أدخل الرمز الشريطي يدوياً",
      "manual": "يدوي",
      "analyze": "تحليل"
    }
  },
  zgh: {
    translation: {
      "welcome": "Ecc s tusi, dder yif.",
      "scan_any_barcode": "Sskan ay koud-bar ad tafid s tusi n AI isisatn n tdusi.",
      "join_tournaments": "Ddu s tmsizzal, tabaɛ timumi-nnk, sawl d unutrisyunist-nnk.",
      "log_in_google": "Kcm s Google",
      "log_in_apple": "Kcm s Apple",
      "instant_scanning": "Askan aziri",
      "instant_scanning_desc": "Afu n koud-bar zrb i mlyun n isafarn n ddunit.",
      "ai_analysis": "Asisat n AI",
      "ai_analysis_desc": "Ami s tusi n daxl f sskkʷaṛ, lidam d tdusi s umata.",
      "better_habits": "Timumi yifn",
      "better_habits_desc": "Fhm ay lli tccid t-ṣṣbu tdusi-nnk.",
      "dashboard": "Asala",
      "scan": "Askan",
      "chat": "Amsawal",
      "profile": "Amagal",
      "welcome_back": "Ansuf,",
      "recent_scans": "Askan n tizi-ad",
      "view_all": "Ẓr kullu",
      "no_scans_yet": "Ur illa walu n uskan",
      "scan_history": "Amazray n uskan",
      "first_name": "Isem",
      "last_name": "Isem n twja",
      "age": "Awttay",
      "gender": "Anaw",
      "select": "Sti",
      "male": "Amaynu",
      "female": "Tamyunt",
      "other": "Wayyaḍ",
      "saving": "Ar issefru...",
      "save_changes": "Ssefru tismmay",
      "sign_out": "Ffɣ",
      "profile_updated": "Amagal ittyusmay",
      "profile_saved_desc": "Tusi-nnk ittyussefru.",
      "scan_any_barcode_title": "Sskan asafar",
      "analyze_barcodes": "Ssisat koud-bar imir",
      "enter_barcode": "Ara koud-bar s ufus",
      "manual": "Afus",
      "analyze": "Ssisat"
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
