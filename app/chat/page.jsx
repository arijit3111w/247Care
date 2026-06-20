"use client";

import { useState, useEffect } from 'react';
import ChatBot from '@/components/chatbot';
import { loadSessions, createSession } from '@/lib/chatStorage';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, ChevronRight, Activity, Pill, HeartPulse, Stethoscope, Menu, X } from 'lucide-react';
import { GsapReveal } from '@/components/gsap-reveal';
import Link from 'next/link';

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(undefined);
  const [faqTrigger, setFaqTrigger] = useState(null);
  const [faqTriggerCounter, setFaqTriggerCounter] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const refreshSessions = () => {
    setSessions(loadSessions().sort((a,b)=> b.createdAt - a.createdAt));
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  const handleNewChat = () => {
    const newSession = createSession();
    refreshSessions();
    setSelectedSessionId(newSession.id);
  };

  const handleSelectSession = (id) => {
    setSelectedSessionId(id);
  };

  const handleFaqClick = (text) => {
    setFaqTrigger({ id: Date.now() + faqTriggerCounter, text });
    setFaqTriggerCounter(c => c + 1);
    if (!selectedSessionId) {
      const s = createSession();
      refreshSessions();
      setSelectedSessionId(s.id);
    }
  };

  const handleSessionCreated = (id) => {
    refreshSessions();
    setSelectedSessionId(id);
  };

  const handleMessagesUpdated = () => {
    refreshSessions();
  };

  const renderSidebarContent = () => (
    <>
      <GsapReveal delay={0.1}>
        <Button 
          variant="outline" 
          onClick={() => { handleNewChat(); setIsSidebarOpen(false); }}
          className="w-full justify-start border-[#222] bg-[#080808] text-white hover:bg-[#111] hover:text-emerald-400 hover:border-emerald-500/20 rounded-2xl h-12 px-4 text-[13px] font-medium transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2.5 opacity-60" /> New Chat
        </Button>
      </GsapReveal>

      <GsapReveal delay={0.15} className="flex-1 overflow-hidden flex flex-col">
        <h3 className="text-[10px] uppercase tracking-widest text-[#444] font-semibold mb-3 px-1">Recent Chats</h3>
        <ScrollArea className="flex-1 pr-2 custom-scrollbar">
          {sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageSquare className="h-5 w-5 text-[#1a1a1a] mb-2" />
              <p className="text-[11px] text-[#444] font-medium">No recent chats</p>
            </div>
          )}
          <ul className="space-y-1.5">
            {sessions.map(s => {
              const displayTitle = s.title || s.messages[0]?.content?.slice(0,35) || 'New Conversation';
              const timeStr = (() => {
                const ms = Date.now() - s.createdAt;
                const mins = Math.floor(ms / 60000);
                if (mins < 60) return `${mins} min ago`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs} hour${hrs>1?'s':''} ago`;
                return `${Math.floor(hrs/24)} day${Math.floor(hrs/24)>1?'s':''} ago`;
              })();
              const isActive = s.id === selectedSessionId;
              
              return (
                <li key={s.id}>
                  <button
                    onClick={() => { handleSelectSession(s.id); setIsSidebarOpen(false); }}
                    className={`w-full flex items-start gap-2.5 px-3 py-3 rounded-xl transition-all duration-200 text-left ${
                      isActive 
                        ? 'bg-emerald-500/8 border border-emerald-500/15' 
                        : 'bg-transparent border border-transparent hover:bg-[#0a0a0a]'
                    }`}
                  >
                    <MessageSquare className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-[#333]'}`} />
                    <div className="flex-1 min-w-0">
                      <span className={`block font-medium truncate text-[12px] mb-0.5 ${isActive ? 'text-emerald-100' : 'text-[#aaa]'}`}>
                        {displayTitle}
                      </span>
                      <span className="block text-[10px] text-[#444]">
                        {timeStr}
                      </span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </GsapReveal>

      {/* Doctor CTA at bottom of Left Sidebar */}
      <GsapReveal delay={0.25} className="mt-auto pt-4">
        <div className="bg-[#050505] rounded-2xl border border-[#141414] p-5">
          <h3 className="text-[12px] text-white font-semibold mb-1.5">Need Human Help?</h3>
          <p className="text-[11px] text-[#555] leading-relaxed mb-4">
            Chat with our verified doctors for personalized advice.
          </p>
          <Button asChild className="w-full bg-[#080808] text-[#ccc] border border-[#1a1a1a] hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 h-10 rounded-xl transition-all duration-200 text-[12px]">
            <Link href="/doctors">
              <Stethoscope className="w-3.5 h-3.5 mr-2" /> Talk to a Doctor
            </Link>
          </Button>
        </div>
      </GsapReveal>
    </>
  );

  return (
    <div className="w-full h-screen pt-[72px] pb-2 md:pt-[80px] md:pb-4 flex gap-5 px-2 md:px-4 overflow-hidden">
      
      {/* MOBILE SIDEBAR OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[60] flex lg:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsSidebarOpen(false)} 
          />
          <div className="relative w-[280px] h-full bg-[#050505] border-r border-[#141414] p-4 flex flex-col gap-4 animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-white">Chat History</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-[#aaa] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <div className="hidden lg:flex w-[240px] xl:w-[280px] shrink-0 h-full flex-col gap-4">
        {renderSidebarContent()}
      </div>

      {/* MIDDLE CHAT */}
      <div className="flex-1 h-full flex flex-col bg-[#050505] rounded-2xl lg:rounded-3xl border border-[#141414] shadow-2xl overflow-hidden relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#141414] bg-[#050505] z-30 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-[#aaa] hover:text-white transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-[13px] font-medium text-[#eee]">AI Chat</span>
          <button onClick={() => { handleNewChat(); setIsSidebarOpen(false); }} className="text-[#aaa] hover:text-white transition-colors">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 relative min-h-0">
          <ChatBot
            sessionId={selectedSessionId}
            onSessionCreated={handleSessionCreated}
            onMessagesUpdated={handleMessagesUpdated}
            quickTrigger={faqTrigger}
          />
        </div>
      </div>

    </div>
  );
}
