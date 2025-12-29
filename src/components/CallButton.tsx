import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CallButtonProps {
  onClick: () => void;
}

const CallButton = ({ onClick }: CallButtonProps) => {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center space-y-4">
        <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground tracking-tight">
          Call <span className="text-primary">Santa</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
         ക്രിസ്മസ് അപ്പുപ്പനോട് സംസാരിക്കാം ! Talk to Santa in Malayalam
        </p>
      </div>

      <button
        onClick={onClick}
        className="group relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-primary flex items-center justify-center 
                   transition-all duration-300 hover:scale-105 active:scale-95
                   call-button-glow animate-pulse-glow"
      >
        {/* Outer ring animation */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse-ring" />
        <div className="absolute inset-[-12px] rounded-full border-2 border-primary/20 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
        
        {/* Phone icon */}
        <Phone className="w-16 h-16 md:w-20 md:h-20 text-primary-foreground group-hover:animate-ring-shake" />
      </button>

      <p className="text-christmas-gold font-medium text-lg animate-float">
        📞 Tap to call Santa
      </p>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 text-4xl animate-twinkle">✨</div>
      <div className="absolute top-20 right-20 text-3xl animate-twinkle" style={{ animationDelay: "0.7s" }}>🎄</div>
      <div className="absolute bottom-20 left-20 text-3xl animate-twinkle" style={{ animationDelay: "1.4s" }}>🎁</div>
    </div>
  );
};

export default CallButton;
