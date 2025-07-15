import React, { useState, useCallback, useRef } from 'react';
import { AICircle } from './AICircle';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/jarvis_ui/textarea';
import { Button } from '@/components/jarvis_ui/button';
import { Send, MessageSquare } from 'lucide-react';

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
  const [textInput, setTextInput] = useState('');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
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

  // Handle message input (voice or text)
  const handleMessageInput = useCallback((text: string) => {
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

    // Set current transcript and speak the AI response
    setCurrentTranscript(aiResponseText);
    speak(aiResponseText);
  }, [speak]);

  // Handle voice input from the circle
  const handleVoiceInput = useCallback((text: string) => {
    handleMessageInput(text);
    toast({
      title: "Voice Input Received",
      description: `You said: "${text}"`,
    });
  }, [handleMessageInput, toast]);

  // Handle text input submission
  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      handleMessageInput(textInput);
      setTextInput('');
    }
  }, [textInput, handleMessageInput]);

  // Handle Enter key in textarea
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  }, [handleTextSubmit]);

  // Stop speaking if currently speaking
  const stopSpeaking = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentTranscript('');
      setCurrentUtterance(null);
    }
  };

  return (
    <div className="min-h-screen bg-tech-gradient tech-grid flex">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-tech-dark via-background to-tech-darker opacity-90" />
      
      {/* Chat Sidebar */}
      <div className={`relative z-10 transition-all duration-300 ${
        showSidebar ? 'w-80' : 'w-0'
      } bg-card/10 backdrop-blur-sm border-r border-primary/20 overflow-hidden`}>
        <div className="h-full flex flex-col p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-glow">Chat History</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </Button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg text-sm ${
                  message.isUser
                    ? 'bg-primary/20 border border-primary/30 ml-4'
                    : 'bg-accent/20 border border-accent/30 mr-4'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-medium ${
                    message.isUser ? 'text-primary' : 'text-accent'
                  }`}>
                    {message.isUser ? 'You' : 'JARVIS'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p>{message.text}</p>
              </div>
            ))}
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="resize-none bg-background/50 border-primary/20"
              rows={3}
            />
            <Button
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className="w-full"
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        {/* Chat Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSidebar(!showSidebar)}
          className="absolute top-4 left-4 bg-card/20 backdrop-blur-sm border-primary/30"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {showSidebar ? 'Hide Chat' : 'Show Chat'}
        </Button>

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
        <div className="mb-8">
          <AICircle
            size={280}
            onVoiceInput={handleVoiceInput}
            isListening={isListening}
            isSpeaking={isSpeaking}
          />
        </div>

        {/* AI Transcript */}
        {isSpeaking && currentTranscript && (
          <div className="mb-6 max-w-2xl bg-accent/10 backdrop-blur-sm border border-accent/20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse mr-2" />
              <span className="text-sm font-medium text-accent">JARVIS is speaking...</span>
            </div>
            <p className="text-sm text-muted-foreground italic">"{currentTranscript}"</p>
          </div>
        )}

        {/* Stop Speaking Button */}
        {isSpeaking && (
          <Button
            onClick={stopSpeaking}
            variant="destructive"
            size="sm"
            className="mb-6"
          >
            Stop Speaking
          </Button>
        )}

        {/* Instructions */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Click the circle and speak to interact with JARVIS
          </p>
          <p className="text-xs text-muted-foreground/70">
            Use the chat sidebar to type messages or view conversation history
          </p>
        </div>
      </div>
    </div>
  );
};