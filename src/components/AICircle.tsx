import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/jarvis_ui/button';
import { useToast } from '@/hooks/use-toast';

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface AICircleProps {
  size?: number;
  onVoiceInput?: (text: string) => void;
  isListening?: boolean;
  isSpeaking?: boolean;
}

export const AICircle: React.FC<AICircleProps> = ({
  size = 300,
  onVoiceInput,
  isListening = false,
  isSpeaking = false
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();
  const circleRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onstart = () => {
          setIsActive(true);
        };

        recognitionInstance.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          onVoiceInput?.(transcript);
        };

        recognitionInstance.onend = () => {
          setIsActive(false);
        };

        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsActive(false);
          toast({
            title: "Voice Recognition Error",
            description: "Please check your microphone permissions and try again.",
            variant: "destructive"
          });
        };

        setRecognition(recognitionInstance);
        setIsSupported(true);
      } else {
        console.warn('Speech Recognition not supported in this browser');
        setIsSupported(false);
      }
    }
  }, [onVoiceInput, toast]);

  const handleClick = () => {
    if (!isSupported) {
      toast({
        title: "Voice Recognition Unavailable",
        description: "Your browser doesn't support voice recognition. Please use a modern browser.",
        variant: "destructive"
      });
      return;
    }

    if (isActive) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
  };

  // Generate particles for visual effect
  const generateParticles = () => {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45) * (Math.PI / 180);
      const distance = size * 0.4;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      particles.push(
        <div
          key={i}
          className="particle"
          style={{
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
            animationDelay: `${i * 0.2}s`
          }}
        />
      );
    }
    return particles;
  };

  // Generate tech rings
  const generateTechRings = () => {
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const scale = 1 + (i * 0.2);
      rings.push(
        <div
          key={i}
          className="tech-ring"
          style={{
            transform: `scale(${scale})`,
            animationDelay: `${i * 1}s`,
            animationDuration: `${10 + i * 2}s`
          }}
        />
      );
    }
    return rings;
  };

  const circleClasses = `
    ai-circle
    ${isActive || isListening ? 'active' : ''}
    ${isSpeaking ? 'speaking' : ''}
    cursor-pointer
    flex items-center justify-center
    transition-all duration-300
    select-none
  `;

  return (
    <div className="relative flex flex-col items-center gap-6">
      {/* AI Circle */}
      <div
        ref={circleRef}
        className={circleClasses}
        style={{ width: size, height: size }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Tech Rings */}
        {(isActive || isListening || isSpeaking) && generateTechRings()}
        
        {/* Particles */}
        {(isActive || isListening || isSpeaking) && generateParticles()}
        
        {/* Scanning Line */}
        {(isActive || isListening) && <div className="scan-line" />}
        
        {/* Center Icon */}
        <div className="relative z-10 flex items-center justify-center">
          {isActive || isListening ? (
            <Mic className="w-16 h-16 text-primary drop-shadow-lg" />
          ) : isSpeaking ? (
            <Volume2 className="w-16 h-16 text-primary-glow drop-shadow-lg animate-pulse" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-primary/60" />
            </div>
          )}
        </div>

        {/* Inner Glow */}
        <div 
          className="absolute inset-4 rounded-full"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary) / ${isActive || isSpeaking ? '0.3' : '0.1'}) 0%, transparent 70%)`,
            transition: 'all 0.3s ease'
          }}
        />
      </div>

      {/* Status Text */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-glow">
          {isActive || isListening ? 'Listening...' : 
           isSpeaking ? 'Speaking...' : 
           'AI Assistant'}
        </h2>
        <p className="text-muted-foreground">
          {isSupported 
            ? 'Click the circle to start voice interaction' 
            : 'Voice recognition not supported'}
        </p>
      </div>

      {/* Control Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={!isSupported}
        className="border-tech bg-background/10 hover:bg-primary/10 text-primary"
      >
        {isActive || isListening ? (
          <>
            <MicOff className="w-4 h-4 mr-2" />
            Stop Listening
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 mr-2" />
            Start Voice Input
          </>
        )}
      </Button>
    </div>
  );
};

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}