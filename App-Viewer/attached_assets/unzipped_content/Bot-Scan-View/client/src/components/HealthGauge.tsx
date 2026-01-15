import { motion } from "framer-motion";
import { Activity, Heart, AlertTriangle, Skull } from "lucide-react";

interface HealthGaugeProps {
  score: number; // 0-100
}

export function HealthGauge({ score }: HealthGaugeProps) {
  // Logic: 10-25 very good, 26-45 good, 46-70 bad, 71-100 very bad
  // Lower is better in this specific schema requested by user
  
  let status = "";
  let color = "";
  let Icon = Activity;
  let message = "";

  if (score <= 25) {
    status = "Very Good";
    color = "text-emerald-500";
    Icon = Heart;
    message = "Excellent nutritional balance!";
  } else if (score <= 45) {
    status = "Good";
    color = "text-lime-500";
    Icon = Activity;
    message = "A healthy choice.";
  } else if (score <= 70) {
    status = "Bad";
    color = "text-orange-500";
    Icon = AlertTriangle;
    message = "Consume in moderation.";
  } else {
    status = "Very Bad";
    color = "text-red-500";
    Icon = Skull;
    message = "Avoid if possible.";
  }

  // Calculate rotation for gauge (semi-circle)
  // 0 -> -90deg, 100 -> 90deg
  const rotation = -90 + (score / 100) * 180;

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-emerald-100">
      <div className="relative w-48 h-24 overflow-hidden mb-4">
        {/* Gauge Background */}
        <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-slate-100 box-border"></div>
        
        {/* Active Arc - Simplified visual representation */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full flex justify-between px-2">
            <div className="w-1 h-2 bg-emerald-400 rounded-full" />
            <div className="w-1 h-2 bg-lime-400 rounded-full" />
            <div className="w-1 h-2 bg-orange-400 rounded-full" />
            <div className="w-1 h-2 bg-red-400 rounded-full" />
        </div>

        {/* Needle */}
        <motion.div 
          className="absolute bottom-0 left-1/2 w-1 h-24 bg-slate-800 origin-bottom rounded-full"
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          style={{ transformOrigin: "bottom center", zIndex: 10 }}
        >
          <div className="absolute -top-1 -left-[3px] w-2.5 h-2.5 bg-slate-800 rounded-full" />
        </motion.div>
        
        {/* Center Hub */}
        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 rounded-full z-20" />
      </div>

      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Icon className={`w-6 h-6 ${color}`} />
          <h3 className={`text-2xl font-bold font-display ${color}`}>{status}</h3>
        </div>
        <p className="text-4xl font-black text-slate-900">{score}<span className="text-lg text-muted-foreground font-medium ml-1">/100</span></p>
        <p className="text-sm text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}
