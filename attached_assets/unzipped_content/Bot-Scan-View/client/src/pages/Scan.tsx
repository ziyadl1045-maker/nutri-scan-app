import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useLocation } from "wouter";
import { ArrowLeft, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export default function ScanPage() {
  const [, setLocation] = useLocation();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Success callback
        scanner.clear();
        setLocation(`/product/${decodedText}`);
      },
      (errorMessage) => {
        // Error callback (scanners throw errors constantly when no code is found, ignore most)
        // console.log(errorMessage);
      }
    );

    scannerRef.current = scanner;

    return () => {
      try {
        scanner.clear();
      } catch (e) {
        console.error("Failed to clear scanner", e);
      }
    };
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-black relative flex flex-col">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center text-white">
        <button 
          onClick={() => setLocation("/")}
          className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">Scan Barcode</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Scanner Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div id="reader" className="w-full max-w-md overflow-hidden rounded-3xl bg-black"></div>
        
        {/* Custom Overlay (simulated) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl -mt-1 -ml-1"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl -mt-1 -mr-1"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl -mb-1 -ml-1"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl -mb-1 -mr-1"></div>
            
            {/* Scan Line Animation */}
            <div className="absolute left-4 right-4 h-0.5 bg-primary shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-scan"></div>
          </div>
        </div>

        <p className="text-white/70 text-sm mt-8 text-center px-8 z-20">
          Point your camera at a barcode to see nutritional details instantly.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
