import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
import { Scan, ChevronRight, User } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Dummy recent scans for MVP visualization
  const recentScans = [
    { id: 1, name: "Oat Milk Barista", score: 22, date: "Today" },
    { id: 2, name: "Chocolate Cookies", score: 85, date: "Yesterday" },
    { id: 3, name: "Green Tea", score: 12, date: "Yesterday" },
  ];

  const getScoreColor = (score: number) => {
    if (score <= 25) return "bg-emerald-500";
    if (score <= 45) return "bg-lime-500";
    if (score <= 70) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-8 pb-12 rounded-b-[2.5rem] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-muted-foreground font-medium">Welcome back,</p>
            <h1 className="text-3xl font-bold text-slate-900 font-display">
              {user?.firstName || "Friend"}!
            </h1>
          </div>
          <Link href="/profile">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center cursor-pointer hover:bg-emerald-200 transition-colors">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="text-emerald-700 w-6 h-6" />
              )}
            </div>
          </Link>
        </div>

        {/* Hero Card */}
        <Link href="/scan">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-primary rounded-3xl p-6 text-white shadow-lg shadow-emerald-900/20 relative overflow-hidden cursor-pointer group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-colors" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Scan Product</h2>
                <p className="text-emerald-100">Analyze barcodes instantly</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Scan className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </Link>
      </div>

      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Recent Scans</h3>
          <button className="text-sm font-semibold text-primary">View All</button>
        </div>

        <div className="space-y-4">
          {recentScans.map((scan) => (
            <motion.div 
              key={scan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${getScoreColor(scan.score)} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                  {scan.score}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{scan.name}</h4>
                  <p className="text-xs text-muted-foreground">{scan.date}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </motion.div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
