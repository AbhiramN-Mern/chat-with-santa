import { useState, useEffect, useRef } from "react";
import { PhoneOff, Mic, MicOff, Volume2, Send, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import type { SpeechRecognition } from "@/types/speech.d";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CallScreenProps {
  onEndCall: () => void;
}

const CallScreen = ({ onEndCall }: CallScreenProps) => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ringing audio
  useEffect(() => {
    const ringAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    ringAudio.loop = true;
    ringAudio.volume = 0.3;
    
    ringAudio.play().catch(console.error);

    const timer = setTimeout(() => {
      ringAudio.pause();
      setIsConnecting(false);
      // Santa's greeting
      sendToSanta("ക്രിസ്മസ് അപ്പുപ്പനോട് സംസാരിക്കാം ");
    }, 3000);

    return () => {
      ringAudio.pause();
      clearTimeout(timer);
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      
      recognition.lang = 'ml-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        setCurrentTranscript(transcript);

        if (event.results[0].isFinal) {
          sendToSanta(transcript);
          setCurrentTranscript("");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone Access Needed",
            description: "Please allow microphone access to talk to Santa",
            variant: "destructive",
          });
        } else if (event.error === 'network') {
          setShowTextInput(true);
          toast({
            title: "Voice unavailable",
            description: "Network error. Using text input instead. Type your message!",
          });
        } else if (event.error === 'no-speech') {
          toast({
            title: "No speech detected",
            description: "Please try again or use text input",
          });
        } else {
          toast({
            title: "Speech recognition error",
            description: `${event.error}. Try again or use text input.`,
          });
        }
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
      setShowTextInput(true);
    }

    return () => {
      recognitionRef.current?.abort();
    };
  }, [toast]);

  const sendToSanta = async (text: string) => {
    const userMessage: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/santa-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get Santa's response");
      }

      const data = await response.json();
      const santaMessage: Message = { role: "assistant", content: data.reply };
      setMessages(prev => [...prev, santaMessage]);

      // Speak Santa's response
      await speakText(data.reply);
    } catch (error) {
      console.error("Santa chat error:", error);
      toast({
        title: "Connection Issue",
        description: "Couldn't reach Santa. Try again!",
        variant: "destructive",
      });
    }
  };

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/santa-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("ElevenLabs TTS error:", response.status, errorData);
        throw new Error(`TTS service unavailable (${response.status})`);
      }

      const data = await response.json();
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
      };
      
      await audio.play();
    } catch (error) {
      console.error("TTS error, falling back to browser TTS:", error);
      // Fallback to browser TTS
      useBrowserTTS(text);
    }
  };

  const useBrowserTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ml-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = (event) => {
        console.error("Browser TTS error:", event.error);
        setIsSpeaking(false);
      };
      
      speechSynthesis.speak(utterance);
    } else {
      console.error("Speech Synthesis not supported");
      setIsSpeaking(false);
    }
  };

  const toggleMicrophone = () => {
    if (!speechSupported) {
      setShowTextInput(true);
      return;
    }

    if (isMuted) {
      setIsMuted(false);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Recognition start error:", e);
        setShowTextInput(true);
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendToSanta(textInput.trim());
      setTextInput("");
    }
  };

  const handleEndCall = () => {
    recognitionRef.current?.abort();
    audioRef.current?.pause();
    onEndCall();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-night to-background">
      {/* Call header */}
      <div className="flex flex-col items-center pt-12 pb-6">
        {isConnecting ? (
          <>
            <div className="w-24 h-24 rounded-full bg-muted animate-pulse mb-4 flex items-center justify-center text-5xl">
              🎅
            </div>
            <h2 className="font-display text-2xl text-foreground">Calling Santa...</h2>
            <p className="text-muted-foreground animate-pulse">Ringing 📞</p>
          </>
        ) : (
          <>
            <div className={`w-24 h-24 rounded-full bg-primary/20 mb-4 flex items-center justify-center text-5xl
                            ${isSpeaking ? 'animate-pulse-ring' : ''}`}>
              🎅
            </div>
            <h2 className="font-display text-2xl text-foreground">Santa Claus</h2>
            <div className="flex items-center gap-2 text-holly">
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
              <span className="text-sm">{isSpeaking ? "Speaking..." : "Connected"}</span>
            </div>
          </>
        )}
      </div>

      {/* Transcript area */}
      <div 
        ref={transcriptRef}
        className="flex-1 overflow-y-auto px-4 pb-4 space-y-4"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[85%] p-4 rounded-2xl ${
              msg.role === "user"
                ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                : "mr-auto bg-muted text-foreground rounded-bl-sm"
            }`}
          >
            <p className="text-sm leading-relaxed">{msg.content}</p>
          </div>
        ))}
        
        {currentTranscript && (
          <div className="max-w-[85%] ml-auto p-4 rounded-2xl bg-primary/50 text-primary-foreground rounded-br-sm">
            <p className="text-sm italic">{currentTranscript}...</p>
          </div>
        )}
      </div>

      {/* Text input (fallback) */}
      {showTextInput && (
        <form onSubmit={handleTextSubmit} className="px-4 pb-4">
          <div className="flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message to Santa..."
              className="flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="w-12 h-12 rounded-full bg-christmas-gold flex items-center justify-center
                        hover:bg-christmas-gold-glow transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5 text-secondary-foreground" />
            </button>
          </div>
        </form>
      )}

      {/* Call controls */}
      <div className="flex justify-center items-center gap-8 pb-12 pt-6 bg-gradient-to-t from-background to-transparent">
        {/* Toggle text input */}
        <button
          onClick={() => setShowTextInput(!showTextInput)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all
                     ${showTextInput ? 'bg-christmas-gold' : 'bg-muted hover:bg-muted/80'}`}
        >
          <MessageSquare className={`w-6 h-6 ${showTextInput ? 'text-secondary-foreground' : 'text-foreground'}`} />
        </button>

        {/* Main mic/listen button */}
        <button
          onClick={toggleMicrophone}
          disabled={isConnecting || isMuted || !speechSupported}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all
                     ${isListening 
                       ? 'bg-holly animate-pulse-ring' 
                       : speechSupported 
                         ? 'bg-christmas-gold hover:bg-christmas-gold-glow'
                         : 'bg-muted cursor-not-allowed'}
                     disabled:opacity-50`}
        >
          {speechSupported ? (
            <Mic className={`w-8 h-8 ${isListening ? 'text-snow' : 'text-secondary-foreground'}`} />
          ) : (
            <MicOff className="w-8 h-8 text-muted-foreground" />
          )}
        </button>

        {/* End call button */}
        <button
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center
                     hover:bg-destructive/90 transition-all"
        >
          <PhoneOff className="w-6 h-6 text-destructive-foreground" />
        </button>
      </div>

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-holly/90 px-4 py-2 rounded-full">
          <p className="text-snow text-sm font-medium">🎤 Listening...</p>
        </div>
      )}

      {/* Speech not supported hint */}
      {!speechSupported && !showTextInput && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-muted px-4 py-2 rounded-full">
          <p className="text-muted-foreground text-sm">Tap 💬 to type your message</p>
        </div>
      )}
    </div>
  );
};

export default CallScreen;
