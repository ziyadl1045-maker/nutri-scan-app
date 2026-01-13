import { Link } from "wouter";
import { ArrowRight, Leaf, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { SiGoogle } from "react-icons/si";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-[40%] -left-[20%] w-[60%] h-[60%] bg-emerald-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 lg:py-24">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm">
            <Leaf className="w-4 h-4" />
            <span>AI-Powered Nutrition Analysis</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold font-display tracking-tight text-foreground leading-[1.1]">
            Eat smarter, <br />
            <span className="text-gradient">live better.</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Scan any barcode to instantly get AI-driven health insights. 
            Join tournaments, track your habits, and chat with your personal nutritionist.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <a 
              href="/api/login"
              className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-primary text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 hover:scale-105 hover:shadow-xl transition-all duration-300"
            >
              <SiGoogle className="w-5 h-5 mr-2" />
              Log In with Google
            </a>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            {
              icon: Zap,
              title: "Instant Scanning",
              desc: "Lightning fast barcode detection for millions of products worldwide."
            },
            {
              icon: ShieldCheck,
              title: "AI Analysis",
              desc: "Get deep insights into sugar, lipids, and overall health impact."
            },
            {
              icon: Leaf,
              title: "Better Habits",
              desc: "Understand what you eat and improve your diet effortlessly."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-8 rounded-3xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
