import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export default function ScanPage() {
  const [, setLocation] = useLocation();
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStartedRef = useRef(false);

  useEffect(() => {
    const elementId = "reader";
    const element = document.getElementById(elementId);
    if (!element || isStartedRef.current) return;

    const html5QrCode = new Html5Qrcode(elementId);
    html5QrCodeRef.current = html5QrCode;
    isStartedRef.current = true;

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras || cameras.length === 0) return;
        const cameraId = cameras[cameras.length - 1].id;
        return html5QrCode.start(
          cameraId,
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            html5QrCode.stop().catch(() => {});
            setLocation(`/product/${decodedText}`);
          },
          () => {}
        );
      })
      .catch((err) => {
        console.error("Camera error:", err);
      });

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
        isStartedRef.current = false;
      }
    };
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-black relative flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center text-white">
        <button
          onClick={() => setLocation("/")}
          className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">Scan Barcode</h1>
        <div className="w-10" />
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div
          id="reader"
          className="w-full max-w-md overflow-hidden rounded-3xl bg-black"
          style={{ minHeight: 300 }}
        />

        {/* Corner overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl -mt-1 -ml-1" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl -mt-1 -mr-1" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl -mb-1 -ml-1" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl -mb-1 -mr-1" />
            <div className="absolute left-4 right-4 h-0.5 bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-scan" />
          </div>
        </div>

        <p className="text-white/70 text-sm mt-8 text-center px-8 z-20">
          Pointez la caméra vers un code-barres pour l'analyser instantanément.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
