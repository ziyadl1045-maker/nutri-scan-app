import { Link, useLocation } from "wouter";
import { Home, Scan, MessageSquare, User } from "lucide-react";
import { motion } from "framer-motion";

export function BottomNav() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/scan", icon: Scan, label: "Scan" },
    { path: "/chat", icon: MessageSquare, label: "Ask AI" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around px-2 py-2 md:py-3 max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link key={item.path} href={item.path} className="relative flex flex-col items-center justify-center p-2 group cursor-pointer w-16">
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon
                className={`w-6 h-6 transition-colors duration-200 ${
                  active ? "text-primary stroke-[2.5px]" : "text-muted-foreground group-hover:text-primary/70"
                }`}
              />
              <span className={`text-[10px] mt-1 font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
