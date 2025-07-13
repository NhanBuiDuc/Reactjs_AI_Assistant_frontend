import React, { useState, useCallback, useRef } from 'react';
import { AICircle } from './AICircle';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();
  const messageIdRef = useRef(0);

  // Generate simple AI responses (replace with actual AI API later)
  const generateAIResponse = (userInput: string): string => {
    const responses = [
      "I understand your request. How can I assist you further?",
      "That's an interesting question. Let me think about that for you.",
      "I'm here to help with whatever you need. What would you like to know?",
      "Thank you for your input. I'm processing your request now.",
      "I'm your AI assistant, ready to help you with any questions or tasks.",
      "Fascinating! I'd be happy to explore that topic with you.",
      "I see what you're asking. Let me provide you with the best assistance I can.",
      "Your request has been noted. How else can I be of service today?"
    ];
    
    // Simple keyword-based responses
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return "Hello! I'm your AI assistant. It's great to meet you. How can I help you today?";
    }
    
    if (lowerInput.includes('name') || lowerInput.includes('who are you')) {
      return "I am JARVIS, your advanced AI assistant. I'm here to help you with information, tasks, and conversations.";
    }
    
    if (lowerInput.includes('weather')) {
      return "I don't have access to real-time weather data, but I'd recommend checking a weather service for current conditions.";
    }
    
    if (lowerInput.includes('time')) {
      const now = new Date();
      return `The current time is ${now.toLocaleTimeString()}.`;
    }
    
    if (lowerInput.includes('help')) {
      return "I can help you with various tasks including answering questions, providing information, and having conversations. Just speak naturally and I'll do my best to assist!";
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Text-to-Speech function
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings for a more AI-like experience
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      // Try to use a more suitable voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Alex') || 
        voice.name.includes('Daniel') ||
        voice.lang.startsWith('en')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentUtterance(null);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        setCurrentUtterance(null);
        toast({
          title: "Speech Error",
          description: "There was an error with text-to-speech.",
          variant: "destructive"
        });
      };

      setCurrentUtterance(utterance);
      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Speech Not Supported",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Handle voice input from the circle
  const handleVoiceInput = useCallback((text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: (++messageIdRef.current).toString(),
      text: text,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Generate AI response
    const aiResponseText = generateAIResponse(text);
    
    // Add AI message
    const aiMessage: Message = {
      id: (++messageIdRef.current).toString(),
      text: aiResponseText,
      isUser: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMessage]);

    // Speak the AI response
    speak(aiResponseText);

    toast({
      title: "Voice Input Received",
      description: `You said: "${text}"`,
    });
  }, [speak, toast]);

  // Stop speaking if currently speaking
  const stopSpeaking = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentUtterance(null);
    }
  };

  return (
    <div className="min-h-screen bg-tech-gradient tech-grid flex flex-col items-center justify-center p-8">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-tech-dark via-background to-tech-darker opacity-90" />
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-glow-intense mb-4">
            J.A.R.V.I.S
          </h1>
          <p className="text-xl text-muted-foreground">
            Just A Rather Very Intelligent System
          </p>
        </div>

        {/* AI Circle */}
        <div className="mb-12">
          <AICircle
            size={320}
            onVoiceInput={handleVoiceInput}
            isListening={isListening}
            isSpeaking={isSpeaking}
          />
        </div>

        {/* Stop Speaking Button */}
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="mb-8 px-6 py-2 bg-destructive/20 border border-destructive/50 rounded-lg text-destructive hover:bg-destructive/30 transition-colors"
          >
            Stop Speaking
          </button>
        )}

        {/* Conversation History */}
        {messages.length > 0 && (
          <div className="w-full max-w-2xl bg-card/10 backdrop-blur-sm border border-primary/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-glow mb-4">Conversation History</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.isUser
                      ? 'bg-primary/20 border border-primary/30 ml-8'
                      : 'bg-accent/20 border border-accent/30 mr-8'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium ${
                      message.isUser ? 'text-primary' : 'text-accent'
                    }`}>
                      {message.isUser ? 'You' : 'JARVIS'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{message.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Click the circle and speak to interact with JARVIS
          </p>
          <p className="text-xs text-muted-foreground/70">
            Make sure to allow microphone access when prompted
          </p>
        </div>
      </div>
    </div>
  );
};