import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Zap, 
  Trophy, 
  Crown, 
  Search, 
  Plus, 
  Brain, 
  FileText, 
  Layout, 
  Settings, 
  LogOut, 
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
  Briefcase,
  Wallet,
  Shield
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { loginWithGoogle, logout, onAuthChange } from "./services/auth";
import { 
  getUserProfile, 
  upgradeUser, 
  trackAiUsage, 
  requestWithdrawal, 
  getWithdrawals
} from "./services/userService";
import { getGigs, claimGig, createGig, submitGig, completeGig } from "./services/gigService";
import { generateStudyMaterial } from "./services/aiService";
import { seedGigs } from "./services/seed";
import { User as FirebaseUser } from "firebase/auth";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState("study");
  const [isPremium, setIsPremium] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUser({
            id: firebaseUser.uid,
            name: profile.name || firebaseUser.displayName || "Student King",
            email: firebaseUser.email || "",
            aiUsage: profile.aiUsage || 0,
            earnings: profile.earnings || 0
          });
          setIsPremium(profile.isPremium || false);
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        setUser(null);
        setIsPremium(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      setShowAuthModal(false);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setIsPremium(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;
    try {
      await upgradeUser(user.id);
      setIsPremium(true);
    } catch (error) {
      console.error("Upgrade failed:", error);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      // In a real app, we'd verify the session on the server
      // For this demo, we'll assume the redirect means success
      if (user) {
        upgradeUser(user.id).then(() => {
          refreshUser();
          window.history.replaceState({}, document.title, window.location.pathname);
        });
      }
    }
  }, [user]);

  const refreshUser = async () => {
    if (user) {
      const profile = await getUserProfile(user.id);
      setUser({
        ...user,
        aiUsage: profile.aiUsage || 0,
        earnings: profile.earnings || 0
      });
      setIsPremium(profile.isPremium || false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col p-6 space-y-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-accent rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <BookOpen className="text-void w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">King Library <span className="text-emerald-accent">v3.0</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem 
            icon={<Layout className="w-5 h-5" />} 
            label="Dashboard" 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
          />
          <NavItem 
            icon={<Brain className="w-5 h-5" />} 
            label="Study Architect" 
            active={activeTab === "study"} 
            onClick={() => setActiveTab("study")} 
          />
          <NavItem 
            icon={<Trophy className="w-5 h-5" />} 
            label="Gig Marketplace" 
            active={activeTab === "gigs"} 
            onClick={() => setActiveTab("gigs")} 
          />
          <NavItem 
            icon={<Briefcase className="w-5 h-5" />} 
            label="My Tasks" 
            active={activeTab === "tasks"} 
            onClick={() => setActiveTab("tasks")} 
          />
          <NavItem 
            icon={<Wallet className="w-5 h-5" />} 
            label="Wallet" 
            active={activeTab === "wallet"} 
            onClick={() => setActiveTab("wallet")} 
          />
          <NavItem 
            icon={<Plus className="w-5 h-5" />} 
            label="Hire Talent" 
            active={activeTab === "hire"} 
            onClick={() => setActiveTab("hire")} 
          />
          <NavItem 
            icon={<Crown className="w-5 h-5" />} 
            label="Premium" 
            active={activeTab === "premium"} 
            onClick={() => setActiveTab("premium")} 
          />
        </nav>

        <div className="pt-6 border-t border-white/10">
          {user ? (
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">{user.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-white/50 truncate">{user.email}</p>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <LogOut className="w-4 h-4 text-white/30 hover:text-white" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="w-full emerald-btn text-sm py-2.5"
            >
              Get Started
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-1">
              {activeTab === "study" && "Study Architect"}
              {activeTab === "dashboard" && `Welcome Back, ${user?.name.split(' ')[0] || 'King'}`}
              {activeTab === "gigs" && "Gig Marketplace"}
              {activeTab === "tasks" && "My Tasks & Projects"}
              {activeTab === "wallet" && "Your Kingdom's Treasury"}
              {activeTab === "hire" && "Hire Talent"}
              {activeTab === "premium" && "Premium Membership"}
            </h2>
            <p className="text-white/50 text-sm">
              {activeTab === "study" && "Transform your notes into intelligent study materials."}
              {activeTab === "dashboard" && "Here's what's happening with your learning journey."}
              {activeTab === "gigs" && "Claim high-paying tasks and earn while you learn."}
              {activeTab === "tasks" && "Manage your active claims and posted gigs."}
              {activeTab === "wallet" && "Withdraw your earnings and track your financial growth."}
              {activeTab === "hire" && "Post a task and find the best student for the job."}
              {activeTab === "premium" && "Unlock the full potential of King Library."}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-accent/50 transition-colors w-64"
              />
            </div>
            {!isPremium && (
              <button 
                onClick={() => setActiveTab("premium")}
                className="flex items-center space-x-2 bg-emerald-accent/10 text-emerald-accent border border-emerald-accent/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-accent/20 transition-colors"
              >
                <Crown className="w-4 h-4" />
                <span>Upgrade</span>
              </button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "study" && <StudyArchitect isPremium={isPremium} user={user} onUsageUpdate={(newUsage) => setUser((u: any) => u ? {...u, aiUsage: newUsage} : null)} />}
            {activeTab === "dashboard" && <DashboardView isPremium={isPremium} user={user} />}
            {activeTab === "gigs" && <GigMarketplace isPremium={isPremium} user={user} />}
            {activeTab === "tasks" && <TasksView user={user} onComplete={refreshUser} />}
            {activeTab === "wallet" && <WalletView user={user} onUpdate={refreshUser} />}
            {activeTab === "hire" && <HireView user={user} />}
            {activeTab === "premium" && <PremiumView isPremium={isPremium} user={user} onRefresh={refreshUser} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-md p-8 relative"
          >
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white"
            >
              <Plus className="w-6 h-6 rotate-45" />
            </button>
            <h3 className="text-2xl font-bold mb-2">Join the Kingdom</h3>
            <p className="text-white/50 text-sm mb-8">Access premium AI tools and high-paying gigs.</p>
            
            <div className="space-y-4">
              <button 
                onClick={handleLogin}
                className="w-full emerald-btn py-3 mt-4 flex items-center justify-center space-x-2"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                <span>Continue with Google</span>
              </button>
            </div>
            
            <p className="text-center text-sm text-white/30 mt-6">
              By continuing, you agree to our terms and conditions.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-emerald-accent/10 text-emerald-accent border border-emerald-accent/20" 
          : "text-white/50 hover:text-white hover:bg-white/5"
      )}
    >
      <span className={cn("transition-transform duration-200", active && "scale-110")}>{icon}</span>
      <span className="font-medium">{label}</span>
      {active && <motion.div layoutId="active-nav" className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-accent shadow-[0_0_8px_#10b981]" />}
    </button>
  );
}

function StudyArchitect({ isPremium, user, onUsageUpdate }: { isPremium: boolean; user: any; onUsageUpdate: (usage: number) => void }) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAction = async (action: "quiz" | "summary" | "flashcards" | "explanation") => {
    if (!user) {
      alert("Please log in to use AI tools.");
      return;
    }
    if (!isPremium && user.aiUsage >= 10) {
      alert("Free limit reached. Upgrade to Premium for unlimited AI requests.");
      return;
    }
    if (!input.trim()) return;

    setIsProcessing(true);
    try {
      // Track usage BEFORE generating to ensure it counts
      const success = await trackAiUsage(user.id);
      if (success) {
        const output = await generateStudyMaterial(input, action);
        setResult(output || "No output generated.");
        onUsageUpdate(user.aiUsage + 1);
      } else {
        alert("Error tracking usage. Please try again.");
      }
    } catch (error) {
      console.error(`Error generating ${action}:`, error);
      setResult("Error processing your request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-accent" />
              <span>Input Workspace</span>
            </h3>
            <span className="text-xs text-white/30">{input.length} characters</span>
          </div>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your lecture notes, textbook excerpts, or research papers here..."
            className="w-full h-80 bg-transparent border-none focus:ring-0 resize-none text-white/80 placeholder:text-white/20 leading-relaxed"
          />
          <div className="flex flex-wrap gap-3 pt-6 border-t border-white/10">
            <ActionButton 
              icon={<Brain className="w-4 h-4" />} 
              label="Generate Quiz" 
              onClick={() => handleAction("quiz")} 
              disabled={isProcessing}
            />
            <ActionButton 
              icon={<FileText className="w-4 h-4" />} 
              label="Summarize" 
              onClick={() => handleAction("summary")} 
              disabled={isProcessing}
            />
            <ActionButton 
              icon={<Zap className="w-4 h-4" />} 
              label="Flashcards" 
              onClick={() => handleAction("flashcards")} 
              disabled={isProcessing}
            />
            <ActionButton 
              icon={<Sparkles className="w-4 h-4" />} 
              label="Explain Concept" 
              onClick={() => handleAction("explanation")} 
              disabled={isProcessing}
            />
          </div>
        </div>

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 border-emerald-accent/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">AI Output</h3>
              <div className="flex space-y-0 space-x-2">
                <button className="text-xs text-white/50 hover:text-white px-3 py-1 rounded-md bg-white/5 transition-colors">Copy</button>
                <button className="text-xs text-white/50 hover:text-white px-3 py-1 rounded-md bg-white/5 transition-colors">Save to Library</button>
              </div>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-white/80 leading-relaxed">{result}</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="space-y-6">
        <div className="glass-card p-6">
          <h3 className="font-bold mb-4 flex items-center space-x-2">
            <Settings className="w-4 h-4 text-emerald-accent" />
            <span>AI Configuration</span>
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">Model</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-accent/50">
                <option>Gemini 1.5 Pro</option>
                <option>Gemini 1.5 Flash</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">Complexity</label>
              <div className="flex gap-2">
                {["Simple", "Standard", "Advanced"].map((level) => (
                  <button key={level} className="flex-1 py-1.5 text-xs rounded-md bg-white/5 border border-white/10 hover:border-emerald-accent/30 transition-colors">
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 bg-emerald-accent/5 border-emerald-accent/20">
          <h3 className="font-bold mb-2 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-emerald-accent" />
            <span>Usage Limits</span>
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Free AI Requests</span>
              <span>{user?.aiUsage || 0} / 10</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-accent shadow-[0_0_10px_#10b981] transition-all duration-500" 
                style={{ width: `${Math.min(((user?.aiUsage || 0) / 10) * 100, 100)}%` }}
              />
            </div>
            {!isPremium && (
              <p className="text-[10px] text-white/30 italic">Upgrade to Premium for unlimited AI processing.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-accent/10 hover:border-emerald-accent/30 hover:text-emerald-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DashboardView({ isPremium, user }: { isPremium: boolean; user: any }) {
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedGigs();
      alert("Gigs seeded! Refresh the page to see them.");
    } catch (error) {
      console.error("Seeding failed:", error);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<Brain className="text-emerald-accent" />} label="Study Sessions" value={user?.aiUsage?.toString() || "0"} trend="+12%" />
        <StatCard icon={<Trophy className="text-yellow-500" />} label="Gigs Completed" value="0" trend="+0" />
        <StatCard icon={<Zap className="text-blue-500" />} label="Earnings" value={`$${user?.earnings?.toFixed(2) || "0.00"}`} trend="+$0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <h3 className="font-bold mb-6">Recent Activity</h3>
          <div className="space-y-4">
            <ActivityItem 
              icon={<FileText className="w-4 h-4" />} 
              title="Welcome to King Library" 
              desc="Start by exploring the Study Architect." 
              time="Just now" 
            />
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-4">
          <h3 className="font-bold">Initialize Marketplace</h3>
          <p className="text-sm text-white/50">If the marketplace is empty, click below to seed initial gigs.</p>
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className="emerald-btn w-full flex items-center justify-center space-x-2"
          >
            {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{isSeeding ? "Seeding..." : "Seed Initial Gigs"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs font-medium text-emerald-accent bg-emerald-accent/10 px-2 py-1 rounded">{trend}</span>
      </div>
      <p className="text-white/50 text-xs uppercase tracking-wider font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ActivityItem({ icon, title, desc, time }: { icon: React.ReactNode; title: string; desc: string; time: string }) {
  return (
    <div className="flex items-center space-x-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-white/50 truncate">{desc}</p>
      </div>
      <span className="text-[10px] text-white/30 uppercase font-medium">{time}</span>
    </div>
  );
}

function GigItem({ title, payout, category, premium }: { title: string; payout: string; category: string; premium?: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium group-hover:text-emerald-accent transition-colors">{title}</p>
          {premium && <Lock className="w-3 h-3 text-emerald-accent" />}
        </div>
        <span className="text-[10px] text-white/30 uppercase tracking-wider">{category}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-emerald-accent">{payout}</p>
        <button className="text-[10px] text-white/30 hover:text-white uppercase font-bold flex items-center space-x-1 mt-1">
          <span>Details</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function GigMarketplace({ isPremium, user }: { isPremium: boolean; user: any }) {
  const [gigs, setGigs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("All Gigs");

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const data = await getGigs();
        setGigs(data);
      } catch (error) {
        console.error("Error fetching gigs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGigs();
  }, []);

  const handleClaim = async (gigId: string) => {
    if (!user) {
      alert("Please log in to claim gigs.");
      return;
    }
    try {
      await claimGig(gigId, user.id);
      setGigs(prev => prev.map(g => g.id === gigId ? { ...g, status: "claimed", claimedBy: user.id } : g));
      alert("Gig claimed successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to claim gig.");
    }
  };

  const filteredGigs = gigs.filter(gig => {
    if (filter === "All Gigs") return true;
    return gig.category === filter;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {["All Gigs", "Writing", "STEM", "Creative", "Research", "Tutoring"].map((cat) => (
          <button 
            key={cat} 
            onClick={() => setFilter(cat)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              filter === cat ? "bg-emerald-accent text-void" : "bg-white/5 text-white/50 hover:bg-white/10"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-accent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGigs.length > 0 ? (
            filteredGigs.map((gig) => (
              <GigCard 
                key={gig.id}
                gig={gig}
                onClaim={() => handleClaim(gig.id)}
                isPremium={isPremium}
                isClaimedByMe={gig.claimedBy === user?.id}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-white/30">
              No gigs found in this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface GigCardProps {
  gig: any;
  onClaim: () => any;
  isPremium: boolean;
  isClaimedByMe: boolean;
}

const GigCard: React.FC<GigCardProps> = ({ gig, onClaim, isPremium, isClaimedByMe }) => {
  const isLocked = gig.premium && !isPremium;
  const isClaimed = gig.status === "claimed";

  return (
    <div className="glass-card p-6 flex flex-col h-full group hover:border-emerald-accent/30 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-wrap gap-2">
          {gig.tags?.map((tag: string) => (
            <span key={tag} className="text-[10px] bg-white/5 px-2 py-1 rounded text-white/50 uppercase font-bold">{tag}</span>
          ))}
        </div>
        {gig.premium && (
          <div className="flex items-center space-x-1 text-emerald-accent bg-emerald-accent/10 px-2 py-1 rounded text-[10px] font-bold uppercase">
            <Lock className="w-3 h-3" />
            <span>Premium</span>
          </div>
        )}
      </div>
      <h4 className="text-lg font-bold mb-2 group-hover:text-emerald-accent transition-colors">{gig.title}</h4>
      <p className="text-sm text-white/50 mb-6 flex-1">{gig.desc}</p>
      <div className="pt-6 border-t border-white/10 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/30 uppercase font-bold">Payout</p>
          <p className="text-xl font-bold text-emerald-accent">{gig.payout}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/30 uppercase font-bold">Deadline</p>
          <p className="text-sm font-medium">{gig.deadline}</p>
        </div>
      </div>
      <button 
        onClick={onClaim}
        disabled={isLocked || isClaimed}
        className={cn(
          "w-full mt-6 py-2 text-sm font-bold rounded-lg transition-all",
          isClaimed 
            ? "bg-white/5 text-white/20 cursor-not-allowed" 
            : isLocked 
              ? "bg-white/5 text-white/30 cursor-not-allowed flex items-center justify-center space-x-2"
              : "emerald-outline-btn"
        )}
      >
        {isClaimed ? (isClaimedByMe ? "Claimed by You" : "Already Claimed") : isLocked ? <><Lock className="w-3 h-3" /> <span>Premium Locked</span></> : "Claim Gig"}
      </button>
    </div>
  );
}

function HireView({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    title: "",
    desc: "",
    payout: "",
    category: "Writing",
    tags: "",
    premium: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to post a gig.");
      return;
    }
    if (!formData.title || !formData.desc || !formData.payout) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const gigData = {
        ...formData,
        tags: formData.tags.split(",").map(t => t.trim()).filter(t => t),
        deadline: "Flexible" // Simple default
      };
      await createGig(gigData, user.id);
      alert("Gig posted successfully! It is now live in the marketplace.");
      setFormData({
        title: "",
        desc: "",
        payout: "",
        category: "Writing",
        tags: "",
        premium: false
      });
    } catch (error) {
      console.error("Failed to post gig:", error);
      alert("Failed to post gig. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card p-8">
        <h3 className="text-xl font-bold mb-6">Post a New Task</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">Gig Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Calculus Homework Help"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-accent/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">Description</label>
            <textarea 
              value={formData.desc}
              onChange={(e) => setFormData({...formData, desc: e.target.value})}
              placeholder="Describe the task in detail..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-accent/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">Payout Amount</label>
              <input 
                type="text" 
                value={formData.payout}
                onChange={(e) => setFormData({...formData, payout: e.target.value})}
                placeholder="e.g., $50"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-accent/50"
              />
              <p className="text-[10px] text-white/30 italic">A 10% platform commission will be deducted from the worker's payout.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-accent/50"
              >
                {["Writing", "STEM", "Creative", "Research", "Tutoring"].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">Tags (comma separated)</label>
            <input 
              type="text" 
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder="e.g., Math, Urgent, Python"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-accent/50"
            />
          </div>

          <div className="flex items-center space-x-3 p-4 bg-emerald-accent/5 rounded-xl border border-emerald-accent/10">
            <input 
              type="checkbox" 
              id="premium-toggle"
              checked={formData.premium}
              onChange={(e) => setFormData({...formData, premium: e.target.checked})}
              className="w-4 h-4 rounded border-white/10 bg-white/5 text-emerald-accent focus:ring-emerald-accent/50"
            />
            <label htmlFor="premium-toggle" className="text-sm font-medium cursor-pointer">
              Premium Only (Only Premium Kings can claim this gig)
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full emerald-btn py-3 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            <span>{isSubmitting ? "Posting..." : "Post Gig to Marketplace"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function WalletView({ user, onUpdate }: { user: any; onUpdate: () => void }) {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ amount: "", method: "PayPal", details: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      getWithdrawals(user.id).then(setWithdrawals);
    }
  }, [user]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (amountNum > (user?.earnings || 0)) {
      alert("Insufficient earnings.");
      return;
    }
    if (!formData.details) {
      alert("Please provide payment details.");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestWithdrawal(user.id, amountNum, formData.method, formData.details);
      alert("Withdrawal request submitted successfully!");
      setIsModalOpen(false);
      setFormData({ amount: "", method: "PayPal", details: "" });
      onUpdate();
      getWithdrawals(user.id).then(setWithdrawals);
    } catch (error) {
      console.error(error);
      alert("Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-xs text-white/50 uppercase tracking-widest">Available Balance</span>
          <span className="text-4xl font-black text-emerald-accent">${user?.earnings?.toFixed(2) || "0.00"}</span>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-4 emerald-btn px-8 py-2 text-sm"
          >
            Withdraw Funds
          </button>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-xs text-white/50 uppercase tracking-widest">Pending Requests</span>
          <span className="text-4xl font-black">
            ${withdrawals.filter(w => w.status === "pending").reduce((acc, w) => acc + w.amount, 0).toFixed(2)}
          </span>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-xs text-white/50 uppercase tracking-widest">Total Withdrawn</span>
          <span className="text-4xl font-black text-white/30">
            ${withdrawals.filter(w => w.status === "processed").reduce((acc, w) => acc + w.amount, 0).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-bold">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-white/30 uppercase text-[10px] tracking-widest">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-white/30 italic">No transactions yet.</td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white/50">{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium">{w.method}</td>
                    <td className="px-6 py-4 font-bold text-emerald-accent">${w.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                        w.status === "pending" && "bg-amber-500/10 text-amber-500",
                        w.status === "processed" && "bg-emerald-500/10 text-emerald-500",
                        w.status === "rejected" && "bg-rose-500/10 text-rose-500"
                      )}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-8 max-w-md w-full space-y-6"
          >
            <h3 className="text-xl font-bold">Request Withdrawal</h3>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-white/50 uppercase tracking-widest">Amount to Withdraw</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-accent/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-white/50 uppercase tracking-widest">Payment Method</label>
                <select 
                  value={formData.method}
                  onChange={(e) => setFormData({...formData, method: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-accent/50"
                >
                  <option value="PayPal">PayPal</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Crypto (USDT)">Crypto (USDT)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-white/50 uppercase tracking-widest">Payment Details</label>
                <input 
                  type="text" 
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                  placeholder="Email, Account Number, or Wallet Address"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-accent/50"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white/50 font-bold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl emerald-btn font-bold flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit Request</span>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function TasksView({ user, onComplete }: { user: any; onComplete: () => void }) {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGigs = async () => {
    setLoading(true);
    const allGigs = await getGigs();
    // Filter gigs where user is either poster or worker
    const myGigs = allGigs.filter((g: any) => g.postedBy === user.id || g.claimedBy === user.id);
    setGigs(myGigs);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchGigs();
  }, [user]);

  const handleAction = async (gig: any, action: "submit" | "complete") => {
    try {
      if (action === "submit") {
        await submitGig(gig.id);
        alert("Task submitted for review!");
      } else {
        await completeGig(gig.id, gig.claimedBy, gig.payout, gig.commission || 0);
        alert("Task marked as completed! Payout sent to worker.");
        onComplete();
      }
      fetchGigs();
    } catch (error) {
      console.error(error);
      alert("Action failed.");
    }
  };

  const claimedGigs = gigs.filter(g => g.claimedBy === user.id);
  const postedGigs = gigs.filter(g => g.postedBy === user.id);

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-emerald-accent/10 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-accent" />
          </div>
          <h3 className="text-xl font-bold">Tasks You're Working On</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {claimedGigs.length === 0 ? (
            <div className="col-span-full glass-card p-12 text-center text-white/30 italic">You haven't claimed any tasks yet.</div>
          ) : (
            claimedGigs.map(gig => (
              <div key={gig.id} className="glass-card p-6 space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-accent">{gig.category}</span>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                    gig.status === "claimed" ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500"
                  )}>{gig.status}</span>
                </div>
                <h4 className="font-bold text-lg">{gig.title}</h4>
                <p className="text-sm text-white/50 line-clamp-2">{gig.desc}</p>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-xl font-black">{gig.payout}</span>
                  {gig.status === "claimed" && (
                    <button 
                      onClick={() => handleAction(gig, "submit")}
                      className="emerald-btn px-4 py-2 text-xs"
                    >
                      Submit for Review
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-xl font-bold">Tasks You've Posted</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {postedGigs.length === 0 ? (
            <div className="col-span-full glass-card p-12 text-center text-white/30 italic">You haven't posted any tasks yet.</div>
          ) : (
            postedGigs.map(gig => (
              <div key={gig.id} className="glass-card p-6 space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">{gig.category}</span>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                    gig.status === "open" && "bg-white/10 text-white/50",
                    gig.status === "claimed" && "bg-amber-500/20 text-amber-500",
                    gig.status === "submitted" && "bg-blue-500/20 text-blue-500",
                    gig.status === "completed" && "bg-emerald-500/20 text-emerald-500"
                  )}>{gig.status}</span>
                </div>
                <h4 className="font-bold text-lg">{gig.title}</h4>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-xl font-black">{gig.payout}</span>
                  {gig.status === "submitted" && (
                    <button 
                      onClick={() => handleAction(gig, "complete")}
                      className="bg-emerald-accent text-void font-bold px-4 py-2 rounded-lg text-xs hover:scale-105 transition-transform"
                    >
                      Approve & Pay
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function PremiumView({ isPremium, user, onRefresh }: { isPremium: boolean; user: any; onRefresh: () => void }) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const price = billingCycle === "monthly" ? 35 : 30;
  const totalPrice = billingCycle === "monthly" ? 35 : 360;

  // Replace this with your Lemon Squeezy Checkout URL (e.g., https://your-store.lemonsqueezy.com/checkout/buy/your-product-id)
  const CHECKOUT_URL = `https://your-store.lemonsqueezy.com/checkout/buy/your-product-id?embed=1&checkout[custom][user_id]=${user.id}`;

  return (
    <div className="space-y-12">
      {message && (
        <div className={cn(
          "p-4 rounded-xl text-sm font-bold text-center animate-in fade-in slide-in-from-top-4",
          message.type === "success" ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
        )}>
          {message.text}
        </div>
      )}

      <div className="flex justify-center">
        <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex">
          <button 
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              billingCycle === "monthly" ? "bg-emerald-accent text-void" : "text-white/50 hover:text-white"
            )}
          >
            Monthly
          </button>
          <button 
            onClick={() => setBillingCycle("annual")}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2",
              billingCycle === "annual" ? "bg-emerald-accent text-void" : "text-white/50 hover:text-white"
            )}
          >
            <span>Annual</span>
            <span className="text-[10px] bg-void/20 px-1.5 py-0.5 rounded uppercase tracking-tighter">Save 15%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="glass-card p-8 border-white/5 flex flex-col">
          <div className="mb-8">
            <h4 className="text-xl font-bold mb-2">Student King</h4>
            <p className="text-white/50 text-sm">Essential tools for every student.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-black">$0</span>
            <span className="text-white/30 ml-2">/ month</span>
          </div>
          <ul className="space-y-4 mb-10 flex-1">
            <FeatureItem label="10 AI Study Requests / day" />
            <FeatureItem label="Access to Basic Marketplace" />
            <FeatureItem label="Standard Payout Processing" />
            <FeatureItem label="Community Support" />
          </ul>
          <button disabled className="w-full py-3 rounded-xl bg-white/5 text-white/30 font-bold cursor-not-allowed">
            Current Plan
          </button>
        </div>

        {/* Premium Plan */}
        <div className="glass-card p-8 border-emerald-accent/30 bg-emerald-accent/5 relative flex flex-col">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-accent text-void text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-[0_0_15px_#10b981]">
            Recommended
          </div>
          <div className="mb-8">
            <h4 className="text-xl font-bold mb-2">Premium King</h4>
            <p className="text-white/50 text-sm">The ultimate edge for academic success.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-black">
              ${price}
            </span>
            <span className="text-white/30 ml-2">/ month</span>
            {billingCycle === "annual" && (
              <p className="text-[10px] text-emerald-accent mt-1 font-bold uppercase tracking-widest">Billed annually (${totalPrice})</p>
            )}
          </div>
          <ul className="space-y-4 mb-10 flex-1">
            <FeatureItem label="Unlimited AI Study Requests" />
            <FeatureItem label="Access to High-Paying Gigs" />
            <FeatureItem label="Priority Payout Processing" />
            <FeatureItem label="Advanced Study Architect Tools" />
            <FeatureItem label="Premium Badge & Profile" />
          </ul>
          
          {isPremium ? (
            <div className="w-full py-3 rounded-xl bg-emerald-accent/20 text-emerald-accent font-bold text-center">
              Active Subscription
            </div>
          ) : (
            <div className="space-y-4">
              <a 
                href={CHECKOUT_URL}
                className="lemonsqueezy-button w-full py-3 rounded-xl font-bold transition-all emerald-btn flex items-center justify-center space-x-2"
              >
                <Crown className="w-5 h-5" />
                <span>Upgrade with Lemon Squeezy</span>
              </a>
            </div>
          )}
          <p className="text-[10px] text-center text-white/30 mt-4 italic">Secure payment via Lemon Squeezy</p>
        </div>
      </div>

      <div className="glass-card p-8 text-center space-y-6">
        <h4 className="text-xl font-bold">Why go Premium?</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-emerald-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-5 h-5 text-emerald-accent" />
            </div>
            <h5 className="font-bold text-sm">3x Faster AI</h5>
            <p className="text-xs text-white/50">Get your summaries and quizzes in seconds with priority servers.</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-emerald-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-5 h-5 text-emerald-accent" />
            </div>
            <h5 className="font-bold text-sm">Better Gigs</h5>
            <p className="text-xs text-white/50">Access tasks that pay up to $100+ reserved for premium members.</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-emerald-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-5 h-5 text-emerald-accent" />
            </div>
            <h5 className="font-bold text-sm">Exclusive Tools</h5>
            <p className="text-xs text-white/50">Unlock advanced study architects and custom learning paths.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <li className={cn("flex items-center space-x-3 text-sm", disabled ? "text-white/20" : "text-white/80")}>
      <CheckCircle2 className={cn("w-4 h-4", disabled ? "text-white/10" : "text-emerald-accent")} />
      <span>{label}</span>
    </li>
  );
}
