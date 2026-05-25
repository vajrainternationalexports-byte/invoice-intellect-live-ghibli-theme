import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QrCode, Link2, Copy, Check, Info, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function MobileAccessHelper({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [mode, setMode] = useState<"wifi" | "tunnel">(() => {
    return (localStorage.getItem("mobile_access_mode") as "wifi" | "tunnel") || "wifi";
  });
  const [localIp, setLocalIp] = useState("127.0.0.1");
  const [port, setPort] = useState("5050");
  const [tunnelUrl, setTunnelUrl] = useState("https://1663422ceca54b30-202-8-115-176.serveousercontent.com");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem("mobile_access_mode", mode);
  }, [mode]);

  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        const response = await fetch("/api/server-info");
        if (response.ok) {
          const data = await response.json();
          if (data.localIp) setLocalIp(data.localIp);
          if (data.port) setPort(data.port);
          if (data.tunnelUrl) setTunnelUrl(data.tunnelUrl);
        }
      } catch (err) {
        console.error("Failed to fetch server info:", err);
      }
    };
    fetchServerInfo();
  }, []);

  const wifiUrl = `http://${localIp}:${port}`;
  const activeUrl = mode === "wifi" ? wifiUrl : tunnelUrl;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    toast.success(`${mode === "wifi" ? "Local network" : "Tunnel"} URL copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenTunnel = () => {
    window.open(activeUrl, "_blank");
  };

  const renderContent = () => (
    <div className="space-y-4 text-center">
      {/* Tab Switcher */}
      <div className="flex bg-blue-light border border-blue-mid/10 p-0.5 rounded-xl">
        <button
          onClick={() => setMode("wifi")}
          className={`flex-1 text-[8px] font-black uppercase tracking-wider py-1.5 rounded-lg transition-all ${
            mode === "wifi"
              ? "bg-white text-blue-ink shadow-sm"
              : "text-blue-mid hover:text-blue-ink"
          }`}
        >
          Local Wi-Fi
        </button>
        <button
          onClick={() => setMode("tunnel")}
          className={`flex-1 text-[8px] font-black uppercase tracking-wider py-1.5 rounded-lg transition-all ${
            mode === "tunnel"
              ? "bg-white text-blue-ink shadow-sm"
              : "text-blue-mid hover:text-blue-ink"
          }`}
        >
          Public Tunnel
        </button>
      </div>

      <div className="bg-blue-light/50 p-3 rounded-2xl border border-blue-mid/10 flex flex-col items-center gap-2">
        <div className="bg-white p-2 rounded-xl border border-blue-mid/15 shadow-sm">
          <img 
            src={qrImageUrl} 
            alt="Mobile Access QR Code" 
            className="w-36 h-36 rounded-lg select-none"
            onError={() => toast.error("Failed to load QR code image")}
          />
        </div>
        <p className="text-[9px] text-blue-mid font-bold uppercase tracking-widest">
          {mode === "wifi" ? "Scan to connect on local Wi-Fi" : "Scan to connect via public tunnel"}
        </p>
      </div>

      <div className="space-y-1.5 text-left">
        <label className="text-[9px] font-black text-blue-ink uppercase tracking-widest pl-1">
          {mode === "wifi" ? "Direct Wi-Fi URL (Same Network)" : "Public Tunnel URL"}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={activeUrl}
              readOnly={mode === "wifi"}
              onChange={(e) => {
                if (mode === "tunnel") setTunnelUrl(e.target.value);
              }}
              placeholder={mode === "wifi" ? wifiUrl : "https://your-tunnel.serveousercontent.com"}
              className={`w-full text-[10px] font-semibold px-3 py-2 bg-blue-light border border-blue-mid/15 rounded-xl outline-none focus:border-blue-mid/40 pr-8 text-blue-ink ${
                mode === "wifi" ? "opacity-80 cursor-default" : ""
              }`}
            />
            <Link2 className="absolute right-3 top-2.5 text-blue-mid/45" size={12} />
          </div>
          <button
            onClick={handleCopy}
            className="px-2.5 bg-white border border-blue-mid/15 hover:bg-blue-light rounded-xl text-blue-mid active:scale-95 transition-all flex items-center justify-center shadow-sm"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <div className="bg-blue-light/40 border border-blue-mid/10 rounded-xl p-3 text-left">
        <div className="flex gap-2 items-start">
          <Info size={14} className="text-blue-mid mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="text-[9px] font-black text-blue-ink uppercase tracking-wider">How to connect:</h4>
            <div className="text-[8px] text-blue-mid/80 font-bold leading-normal uppercase space-y-1">
              {mode === "wifi" ? (
                <>
                  <p>1. Make sure your phone is on the SAME Wi-Fi network.</p>
                  <p>2. Scan the QR code or go to the direct URL: <span className="lowercase font-mono text-blue-deep">{wifiUrl}</span></p>
                </>
              ) : (
                <>
                  <p>1. Start tunnel in terminal: <code className="block font-mono bg-blue-mid/10 p-1 rounded text-[7px] text-blue-deep select-all lowercase font-normal mt-1">ssh -R 80:localhost:5050 serveo.net</code></p>
                  <p>2. Enter tunnel URL above and scan the QR code.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[320px] bg-white/97 backdrop-blur-2xl border border-blue-mid/15 rounded-3xl p-5 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-md font-black text-blue-ink tracking-tight flex items-center gap-2">
              <QrCode size={18} className="text-blue-mid" />
              Mobile Access
            </DialogTitle>
            <DialogDescription className="text-[9px] font-bold text-blue-mid/60 uppercase tracking-wider">
              Access the portal on your phone
            </DialogDescription>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="hidden xl:flex flex-col w-72 bg-white/90 backdrop-blur-xl border border-blue-mid/15 rounded-3xl p-5 shadow-[0_20px_50px_rgba(30,58,138,0.12)] space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-blue-ink tracking-widest uppercase flex items-center gap-1.5">
          <Sparkles size={12} className="text-blue-mid" />
          Mobile Access Portal
        </h3>
        <button 
          onClick={handleOpenTunnel}
          className="text-[8px] font-black text-blue-mid hover:underline uppercase tracking-wider"
        >
          Open App ↗
        </button>
      </div>
      {renderContent()}
    </div>
  );
}
