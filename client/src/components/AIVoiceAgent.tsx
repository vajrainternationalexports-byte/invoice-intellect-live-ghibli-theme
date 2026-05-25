import { useState, useRef, useEffect } from "react";
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

const WORKER_CODE = `
let tokenizer = null;
let processor = null;
let model = null;
let modelName = "onnx-community/whisper-tiny-ONNX";
let isReady = false;

async function init() {
  try {
    self.postMessage({ status: "loading", data: "Importing Transformers library..." });
    const { AutoTokenizer, AutoProcessor, WhisperForConditionalGeneration, env } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.0");
    env.allowLocalModels = false;
    env.backends.onnx.logLevel = "info";

    self.postMessage({ status: "loading", data: "Loading tokenizer..." });
    tokenizer = await AutoTokenizer.from_pretrained(modelName);
    
    self.postMessage({ status: "loading", data: "Loading processor..." });
    processor = await AutoProcessor.from_pretrained(modelName);

    self.postMessage({ status: "loading", data: "Loading Whisper model (WebGPU)..." });
    model = await WhisperForConditionalGeneration.from_pretrained(modelName, {
      dtype: {
        encoder_model: "fp32",
        decoder_model_merged: "q4"
      },
      device: "webgpu"
    });

    isReady = true;
    self.postMessage({ status: "ready" });
  } catch (err) {
    try {
      self.postMessage({ status: "loading", data: "WebGPU failed. Falling back to CPU/WASM..." });
      const { AutoTokenizer, AutoProcessor, WhisperForConditionalGeneration, env } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.0");
      env.allowLocalModels = false;
      tokenizer = await AutoTokenizer.from_pretrained(modelName);
      processor = await AutoProcessor.from_pretrained(modelName);
      model = await WhisperForConditionalGeneration.from_pretrained(modelName, {
        dtype: {
          encoder_model: "fp32",
          decoder_model_merged: "q4"
        },
        device: "wasm"
      });
      isReady = true;
      self.postMessage({ status: "ready" });
    } catch (cpuErr) {
      self.postMessage({ status: "error", data: "Initialization failed: " + cpuErr.message });
    }
  }
}

self.addEventListener("message", async (e) => {
  const { type, data } = e.data || {};
  if (type === "load") {
    await init();
  } else if (type === "generate") {
    if (!isReady) {
      self.postMessage({ status: "error", data: "Model not ready." });
      return;
    }
    try {
      self.postMessage({ status: "transcribing_start" });
      const { audio, language } = data;
      const processedAudio = await processor(audio);
      
      const output = await model.generate({
        ...processedAudio,
        language: language === "auto" ? null : language,
      });

      const decoded = tokenizer.batch_decode(output, { skip_special_tokens: true });
      self.postMessage({ status: "complete", output: decoded[0] || "" });
    } catch (err) {
      self.postMessage({ status: "error", data: "Transcription failed: " + err.message });
    }
  }
});
`;

