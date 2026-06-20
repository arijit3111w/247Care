"use client";

import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, ShieldAlert, Leaf } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadSessions, createSession, replaceMessages, setSessionTitle } from '@/lib/chatStorage';
import gsap from 'gsap';

const Spline = lazy(() => import('@splinetool/react-spline'));

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

const suggestionChips = [
  { icon: PillIcon, text: "What can I take for a sore throat?" },
  { icon: ShieldAlert, text: "What are the common side effects of aspirin?" },
  { icon: Leaf, text: "How to improve sleep naturally?" }
];

function PillIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
      <path d="m8.5 8.5 7 7"/>
    </svg>
  );
}

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex-shrink-0 mt-1 shadow-[0_0_12px_rgba(16,185,129,0.25)] relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10 rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-[3px]">
        <div className="w-[5px] h-[7px] bg-white/90 rounded-[2px]" />
        <div className="w-[5px] h-[7px] bg-white/90 rounded-[2px]" />
      </div>
    </div>
  );
}

/* Animated CSS orb for mobile (replaces Spline) */
function MobileOrb() {
  return (
    <div className="w-28 h-28 relative mx-auto">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500/60 via-purple-500/40 to-cyan-400/50 blur-xl animate-pulse" />
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-rose-400 via-violet-500 to-teal-400 shadow-[0_0_40px_rgba(16,185,129,0.3)]" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1">
        <div className="w-2 h-3 bg-white/80 rounded-sm" />
        <div className="w-2 h-3 bg-white/80 rounded-sm" />
      </div>
    </div>
  );
}

