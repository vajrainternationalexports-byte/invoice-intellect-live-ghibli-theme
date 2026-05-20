import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QrCode, Link2, Copy, Check, Info, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function MobileAccessHelper({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [tunnelUrl, setTunnelUrl] = useState(() => {
    return localStorage.getItem("serveo_tunnel_url") || "https://a2bad41e19e76d36-202-8-115-176.serveousercontent.com";
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem("serveo_tunnel_url", tunnelUrl);
  }, [tunnelUrl]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tunnelUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(tunnelUrl);
    setCopied(true);
    toast.success("Tunnel URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenTunnel = () => {
    window.open(tunnelUrl, "_blank");
  };

  const renderContent = () => (
    <div className="space-y-4 text-center">
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
          Scan with your mobile camera
        </p>
      </div>

      <div className="space-y-1.5 text-left">
        <label className="text-[9px] font-black text-blue-ink uppercase tracking-widest pl-1">
          Public Tunnel URL (Serveo / Ngrok)
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={tunnelUrl}
              onChange={(e) => setTunnelUrl(e.target.value)}
              placeholder="https://your-tunnel.serveousercontent.com"
              className="w-full text-[10px] font-semibold px-3 py-2 bg-blue-light border border-blue-mid/15 rounded-xl outline-none focus:border-blue-mid/40 pr-8 text-blue-ink"
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
              <p>1. Start your local server (`npm run dev`)</p>
              <p>2. Run in terminal to establish tunnel:</p>
              <code className="block font-mono bg-blue-mid/10 p-1.5 rounded text-[8px] text-blue-deep select-all break-all lowercase font-normal">
                ssh -R 80:localhost:5050 serveo.net
              </code>
              <p>3. Copy the URL from the terminal output and paste it above!</p>
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
