import { useState, useRef } from "react";
import { Mic, MicOff, Loader2, Send, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface AIVoiceAgentProps {
  contextMode: "global" | "invoice";
  invoiceData?: any;
  onAction: (action: any) => void;
  className?: string;
}

export function AIVoiceAgent({ contextMode, invoiceData, onAction, className = "" }: AIVoiceAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [transcriptText, setTranscriptText] = useState("");
  const [manualText, setManualText] = useState("");
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    setSpeechSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscriptText("");
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      if (transcript) {
        setTranscriptText(transcript);
        await processCommand(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        toast.error("Microphone permission denied. Please type your command.");
      } else {
        toast.error("Could not hear you. Please try again or type below.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processCommand = async (text: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/ai-voice-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          contextMode,
          invoiceData
        })
      });
      
      if (!res.ok) throw new Error("Failed to process command");
      const action = await res.json();
      
      onAction(action);
      setIsOpen(false);
    } catch (err: any) {
      console.error("AI Voice Error:", err);
      toast.error("Failed to process voice command.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTimeout(() => {
        startListening();
      }, 300);
    } else {
      stopListening();
      setTranscriptText("");
      setManualText("");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    const cmd = manualText.trim();
    setTranscriptText(cmd);
    setManualText("");
    await processCommand(cmd);
  };

  const globalSuggestions = [
    "Find invoices from Super Smelters",
    "Show me zinc transactions",
    "Search for items named HR Coil",
    "Find invoices with total > 45 lakhs",
  ];

  const invoiceSuggestions = [
    "Change per unit cost of item 1 to 500",
    "Change the quantity of the first item to 10",
    "Set the unit cost of HR Coil to 450",
    "Change the second item quantity to 15",
  ];

  const suggestions = contextMode === "global" ? globalSuggestions : invoiceSuggestions;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center justify-center transition-all focus:outline-none bg-white text-blue-mid border border-blue-mid/10 hover:bg-blue-light hover:text-blue-ink shadow-sm cursor-pointer ${className}`}
          title="AI Voice Assistant"
        >
          <Mic size={20} className="relative z-10" />
        </motion.button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md bg-white border border-blue-mid/10 rounded-3xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-blue-deep flex items-center gap-2">
            <Mic className="text-blue-mid h-5 w-5 animate-pulse-glow" />
            AI Voice Assistant
          </DialogTitle>
          <DialogDescription className="text-xs text-blue-mid/60 font-bold uppercase tracking-wider">
            {contextMode === "global" ? "Global Search Command Center" : "Detailed Drawer Invoice Editor"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          {/* Pulsing Visualizer */}
          <div className="relative flex items-center justify-center">
            <AnimatePresence>
              {isListening && (
                <>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                    className="absolute h-24 w-24 rounded-full bg-blue-mid/20"
                  />
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 2.0, opacity: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: "easeOut" }}
                    className="absolute h-24 w-24 rounded-full bg-blue-mid/10"
                  />
                </>
              )}
            </AnimatePresence>

            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`h-20 w-20 rounded-full flex items-center justify-center border-2 shadow-lg transition-all cursor-pointer ${
                isListening 
                  ? "bg-red-500 border-red-400 text-white shadow-red-500/20" 
                  : isProcessing 
                    ? "bg-blue-mid/10 border-blue-mid/20 text-blue-mid"
                    : "bg-blue-light border-blue-mid/20 text-blue-mid hover:bg-blue-mid/5 shadow-blue-mid/5"
              }`}
            >
              {isProcessing ? (
                <Loader2 size={32} className="animate-spin" />
              ) : isListening ? (
                <MicOff size={32} />
              ) : (
                <Mic size={32} />
              )}
            </button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs font-black text-blue-ink uppercase tracking-wider">
              {isProcessing 
                ? "AI is thinking..." 
                : isListening 
                  ? "Listening... Speak your request" 
                  : !speechSupported
                    ? "Voice not supported in this browser"
                    : "Microphone Idle"}
            </p>
            {transcriptText && (
              <p className="text-xs text-blue-mid/70 italic px-4 font-medium max-w-sm">
                "{transcriptText}"
              </p>
            )}
          </div>
        </div>

        {/* Suggested Prompts List */}
        <div className="space-y-2 border-t border-blue-mid/5 pt-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-blue-mid/60 flex items-center gap-1">
            <HelpCircle size={12} /> Click a suggestion to try
          </span>
          <div className="flex flex-col gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setTranscriptText(s);
                  processCommand(s);
                }}
                disabled={isProcessing}
                className="text-left text-[11px] font-semibold text-blue-deep bg-blue-light/50 border border-blue-mid/5 rounded-xl px-3 py-2 hover:bg-blue-light hover:border-blue-mid/15 transition-all cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard Input Fallback */}
        <form onSubmit={handleManualSubmit} className="flex gap-2 w-full border-t border-blue-mid/5 pt-4 mt-2">
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            disabled={isProcessing}
            placeholder={
              !speechSupported 
                ? "Type your request here..." 
                : "Or type your request here..."
            }
            className="flex-1 px-4 py-2.5 bg-blue-light/30 border border-blue-mid/10 rounded-2xl text-xs font-semibold text-blue-ink focus:outline-none focus:border-blue-mid transition-all"
          />
          <button 
            type="submit" 
            disabled={isProcessing || !manualText.trim()}
            className="h-9 w-9 bg-blue-mid text-white rounded-2xl flex items-center justify-center hover:bg-blue-deep active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer shadow-sm shadow-blue-mid/20"
          >
            <Send size={14} />
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