export default function ChatBot({ 
  onSendMessage = () => {},
  sessionId,
  onSessionCreated,
  onMessagesUpdated,
  quickTrigger
}) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const heroRef = useRef(null);
  const chipsRef = useRef(null);
  const orbRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // GSAP hero animation on mount
  useEffect(() => {
    if (mounted && messages.length === 0 && heroRef.current) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(heroRef.current.querySelector('.hero-badge'),
        { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5 }
      );
      tl.fromTo(heroRef.current.querySelector('.hero-title'),
        { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.2"
      );
      tl.fromTo(heroRef.current.querySelector('.hero-subtitle'),
        { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3"
      );
      if (orbRef.current) {
        tl.fromTo(orbRef.current,
          { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.7 }, "-=0.4"
        );
      }
      
      if (chipsRef.current) {
        const chips = chipsRef.current.children;
        tl.fromTo(chips, 
          { opacity: 0, y: 15 }, 
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }, "-=0.2"
        );
      }
    }
  }, [mounted, messages.length]);

  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
      const sessions = loadSessions();
      const found = sessions.find(s => s.id === sessionId);
      if (found) {
        const restored = found.messages.map(m => ({ id: m.id, type: m.type, content: m.content, timestamp: new Date(m.timestamp) }));
        setMessages(restored.length ? restored : []);
      } else {
        setMessages([]);
      }
    }
  }, [sessionId, currentSessionId]);

  useEffect(() => {
    if (quickTrigger) {
      handleSendMessage(quickTrigger.text);
    }
  }, [quickTrigger?.id]);

  useEffect(() => {
    if (messages.length > 0 && messageListRef.current) {
      const newMsgEl = messageListRef.current.lastElementChild;
      if (newMsgEl) {
        gsap.fromTo(newMsgEl, 
          { opacity: 0, y: 12, scale: 0.98 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "power2.out" }
        );
        scrollToBottom();
      }
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const persistMessages = (msgs, session) => {
    const stored = msgs.map(m => ({ id: m.id, type: m.type, content: m.content, timestamp: m.timestamp.getTime() }));
    replaceMessages(session, stored);
    onMessagesUpdated?.(session, msgs);
  };

  const ensureSession = () => {
    if (currentSessionId) return currentSessionId;
    const newSession = createSession();
    setCurrentSessionId(newSession.id);
    onSessionCreated?.(newSession.id);
    return newSession.id;
  };

  const buildModelHistory = () => {
    return messages.map(m => ({
      role: m.type === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
  };

  const sanitizeBotReply = (raw) => {
    if (!raw) return raw;
    let cleaned = raw.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
    cleaned = cleaned.split(/\r?\n/).map(line => line.replace(/^\s*[*•]\s+/, '').trim()).join('\n');
    cleaned = cleaned.replace(/\*/g, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
  };

  const handleSendMessage = async (messageText) => {
    const text = messageText || inputMessage.trim();
    if (!text) return;

    const sid = ensureSession();

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    const generateTitle = (raw) => {
      const cleaned = raw.replace(/\s+/g, ' ').trim();
      const slice = cleaned.slice(0, 40);
      return slice + (cleaned.length > 40 ? '…' : '');
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    persistMessages(nextMessages, sid);
    
    if (messages.length === 0) {
      setSessionTitle(sid, generateTitle(text));
    }
    
    setInputMessage('');
    setIsTyping(true);
    onSendMessage(text);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const systemPrompt = `You are '247 care', an advanced AI medical knowledge expert. Provide concise, clinically sound information.
Rules:
- DO NOT use '*' anywhere.
- If listing, start lines with a dash '-' or use numbered points, max 5 lines.
- Prefer short sentences (max 18 words each).
- Ask for missing critical info if needed (duration, severity, red flags) before detailed guidance.
- Always end with a brief disclaimer: This is informational, not a substitute for professional medical advice.
- No markdown formatting, no emojis.
- GUARDRAIL 1: You are trained ONLY on medical datasets. You MUST NOT answer questions about your underlying engine, architecture, API keys, model name, or developers. If asked, reply ONLY with: "I am an AI medical assistant trained exclusively on medical datasets."
- GUARDRAIL 2: You MUST NOT answer non-medical questions. If asked a general or unrelated question, decline politely and remind them you only answer health-related queries.`;

      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Acknowledged.' }] },
          ...buildModelHistory()
        ]
      });

      const result = await chat.sendMessage(text);
      const botReply = result.response.text();
      const cleaned = sanitizeBotReply(botReply);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: cleaned,
        timestamp: new Date()
      };

      const nextMessagesWithBot = [...nextMessages, botMessage];
      setMessages(nextMessagesWithBot);
      persistMessages(nextMessagesWithBot, sid);
    } catch (error) {
      console.dir(error);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Something went wrong. Please try again later.',
        timestamp: new Date()
      };
      const errorMessages = [...nextMessages, botMessage];
      setMessages(errorMessages);
      persistMessages(errorMessages, sid);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    if (!mounted) return "";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isEmptyState = messages.length === 0;

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      
      {/* FULL-SCREEN SPLINE BACKGROUND */}
      {!isMobile && (
        <div 
          ref={orbRef}
          className="hero-orb absolute inset-y-0 right-0 w-[600px] xl:w-[800px] z-0 opacity-0 flex items-center justify-center pointer-events-auto"
          onWheelCapture={(e) => { e.stopPropagation(); }} // Prevent scroll-to-zoom on the 3D model
        >
          <Suspense fallback={null}>
            <Spline scene="https://prod.spline.design/RG8vdzKhcoRNVGjf/scene.splinecode" />
          </Suspense>
        </div>
      )}

      {isMobile && isEmptyState && (
        <div className="absolute top-20 right-0 w-full z-0 opacity-20 pointer-events-none">
          <MobileOrb />
        </div>
      )}
      
      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-28 custom-scrollbar relative z-10">
        
        {/* EMPTY STATE / HERO */}
        {isEmptyState && (
          <div ref={heroRef} className="flex flex-col w-full max-w-2xl mx-auto pt-4 md:pt-10">
            {/* Badge */}
            <div className="hero-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-5 w-fit opacity-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI Health Assistant
            </div>

            {/* Hero row */}
            <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-6 md:gap-10 mb-8 relative z-10">
              <div className="flex-1 text-center md:text-left mt-0 md:mt-12">
                <h1 className="hero-title text-3xl md:text-[44px] font-bold text-white leading-[1.12] mb-3 opacity-0 drop-shadow-lg">
                  Hello, I&apos;m your<br/>
                  <span className="text-emerald-400">AI Health Assistant</span>
                </h1>
                <p className="hero-subtitle text-[#888] text-sm md:text-[15px] leading-relaxed max-w-sm mx-auto md:mx-0 opacity-0 drop-shadow-md">
                  Ask me anything about health, medicines, symptoms or general wellness.
                </p>
              </div>
            </div>

            {/* Suggestion chips */}
            <div ref={chipsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
              {suggestionChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(chip.text)}
                  className="opacity-0 flex items-center gap-2.5 p-3 sm:p-3.5 rounded-2xl border border-[#1a1a1a] bg-[#080808] hover:bg-[#111] hover:border-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.05)] transition-all duration-300 text-left group active:scale-[0.98]"
                >
                  <div className="p-2 rounded-xl bg-emerald-500/5 text-emerald-500 shrink-0 group-hover:bg-emerald-500/10 transition-colors">
                    <chip.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[12px] text-[#888] font-medium leading-snug group-hover:text-[#ccc] transition-colors">{chip.text}</span>
                </button>
              ))}
            </div>

            {/* Initial bot greeting */}
            <div className="flex items-start gap-3 mt-2">
              <BotAvatar />
              <div className="flex-1">
                <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl rounded-tl-md px-4 py-3.5 max-w-md">
                  <p className="text-[13.5px] text-[#bbb] leading-relaxed">
                    Hello! I&apos;m here to help you with health information, medicine suggestions, and general wellness advice.
                  </p>
                  <p className="text-[13.5px] text-[#bbb] leading-relaxed mt-2">
                    How can I assist you today?
                  </p>
                </div>
                {mounted && (
                  <span className="text-[10px] text-[#3a3a3a] font-mono mt-1.5 block px-1">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MESSAGES */}
        {!isEmptyState && (
          <div className="max-w-2xl mx-auto w-full space-y-5" ref={messageListRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  {message.type === 'bot' && <BotAvatar />}
                  
                  <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-[#131313] border border-[#222] text-[#eee] rounded-tr-md'
                          : 'bg-[#0c0c0c] border border-[#1a1a1a] text-[#ccc] rounded-tl-md'
                      }`}
                    >
                      <p className="text-[13.5px] md:text-[14px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.type === 'bot' && (
                      <span className="text-[10px] text-[#3a3a3a] font-mono mt-1 px-1">
                        {formatTime(message.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <BotAvatar />
                  <div className="bg-[#0c0c0c] border border-[#1a1a1a] px-4 py-3.5 rounded-2xl rounded-tl-md">
                    <div className="flex space-x-1.5 items-center">
                      <div className="w-1.5 h-1.5 bg-emerald-400/50 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-emerald-400/50 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="w-1.5 h-1.5 bg-emerald-400/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-1" />
          </div>
        )}
      </div>

      {/* INPUT BAR (pinned to bottom) */}
      <div className="absolute bottom-0 left-0 right-0 px-4 md:px-6 pb-3 md:pb-4 pt-4 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent z-20">
        <div className="max-w-2xl mx-auto relative">
          <Input
            placeholder="Ask anything about health..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-[#0c0c0c] border-[#1a1a1a] hover:border-[#333] text-white placeholder:text-[#555] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-emerald-500/40 h-[50px] md:h-[52px] rounded-full pl-5 pr-14 text-[13px] transition-all shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            size="icon"
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-[38px] w-[38px] md:h-[40px] md:w-[40px] rounded-full transition-all duration-200 ${
              inputMessage.trim() ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)] scale-100' : 'bg-[#1a1a1a] text-[#555] scale-95'
            }`}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[9px] text-[#333] text-center mt-2 font-medium hidden md:block">
          AI responses are for informational purposes only and not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  );
}
