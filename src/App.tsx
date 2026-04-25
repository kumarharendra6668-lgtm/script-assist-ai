import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './hooks/use-theme';
import { generateScript, GeneratedScript } from './lib/gemini';
import { useAuth } from './components/AuthProvider';
import Login from './components/Login';
import { auth } from './lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  ChevronRight, 
  Copy, 
  RefreshCcw, 
  Sparkles, 
  Moon, 
  Sun, 
  Check, 
  Edit3,
  Flame,
  Wand2,
  BookOpen,
  User,
  LogOut,
  Save,
  Trash2,
  Menu,
  X,
  History,
  ChevronLeft,
  CreditCard
} from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { db } from './lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import Pricing from './components/Pricing';
import Logo from './components/Logo';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { user, profile } = useAuth();

  // State for form
  const [step, setStep] = useState(1);

  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('');
  const [tone, setTone] = useState('');
  const [language, setLanguage] = useState('');
  
  // Advanced features
  const [humanMode, setHumanMode] = useState(true);
  const [storyMode, setStoryMode] = useState(false);
  const [hooksMode, setHooksMode] = useState(true);

  // Drafts system
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const DRAFT_LIMIT = 20;

  // Output
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [output, setOutput] = useState<GeneratedScript | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Temp state for topic input
  const [topicInput, setTopicInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);

  const EXAMPLE_PROMPTS = [
    "A 5-minute morning routine for high performers",
    "How to build a SaaS in 30 days as a solo dev",
    "Emotional storytelling about a lost dog finding home",
    "Funny dating advice for Gen Z in 2024"
  ];

  const adjustHeight = (ref: React.RefObject<HTMLTextAreaElement>, maxHeight: number) => {
    const textarea = ref.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    adjustHeight(textareaRef, 250);
  }, [topicInput, step]);

  useEffect(() => {
    if (output) {
      adjustHeight(outputTextareaRef, 200);
    }
  }, [output, topicInput]);
  
  // Scroll ref
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [step, output, isGenerating]);

  useEffect(() => {
    if (!user) return;
    
    const draftsRef = collection(db, 'users', user.uid, 'drafts');
    const q = query(draftsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const draftsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDrafts(draftsList);
    });
    
    return () => unsubscribe();
  }, [user]);

  const handleTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topicInput.trim()) {
      setTopic(topicInput);
      setStep(2);
    }
  };

  const handlePlatformSelect = (p: string) => {
    setPlatform(p);
    setStep(3);
  };

  const handleToneSelect = (t: string) => {
    setTone(t);
    setStep(4);
  };

  const handleLanguageSelect = (l: string) => {
    setLanguage(l);
    setStep(5);
  };

  const handleReset = () => {
    setStep(1);
    setTopic('');
    setTopicInput('');
    setPlatform('');
    setTone('');
    setLanguage('');
    setOutput(null);
    setActiveDraftId(null);
    setIsSidebarOpen(false);
  };

  const startGeneration = async () => {
    // Sync topic before generation to ensure edits are captured
    setTopic(topicInput);
    setIsGenerating(true);
    setOutput(null);
    
    // Animate loading text
    const loadingTexts = ["Cooking your script... 🔥", "Making it sound human...", "This is gonna be good... 😎", "Adding some magic... ✨", "Almost there..."];
    let i = 0;
    setLoadingText(loadingTexts[i]);
    const interval = setInterval(() => {
      i = (i + 1) % loadingTexts.length;
      setLoadingText(loadingTexts[i]);
    }, 2000);

    try {
      const result = await generateScript({
        topic: topicInput, // Use topicInput directly
        platform,
        tone,
        language,
        isHumanMode: humanMode,
        isStoryMode: storyMode,
        needsHooks: hooksMode
      });
      setOutput(result);
      setStep(6);
    } catch (e) {
      console.error(e);
      alert("Oops! Something went wrong. Let's try again.");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  const handleSaveDraft = async () => {
    if (!user || !output) return;
    
    if (drafts.length >= DRAFT_LIMIT) {
      alert(`You’ve reached your draft limit (${DRAFT_LIMIT}). Delete old drafts to save new ones.`);
      return;
    }
    
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const draftsRef = collection(db, 'users', user.uid, 'drafts');
      await addDoc(draftsRef, {
        topic,
        platform,
        tone,
        language,
        script: output.script,
        hooks: output.hooks || [],
        createdAt: serverTimestamp()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error("Error saving draft:", e);
      alert("Failed to save draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDraft = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    
    // Optimistic UI: we don't strictly need to wait for Firestore to update the local state 
    // because onSnapshot will handle it, but let's make sure it's clean.
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'drafts', id));
      
      // If we are currently viewing the draft we just deleted, clear the screen
      if (activeDraftId === id) {
        handleReset();
      }
    } catch (err) {
      console.error("Error deleting draft:", err);
      alert("Failed to delete draft.");
    }
  };

  const handleLoadDraft = (draft: any) => {
    setTopic(draft.topic);
    setTopicInput(draft.topic);
    setPlatform(draft.platform);
    setTone(draft.tone);
    setLanguage(draft.language);
    setOutput({
      script: draft.script,
      hooks: draft.hooks
    });
    setStep(6);
    setActiveDraftId(draft.id);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  if (!user) {
    return <Login />;
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center transition-colors duration-300 bg-[#fcfcfc] dark:bg-slate-950 text-slate-900 dark:text-slate-100",
      showBanner && "pt-10"
    )}>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 px-4 shadow-lg flex items-center justify-center h-10"
          >
            <div className="max-w-7xl mx-auto flex items-center gap-3 pr-8 relative w-full justify-center">
              <p className="text-[12px] sm:text-xs font-bold tracking-wide text-center uppercase">
                🔥 Limited-Time Offer: 30 Days Free Trial
              </p>
              <button
                onClick={() => setShowBanner(false)}
                className="absolute right-0 p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Dismiss banner"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 bottom-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-50 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none",
        isSidebarOpen ? "w-80 translate-x-0" : "w-0 lg:w-20 -translate-x-full lg:translate-x-0",
        showBanner ? "top-10" : "top-0"
      )}>
        <div className={cn(
          "flex flex-col h-full overflow-hidden transition-opacity duration-200",
          !isSidebarOpen && "lg:items-center"
        )}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between min-h-[81px]">
            {isSidebarOpen ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <History size={18} />
                  </div>
                  <h2 className="font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">Drafts 📝</h2>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                >
                  <ChevronLeft size={20} />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="hidden lg:flex p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 mx-auto"
              >
                <ChevronRight size={20} />
              </button>
            )}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* New Script Button */}
          <div className="p-4">
            <button 
              onClick={handleReset}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border",
                isSidebarOpen 
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 border-transparent shadow-md" 
                  : "w-10 h-10 p-0 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 border-slate-100 dark:border-slate-700 mx-auto"
              )}
              title="New Script"
            >
              <Wand2 size={isSidebarOpen ? 16 : 20} />
              {isSidebarOpen && <span>+ New Script</span>}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 space-y-2 py-2">
            {drafts.length === 0 ? (
              isSidebarOpen && (
                <div className="text-center py-12 px-4">
                  <p className="text-sm font-medium text-slate-400">No drafts yet.</p>
                </div>
              )
            ) : (
              drafts.map((draft) => (
                <div 
                  key={draft.id}
                  onClick={() => handleLoadDraft(draft)}
                  className={cn(
                    "group relative p-3 rounded-xl border transition-all cursor-pointer",
                    activeDraftId === draft.id 
                      ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800" 
                      : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60",
                    !isSidebarOpen && "flex justify-center p-2"
                  )}
                >
                  {isSidebarOpen ? (
                    <>
                      <div className="flex justify-between items-center w-full">
                        <h3 className={cn(
                          "text-sm font-medium truncate pr-2",
                          activeDraftId === draft.id ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-700 dark:text-slate-300"
                        )}>
                          {(() => {
                            const words = draft.topic.trim().split(/\s+/);
                            if (words.length > 5) {
                              return words.slice(0, 4).join(' ') + '...';
                            }
                            return draft.topic;
                          })()}
                        </h3>
                        <button 
                          onClick={(e) => handleDeleteDraft(e, draft.id)}
                          className="flex-shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg lg:opacity-0 lg:group-hover:opacity-100 transition-all z-10"
                          title="Delete Draft"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase overflow-hidden">
                      {draft.topic.substring(0, 2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {isSidebarOpen && (
            <div className="p-4 border-t border-slate-50 dark:border-slate-800">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                <span>Usage</span>
                <span>{drafts.length}/{DRAFT_LIMIT}</span>
              </div>
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    drafts.length >= DRAFT_LIMIT ? "bg-red-500" : "bg-indigo-600"
                  )}
                  style={{ width: `${(drafts.length / DRAFT_LIMIT) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className={cn(
        "w-full flex flex-col items-center transition-all duration-300",
        isSidebarOpen ? "lg:pl-80" : "lg:pl-20"
      )}>
        {/* Header */}
        <header className={cn(
          "w-full px-6 md:px-10 py-6 flex justify-between items-center z-30 border-b border-slate-100 dark:border-slate-800/50 sticky bg-[#fcfcfc]/80 dark:bg-slate-950/80 backdrop-blur-md transition-all",
          showBanner ? "top-10" : "top-0"
        )}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <Logo />
          </div>
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => setShowPricing(true)}
            className="hidden lg:flex items-center justify-center text-xs font-bold px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            Upgrade
          </button>
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-full border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => theme !== 'light' && toggleTheme()}
              className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-colors", theme === 'light' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-300")}
            >
              Light
            </button>
            <button 
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-colors", theme === 'dark' ? "bg-slate-800 shadow-sm text-slate-100" : "text-slate-500 hover:text-slate-700")}
            >
              Dark
            </button>
          </div>
          <button 
            className="sm:hidden p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => signOut(auth)}
            className="p-2 rounded-full text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Hero */}
      {step === 1 && !output && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-2xl px-6 py-12 md:py-16 text-center space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white">
            Create Scripts That Feel <span className="text-indigo-600 block sm:inline">Human, Not AI.</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
            Write emotional, engaging, and viral scripts in seconds.
          </p>
        </motion.div>
      )}

      {/* Main Workspace */}
      <main className={cn(
        "flex-1 w-full max-w-7xl mx-auto px-4 sm:px-10 pb-32 transition-all duration-700 ease-in-out",
        output ? "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4" : "flex flex-col max-w-2xl mt-8"
      )}>
        {/* Left: Input Flow */}
        <section className={cn(
          "flex flex-col gap-6",
          output ? "col-span-1 lg:col-span-5" : "w-full"
        )}>
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-8 flex flex-col justify-center">
            {/* Step 1: Topic */}
            <ChatBubble 
              isAi 
              text="Hey! What do you want your script about?" 
              visible={step >= 1} 
              stepNumber={1}
            />
            <AnimatePresence mode="popLayout">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <form onSubmit={handleTopicSubmit} className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl p-2 border border-slate-100 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 transition-all">
                    <textarea
                      ref={textareaRef}
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleTopicSubmit(e as any);
                        }
                      }}
                      placeholder="A 5-minute morning routine..."
                      className="flex-1 px-3 py-2 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-200 placeholder-slate-400 resize-none min-h-[44px] max-h-[250px] overflow-y-auto transition-[height] duration-200"
                      autoFocus
                      rows={1}
                    />
                    <button 
                      type="submit"
                      disabled={!topicInput.trim()}
                      className="w-11 h-11 flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors shadow-sm mb-0.5"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </form>

                  <AnimatePresence>
                    {topicInput.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-4 flex flex-wrap gap-2"
                      >
                        {EXAMPLE_PROMPTS.map((ex, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setTopicInput(ex);
                              textareaRef.current?.focus();
                            }}
                            className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-500 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
                          >
                            {ex}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
            {step > 1 && (
              <ChatBubble isAi={false} text={topic} visible={true} onEdit={() => setStep(1)} />
            )}

            {/* Step 2: Platform */}
            <ChatBubble 
              isAi 
              text="Nice 👍 Which platform?" 
              visible={step >= 2} 
              stepNumber={2}
            />
            <AnimatePresence mode="popLayout">
              {step === 2 && (
                <OptionsSelector 
                  options={['YouTube', 'Shorts', 'Reels']} 
                  onSelect={handlePlatformSelect} 
                />
              )}
            </AnimatePresence>
            {step > 2 && (
              <ChatBubble isAi={false} text={platform} visible={true} onEdit={() => setStep(2)} />
            )}

            {/* Step 3: Tone */}
            <ChatBubble 
              isAi 
              text="Cool! What tone?" 
              visible={step >= 3} 
              stepNumber={3}
            />
            <AnimatePresence mode="popLayout">
              {step === 3 && (
                <OptionsSelector 
                  options={['Funny', 'Emotional', 'Storytelling', 'Motivational', 'Shayari ✍️']} 
                  onSelect={handleToneSelect} 
                />
              )}
            </AnimatePresence>
            {step > 3 && (
              <ChatBubble isAi={false} text={tone} visible={true} onEdit={() => setStep(3)} />
            )}

            {/* Step 4: Language */}
            <ChatBubble 
              isAi 
              text="By the way... which language do you want? 👀" 
              visible={step >= 4} 
              stepNumber={4}
            />
            <AnimatePresence mode="popLayout">
              {step === 4 && (
                <OptionsSelector 
                  options={['English', 'Hindi', 'Hinglish', 'Bengali', 'Spanish']} 
                  onSelect={handleLanguageSelect} 
                />
              )}
            </AnimatePresence>
            {step > 4 && (
              <ChatBubble isAi={false} text={language} visible={true} onEdit={() => setStep(4)} />
            )}

            {/* Step 5: Advanced Options & Generate */}
            <AnimatePresence mode="popLayout">
              {step === 5 && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 w-full mt-4"
                >
                  <div className="space-y-3">
                    <ToggleConfig 
                      title="Human Mode" 
                      description="Makes the script raw, real, and emotional." 
                      icon={User}
                      color="text-indigo-500"
                      enabled={humanMode} 
                      onToggle={() => setHumanMode(!humanMode)} 
                    />
                    <ToggleConfig 
                      title="Story Mode" 
                      description="Adds storytelling and a real-life feel." 
                      icon={BookOpen}
                      color="text-indigo-500"
                      enabled={storyMode} 
                      onToggle={() => setStoryMode(!storyMode)} 
                    />
                    <ToggleConfig 
                      title="Viral Hook Generator" 
                      description="Generate 3-5 catchy hooks to grab attention." 
                      icon={Flame}
                      color="text-orange-500"
                      enabled={hooksMode} 
                      onToggle={() => setHooksMode(!hooksMode)} 
                    />
                  </div>

                  <button 
                    onClick={startGeneration}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    Let's create something awesome 🚀
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Loading State */}
          <AnimatePresence mode="popLayout">
            {isGenerating && (
              <LoadingProgress texts={["Starting up engines... 🚀", "Gathering ideas... 💡", "Writing the hook... 🔥", "Adding human touch... 💭", "Polishing script... ✨", "Almost ready..."]} />
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </section>

        {/* Right: Output (Step 6) */}
        {output && (
          <section className="col-span-1 lg:col-span-7 flex flex-col gap-6 w-full">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-4"
            >
              {/* Editable Prompt Area */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Edit3 size={12} />
                  <span>Your Prompt</span>
                </div>
                <div className="relative">
                  <textarea
                    ref={outputTextareaRef}
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-300 border-none focus:ring-1 focus:ring-indigo-500/50 resize-none min-h-[44px] max-h-[200px] overflow-y-auto transition-[height] duration-200"
                    placeholder="Enter your prompt here..."
                    rows={1}
                  />
                </div>
              </div>

              {/* Output Container */}
              <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
                <div className="p-4 sm:p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Output Script</span>
                  <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <button 
                      onClick={handleReset}
                      className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold"
                    >
                      Start Over
                    </button>
                    <div className="flex gap-2">
                       <button 
                        onClick={startGeneration}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Regenerate
                      </button>
                      <button 
                        onClick={() => handleCopy(output.script)}
                        className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                      >
                        Copy Script
                      </button>
                      <button 
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
                          saveSuccess 
                            ? "bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        )}
                      >
                        {saveSuccess ? (
                          <><Check size={14} /> Saved!</>
                        ) : (
                          <><Save size={14} /> {isSaving ? 'Saving...' : 'Save Draft'}</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 sm:p-8 flex-1 overflow-y-auto font-serif text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                  <div className="markdown-body prose prose-slate dark:prose-invert prose-indigo max-w-none prose-p:font-serif prose-headings:font-sans">
                    <Markdown>{output.script}</Markdown>
                  </div>
                </div>

                {output.hooks && output.hooks.length > 0 && (
                  <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Flame size={14} className="text-orange-500" /> Viral Hook Ideas
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {output.hooks.map((hook, i) => (
                        <div key={i} className="group relative p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm italic pr-10 shadow-sm hover:border-indigo-200 transition-colors text-slate-600 dark:text-slate-300">
                          "{hook}"
                          <button 
                            onClick={() => handleCopy(hook)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy hook"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </section>
        )}
      </main>
      <AnimatePresence>
        {showPricing && (
          <Pricing 
            onClose={() => setShowPricing(false)} 
            currentPlan={profile?.plan || 'Basic'} 
          />
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[45] bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 p-4">
        <div className="flex justify-center items-center">
          <button 
            onClick={() => setShowPricing(true)}
            className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors tracking-tight"
          >
            Plans & Pricing
          </button>
        </div>
      </div>
    </div>
  </div>
  );
}

// Subcomponents

function LoadingProgress({ texts }: { texts: string[] }) {
  const [progress, setProgress] = useState(0);
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    // animate progress slowly up to 90%, then stall until done
    const duration = 5000; // 5 seconds expected
    const interval = 50;
    const steps = duration / interval;
    const increment = 90 / steps;

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90;
        return p + increment;
      });
    }, interval);

    const txtTimer = setInterval(() => {
      setTextIndex((i) => (i + 1) % texts.length);
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(txtTimer);
    };
  }, [texts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full flex items-center justify-center p-4 sm:p-8"
    >
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm text-center space-y-6">
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90 animate-[spin_10s_linear_infinite]">
            <circle 
              className="text-slate-100 dark:text-slate-800" 
              strokeWidth="4" 
              stroke="currentColor" 
              fill="transparent" 
              r="30" 
              cx="32" 
              cy="32" 
            />
            <circle 
              className="text-indigo-600 transition-all duration-300 ease-out" 
              strokeWidth="4" 
              strokeDasharray={188.5} 
              strokeDashoffset={188.5 - (188.5 * progress) / 100}
              strokeLinecap="round" 
              stroke="currentColor" 
              fill="transparent" 
              r="30" 
              cx="32" 
              cy="32" 
            />
          </svg>
          <Sparkles className="text-indigo-600 absolute animate-pulse" size={24} />
        </div>
        
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={textIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-lg font-bold text-indigo-600 mb-4 truncate h-7"
            >
              {texts[textIndex]}
            </motion.div>
          </AnimatePresence>
          
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.1 }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
            {Math.round(progress)}% Complete
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ChatBubble({ isAi, text, visible, onEdit, stepNumber }: { isAi: boolean, text: string, visible: boolean, onEdit?: () => void, stepNumber?: number }) {

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10, originX: isAi ? 0 : 1 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex w-full justify-start"
        >
          {isAi ? (
            <p className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2 text-sm sm:text-base">
              {text} 
              {stepNumber && <span className="text-xs text-indigo-400 dark:text-indigo-500 ml-1 uppercase tracking-widest hidden sm:inline">Step {stepNumber}</span>}
            </p>
          ) : (
            <div className="relative group px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm font-semibold shadow-sm inline-flex items-center gap-2">
              {text}
              {onEdit && (
                <button 
                  onClick={onEdit}
                  className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-white/50 dark:hover:bg-black/20"
                  title="Edit"
                >
                  <Edit3 size={14} />
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OptionsSelector({ options, onSelect }: { options: string[], onSelect: (opt: string) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className="w-full flex flex-wrap gap-2 pb-2"
    >
      {options.map((opt, i) => (
        <motion.button
          key={opt}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(opt)}
          className="px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-all"
        >
          {opt}
        </motion.button>
      ))}
    </motion.div>
  );
}

function ToggleConfig({ 
  title, 
  description, 
  enabled, 
  onToggle, 
  icon: Icon,
  color
}: { 
  title: string, 
  description: string, 
  enabled: boolean, 
  onToggle: () => void,
  icon: React.ElementType,
  color: string
}) {
  return (
    <div 
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between px-4 py-3 sm:p-4 rounded-xl border cursor-pointer transition-all",
        enabled 
          ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20" 
          : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700"
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-1">
        <div className={cn("hidden sm:flex p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700", color)}>
          <Icon size={18} />
        </div>
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">{title}</h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className={cn(
        "w-10 h-5 sm:w-12 sm:h-6 rounded-full flex items-center p-1 transition-colors duration-300 ml-4",
        enabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
      )}>
        <motion.div 
          layout 
          className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-sm"
          animate={{ x: enabled ? (window.innerWidth < 640 ? 20 : 24) : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </div>
  );
}