export function AIVoiceAgent({ contextMode, invoiceData, onAction, className = "" }: AIVoiceAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [modelProgress, setModelProgress] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [manualText, setManualText] = useState("");

  const workerRef = useRef<Worker | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null); // Browser native SpeechRecognition fallback

  // Resample audio to 16kHz mono Float32
  const processAudioBlob = async (blob: Blob): Promise<Float32Array> => {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    
    const numChannels = decoded.numberOfChannels;
    const inSr = decoded.sampleRate;
    const length = decoded.length;
    
    // Merge channels to mono
    const tmp = new Float32Array(length);
    for (let ch = 0; ch < numChannels; ch++) {
      const channelData = decoded.getChannelData(ch);
      if (ch === 0) {
        tmp.set(channelData);
      } else {
        for (let i = 0; i < length; i++) {
          tmp[i] += channelData[i];
        }
      }
    }
    
    if (numChannels > 1) {
      for (let i = 0; i < length; i++) {
        tmp[i] /= numChannels;
      }
    }
    
    // Resample to 16kHz
    const targetSr = 16000;
    if (inSr === targetSr) {
      await ctx.close();
      return tmp;
    }
    
    const ratio = inSr / targetSr;
    const outLen = Math.round(length / ratio);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const idx = i * ratio;
      const i0 = Math.floor(idx);
      const i1 = Math.min(i0 + 1, length - 1);
      const frac = idx - i0;
      out[i] = tmp[i0] * (1 - frac) + tmp[i1] * frac;
    }
    await ctx.close();
    return out;
  };

  const cleanTranscript = (text: string): string => {
    let cleaned = text.trim();
    // VOXpilot Filler Word Removal
    const fillers = ["um", "uh", "hmm", "like", "you know", "ah", "uhm"];
    for (const filler of fillers) {
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      cleaned = cleaned.replace(regex, "");
    }
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    if (cleaned.length > 0) {
      // VOXpilot Auto-Capitalization
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return cleaned;
  };

  // Initialize Whisper Web Worker
  const initWhisperWorker = () => {
    if (workerRef.current) return;
    
    try {
      setModelStatus("loading");
      setModelProgress("Spawning worker...");
      
      const blob = new Blob([WORKER_CODE], { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url, { type: "module" });
      URL.revokeObjectURL(url);
      
      worker.onmessage = (e) => {
        const { status, data, output } = e.data || {};
        if (status === "loading") {
          setModelProgress(data || "Loading model...");
        } else if (status === "ready") {
          setModelStatus("ready");
          setModelProgress("");
        } else if (status === "transcribing_start") {
          setIsProcessing(true);
        } else if (status === "complete") {
          setIsProcessing(false);
          const cleaned = cleanTranscript(output || "");
          setTranscriptText(cleaned);
          if (cleaned) {
            processCommand(cleaned);
          }
        } else if (status === "error") {
          setModelStatus("error");
          setModelProgress(data || "ASR worker error");
          toast.error("Local Whisper initialization failed, using browser native fallback.");
        }
      };
      
      worker.onerror = () => {
        setModelStatus("error");
        toast.error("Local Whisper failed, using browser native fallback.");
      };
      
      worker.postMessage({ type: "load" });
      workerRef.current = worker;
    } catch (err) {
      setModelStatus("error");
    }
  };

  // Start recording audio
  const startListening = async () => {
    // If local Whisper is not supported/failed, use native browser SpeechRecognition fallback
    if (modelStatus === "error" || modelStatus === "idle") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error("Speech recognition is not supported in this browser.");
        return;
      }
      
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
        const processed = cleanTranscript(transcript);
        setTranscriptText(processed);
        if (processed) {
          await processCommand(processed);
        }
      };
      
      recognition.onerror = (event: any) => {
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
      return;
    }

    // Use Local Whisper via MediaRecorder
    try {
      setIsListening(true);
      setTranscriptText("");
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        if (audioChunksRef.current.length === 0) return;
        
        try {
          const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          const float32Audio = await processAudioBlob(blob);
          if (workerRef.current) {
            workerRef.current.postMessage({
              type: "generate",
              data: { audio: float32Audio, language: "en" }
            });
          }
        } catch (e: any) {
          console.error("Audio processing failed", e);
          toast.error("Audio processing failed: " + e.message);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch (err: any) {
      setIsListening(false);
      toast.error("Failed to access microphone: " + err.message);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      // Stop all tracks to release microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
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
      // Lazy load local Whisper model when modal is opened
      initWhisperWorker();
      setTimeout(() => {
        startListening();
      }, 500);
    } else {
      stopListening();
      setTranscriptText("");
      setManualText("");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    const cmd = cleanTranscript(manualText.trim());
    setTranscriptText(cmd);
    setManualText("");
    await processCommand(cmd);
  };

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

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
          {/* Status info */}
          {modelStatus === "loading" && (
            <div className="text-center bg-blue-light/50 border border-blue-mid/10 rounded-xl px-4 py-2 w-full">
              <Loader2 className="animate-spin text-blue-mid h-4 w-4 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-blue-deep uppercase tracking-wider">{modelProgress}</p>
            </div>
          )}

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
              disabled={isProcessing || modelStatus === "loading"}
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
                  : modelStatus === "loading"
                    ? "Downloading local Whisper ASR model..."
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
                disabled={isProcessing || modelStatus === "loading"}
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
            placeholder="Type your request here..."
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
