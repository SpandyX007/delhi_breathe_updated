
import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  FlaskConical,
  Cpu,
  BrainCircuit,
  Scale,
  Settings,
  Menu,
  Bot,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Send
} from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Page, ChatMessage } from './types';
import { Dashboard } from './components/Dashboard';
import { Research } from './components/Research';
import { Features } from './components/Features';
import { Models } from './components/Models';
import { Policy } from './components/Policy';
import { fetchChatResponse } from './services/api'; // UPDATED IMPORT

// Utility for class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false); // New Full Screen State
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  // Chat State with Persistence
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('aero_chat_history');
    return saved ? JSON.parse(saved) : [
      { role: 'model', text: 'Hello! I have context of your current analysis. Ask me anything about the data.' }
    ];
  });

  const [inputMsg, setInputMsg] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [featureProgress, setFeatureProgress] = useState(0); // 0 to 100

  // Feature Engineering State Bridge
  const [pendingFeaturePrompt, setPendingFeaturePrompt] = useState<string | null>(null);

  // Theme Persistence
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Chat Persistence
  useEffect(() => {
    localStorage.setItem('aero_chat_history', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Callback for Features component to send logs to chat
  const handleFeatureLog = useCallback((message: string) => {
    setChatMessages(prev => [...prev, { role: 'model', text: message }]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMsg.trim()) return;
    const userMsg = inputMsg;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputMsg('');
    setIsChatLoading(true);

    // If on Features page, route to Feature Component Logic
    if (currentPage === 'features') {
      setPendingFeaturePrompt(userMsg);
      // We don't call Gemini here immediately; the Features component will handle it 
      setIsChatLoading(false);
      return;
    }

    // Default Chat Logic for other pages
    const context = `User is on page: ${currentPage}. Theme is ${theme}.`;
    try {
      const response = await fetchChatResponse(userMsg, context);
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Error connecting to assistant." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const SidebarItem = ({ page, icon: Icon, label }: { page: Page, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentPage(page)}
      className={cn(
        "flex items-center w-full p-3 mb-1.5 rounded-lg transition-all duration-200",
        "hover:bg-accent/10 hover:text-accent",
        currentPage === page ? "bg-accent/15 text-accent font-semibold shadow-sm" : "text-muted-foreground hover:shadow-sm"
      )}
    >
      <Icon size={20} />
      {isSidebarOpen && <span className="ml-3 text-sm font-medium">{label}</span>}
    </button>
  );

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden">
      {/* Left Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-card shadow-xl z-20 transition-all duration-300",
          isFullScreen ? "w-0 border-none overflow-hidden" : (isSidebarOpen ? "w-64" : "w-16")
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border h-16 bg-gradient-to-r from-card to-secondary/30">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-teal-600 shrink-0 shadow-lg flex items-center justify-center text-white font-bold text-xs">
              AA
            </div>
            {isSidebarOpen && <h1 className="font-bold text-lg tracking-tight truncate bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">AeroAnalytica</h1>}
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
            {isSidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden">
          <SidebarItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem page="research" icon={FlaskConical} label="Research" />
          <SidebarItem page="features" icon={Cpu} label="Features" />
          <SidebarItem page="models" icon={BrainCircuit} label="Models" />
          <SidebarItem page="policy" icon={Scale} label="Policy" />
          <SidebarItem page="settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-border bg-gradient-to-r from-card to-secondary/30">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-full p-2.5 rounded-lg hover:bg-accent/10 hover:text-accent text-muted-foreground transition-all shadow-sm hover:shadow"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {isSidebarOpen && <span className="ml-2 text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background/50 relative flex flex-col">
        <div className="h-full w-full flex-1">
          {currentPage === 'dashboard' && <div className="p-4 sm:p-6 lg:p-8"><Dashboard /></div>}
          {currentPage === 'research' && <div className="p-4 sm:p-6 lg:p-8"><Research /></div>}

          {/* Features takes full height */}
          {currentPage === 'features' && (
            <Features
              pendingPrompt={pendingFeaturePrompt}
              onClearPrompt={() => setPendingFeaturePrompt(null)}
              onLog={handleFeatureLog}
              onProgress={setFeatureProgress}
              isFullScreen={isFullScreen}
              onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
            />
          )}

          {currentPage === 'models' && <div className="p-4 sm:p-6 lg:p-8"><Models /></div>}
          {currentPage === 'policy' && <div className="p-4 sm:p-6 lg:p-8"><Policy /></div>}
          {currentPage === 'settings' && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Settings size={48} className="mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold">Settings</h2>
                <p>Configuration panel coming soon.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar (Chatbot) */}
      <aside
        className={cn(
          "flex flex-col border-l border-border bg-card shadow-xl z-20 transition-all duration-300",
          isFullScreen ? "w-0 border-none overflow-hidden" : (isChatOpen ? "w-80" : "w-12")
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border h-16 bg-gradient-to-r from-card to-secondary/30">
          {isChatOpen && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-teal-600 flex items-center justify-center shadow-sm">
                <Bot size={16} className="text-white" />
              </div>
              <span className="font-semibold text-sm">Gemini Assistant</span>
            </div>
          )}
          <button onClick={() => setIsChatOpen(!isChatOpen)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground ml-auto transition-colors">
            {isChatOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {isChatOpen ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col max-w-[90%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm shadow-md",
                    msg.role === 'user'
                      ? "bg-gradient-to-br from-accent to-teal-600 text-white rounded-tr-none"
                      : "bg-card text-foreground rounded-tl-none border border-border/50"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {/* Progress Bar in Chat */}
              {featureProgress > 0 && featureProgress < 100 && (
                <div className="bg-card p-3 rounded-lg border border-border shadow-md">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span className="font-medium">Building Pipeline...</span>
                    <span className="font-semibold text-accent">{featureProgress}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-accent to-teal-600 h-full transition-all duration-300 shadow-sm"
                      style={{ width: `${featureProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {isChatLoading && featureProgress === 0 && (
                <div className="flex gap-1 p-2">
                  <div className="w-2 h-2 bg-accent/50 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-accent/50 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-accent/50 rounded-full animate-bounce delay-200" />
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border bg-gradient-to-r from-card to-secondary/30">
              <div className="relative">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={currentPage === 'features' ? "Instruct to build features..." : "Ask about the analysis..."}
                  className="w-full bg-card border border-border rounded-full pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-sm transition-shadow focus:shadow-md"
                />
                <button
                  onClick={handleSendMessage}
                  className="absolute right-1.5 top-1.5 p-1.5 bg-gradient-to-br from-accent to-teal-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center font-medium">
                {currentPage === 'features' ? "AI Architect Mode: Builds pipeline from prompt." : "AI has context of current analysis."}
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center pt-4 gap-4">
            <Bot size={20} className="text-muted-foreground" />
            <div className="writing-mode-vertical text-xs text-muted-foreground tracking-widest uppercase rotate-180">
              Assistant
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default App;
