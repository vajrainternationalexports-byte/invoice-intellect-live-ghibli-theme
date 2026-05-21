import { useState, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface AIVoiceAgentProps {
  contextMode: "global" | "invoice";
  invoiceData?: any;
  onAction: (action: any) => void;
  className?: string;
}

export function AIVoiceAgent({ contextMode, invoiceData, onAction, className = "" }: AIVoiceAgentProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening... Speak your command.", { duration: 3000 });
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      
      if (!transcript) return;
      
      setIsProcessing(true);
      try {
        const res = await fetch("/api/ai-voice-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            contextMode,
            invoiceData
          })
        });
        
        if (!res.ok) throw new Error("Failed to process command");
        const action = await res.json();
        
        // Let the parent component handle the execution
        onAction(action);
        
      } catch (err: any) {
        console.error("AI Voice Error:", err);
        toast.error("Failed to process voice command.");
      } finally {
        setIsProcessing(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      toast.error("Could not hear you properly. Please try again.");
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

  if (isProcessing) {
    return (
      <div className={`flex items-center justify-center p-2 rounded-full bg-blue-medium/10 text-blue-medium ${className}`}>
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={isListening ? stopListening : startListening}
      className={`relative flex items-center justify-center p-2 rounded-xl transition-all focus:outline-none ${
        isListening 
          ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]" 
          : "bg-white text-blue-mid border border-blue-mid/10 hover:bg-blue-light hover:text-blue-ink shadow-sm"
      } ${className}`}
      title={isListening ? "Stop Listening" : "AI Voice Assistant"}
    >
      {isListening && (
        <span className="absolute inset-0 rounded-xl bg-red-400 animate-ping opacity-75"></span>
      )}
      {isListening ? <MicOff size={24} className="relative z-10" /> : <Mic size={24} className="relative z-10" />}
    </motion.button>
  );
}
