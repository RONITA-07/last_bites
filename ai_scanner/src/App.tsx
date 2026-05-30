import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Upload,
  Trash2,
  History,
  Sparkles,
  Shield,
  AlertTriangle,
  ShieldCheck,
  Flame,
  ChevronRight,
  RefreshCw,
  Eye,
  Info,
  Check,
  HelpCircle,
  Apple,
  TrendingDown,
  Droplet,
  Zap,
  BookmarkCheck,
  Minimize,
  Crown,
  X,
  Sun,
  Moon
} from "lucide-react";
import { FoodAnalysisResult, ScanHistoryItem, QualityValidationResult } from "./types";
import { analyzeImageQuality } from "./utils/imageQuality";

// Demo foods for instant playground testing
const DEMO_PRESETS = [
  {
    name: "Perfectly Fresh Red Gala Apple",
    imageName: "fresh_apple",
    data: {
      foodName: "Red Gala Apple",
      confidence: 0.98,
      freshnessPercentage: 95,
      safetyStatus: "Safe",
      shelfLifeEstimate: "7-10 days in the refrigerator fruit crisper",
      description: {
        skin: "Bright, taut crimson coloration with gentle yellow speckling. No signs of soft bruising or mold.",
        color: "95% vibrant red skin, white crisp internal flesh with minimal oxidation observable.",
        texture: "Extremely firm, dense structure with a dry, healthy stem socket.",
        moisture: "Dry and slightly glossy natural wax layer, protecting raw pulp moisture robustly.",
      },
      storageAdvice: [
        "Store in a dedicated perforated plastic bag or crisper drawer to lock in humidity.",
        "Keep away from ethylene-sensitive greens as apples naturally gas-off ripening agents.",
        "To preserve immediate crispness, do not wash prior to storage."
      ],
      macroBreakdown: {
        calories: 95,
        protein: 0.5,
        carbs: 25.0,
        fats: 0.3,
        fiber: 4.4,
        sodium: 2.0,
      }
    } as FoodAnalysisResult,
  },
  {
    name: "Slightly Spotted Cavendish Banana",
    imageName: "ripe_banana",
    data: {
      foodName: "Spotted Ripe Banana",
      confidence: 0.94,
      freshnessPercentage: 68,
      safetyStatus: "Safe",
      shelfLifeEstimate: "2-3 days on counter (or peel and freeze immediately)",
      description: {
        skin: "Yellow with moderate brown sugar spots emerging over 35% of the total surface.",
        color: "Deeper golden flesh, indicating rich conversion of starch to sweet digestible sugars.",
        texture: "Yielding slightly to gentle pressure; soft but structurally sound with no interior rot.",
        moisture: "High natural fruit moisture. Outer peel has begun sweating mildly in standard ambient air.",
      },
      storageAdvice: [
        "Peel, slice, and freeze now to create perfect high-fiber bases for upcoming smoothies.",
        "Hang away from other fruits on a banana hanger tree to uniformize airflow.",
        "Bake into a rich fiber banana cake or healthy whole-grain pancakes today!"
      ],
      macroBreakdown: {
        calories: 105,
        protein: 1.3,
        carbs: 27.0,
        fats: 0.4,
        fiber: 3.1,
        sodium: 1.0,
      }
    } as FoodAnalysisResult,
  },
  {
    name: "Stale / Bruised Lettuce Head",
    imageName: "lettuce_spoiled",
    data: {
      foodName: "Iceberg Lettuce Head",
      confidence: 0.91,
      freshnessPercentage: 35,
      safetyStatus: "Caution",
      shelfLifeEstimate: "1-2 days (requires trimming oxidized outer layers)",
      description: {
        skin: "Outer leaves are noticeably limp, wrinkled, and weeping water.",
        color: "Significant browning and rusty oxidation near core margins and leaf tips.",
        texture: "Soft, limp feel lacking fresh cellular water pressure. Structural crunch has dropped.",
        moisture: "Excessive unevaporated moisture pooling, risking rapid mold formation.",
      },
      storageAdvice: [
        "Trim away all oxidized brown margins rigorously. Discard slimy outer leaves immediately.",
        "Wrap remaining healthy heart tightly in a damp dry paper towel to restore crisp structure.",
        "Store in an airtight container in the coldest reach of your raw crisper drawer.",
      ],
      macroBreakdown: {
        calories: 15,
        protein: 0.9,
        carbs: 3.0,
        fats: 0.1,
        fiber: 1.2,
        sodium: 10.0,
      }
    } as FoodAnalysisResult,
  }
];

export default function App() {
  // Application Primary layout views
  const [activeTab, setActiveTab] = useState<"scan" | "presets">("scan");

  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get("theme");
      if (urlTheme === "light" || urlTheme === "dark") {
        return urlTheme;
      }
    }
    return (localStorage.getItem("lastbite_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light-theme");
    } else {
      root.classList.remove("light-theme");
    }
    localStorage.setItem("lastbite_theme", theme);
  }, [theme]);

  // Premium subscription states
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem("lastbite_premium") === "true";
  });
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [billingAnnual, setBillingAnnual] = useState<boolean>(false);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);

  // Sync theme and premium state from Parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "THEME_CHANGE") {
        const nextTheme = event.data.theme;
        if (nextTheme === "light" || nextTheme === "dark") {
          setTheme(nextTheme);
        }
      } else if (event.data && event.data.type === "OPEN_PREMIUM_MODAL") {
        setIsPricingOpen(true);
      }
    };

    window.addEventListener("message", handleMessage);
    
    // Also notify parent about the current premium state on startup or changes
    window.parent.postMessage({ type: "PREMIUM_STATUS", isPremium }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, [isPremium]);

  // Open premium modal on startup if premium=true parameter is provided
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("premium") === "true") {
        setIsPricingOpen(true);
      }
    }
  }, []);

  // checkout simulation side effect
  useEffect(() => {
    if (checkoutPlan) {
      const timer = setTimeout(() => {
        if (checkoutPlan !== 'free') {
          setIsPremium(true);
          localStorage.setItem("lastbite_premium", "true");
          window.parent.postMessage({ type: "PREMIUM_STATUS", isPremium: true }, "*");
        } else {
          setIsPremium(false);
          localStorage.removeItem("lastbite_premium");
          window.parent.postMessage({ type: "PREMIUM_STATUS", isPremium: false }, "*");
        }
        setCheckoutPlan(null);
        setIsPricingOpen(false);
        alert(`LastBite Premium plan successfully activated!\nPlan: ${checkoutPlan === 'free' ? 'BASIC (FREE)' : checkoutPlan === 'pro' ? 'PLUS (PREMIUM)' : 'FAMILY & BULK'}\nThank you for choosing LastBite!`);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [checkoutPlan]);
  
  // Image & Camera Capture state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Real-time quality verification states
  const [qualityMetrics, setQualityMetrics] = useState<QualityValidationResult | null>(null);
  const [isEvaluatingQuality, setIsEvaluatingQuality] = useState<boolean>(false);
  
  // Selected/Active Food Analytics Results
  const [currentResult, setCurrentResult] = useState<FoodAnalysisResult | null>(null);
  const [activeAnalysisImage, setActiveAnalysisImage] = useState<string | null>(null);
  
  // Persistent histories
  const [historyList, setHistoryList] = useState<ScanHistoryItem[]>([]);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState<boolean>(true);
  
  // Interactive steps and fun facts loader
  const [loadingStep, setLoadingStep] = useState<string>("");
  const loadingMessages = [
    "Performing brightness assessments...",
    "Tracing spectral surface colors...",
    "Querying deep visual indexes via Gemini...",
    "Assessing dermal moisture & safety...",
    "Compiling macro ratios from ingredients..."
  ];

  // Load persistence files
  useEffect(() => {
    const saved = localStorage.getItem("food_freshness_history");
    if (saved) {
      try {
        setHistoryList(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local scan histories.", e);
      }
    } else {
      // Setup typical defaults to illustrate dynamic history
      const initialHistory: ScanHistoryItem[] = [
        {
          id: "hist-1",
          timestamp: new Date(Date.now() - 3600000 * 2.5).toLocaleString(),
          image: "https://images.unsplash.com/photo-1550258114-889489842165?w=200&auto=format&fit=crop&q=60",
          result: DEMO_PRESETS[0].data
        },
        {
          id: "hist-2",
          timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString(),
          image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&auto=format&fit=crop&q=60",
          result: DEMO_PRESETS[1].data
        }
      ];
      setHistoryList(initialHistory);
      localStorage.setItem("food_freshness_history", JSON.stringify(initialHistory));
    }
  }, []);

  // Save history helper
  const saveHistory = (newList: ScanHistoryItem[]) => {
    setHistoryList(newList);
    localStorage.setItem("food_freshness_history", JSON.stringify(newList));
  };

  // Clear single items
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = historyList.filter((item) => item.id !== id);
    saveHistory(filtered);
    if (currentResult && historyList.find((h) => h.id === id)?.result.foodName === currentResult.foodName) {
      setCurrentResult(null);
      setActiveAnalysisImage(null);
    }
  };

  // Reset entire workflow
  const clearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear your freshness scan database?")) {
      saveHistory([]);
      setCurrentResult(null);
      setActiveAnalysisImage(null);
    }
  };

  // Webcam stream handlers
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    setSelectedImage(null);
    setQualityMetrics(null);

    try {
      const constraints = {
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError(
        "Camera permission is blocked or unavailable on this device. Please select standard File Upload instead."
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Trigger camera capture snapshot
  const captureSnapshot = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      // Keep native resolution aspect ratio
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setSelectedImage(dataUrl);
        stopCamera();
        
        // Run swift image quality check immediately 
        await evaluateQuality(dataUrl);
      }
    }
  };

  // File Upload handler via standard drag zone
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Str = event.target?.result as string;
        setSelectedImage(base64Str);
        await evaluateQuality(base64Str);
      };
      reader.readAsDataURL(file);
    }
  };

  // Evaluate uploaded or snapped image quality
  const evaluateQuality = async (imgBase64: string) => {
    setIsEvaluatingQuality(true);
    try {
      const evaluation = await analyzeImageQuality(imgBase64);
      setQualityMetrics(evaluation);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluatingQuality(false);
    }
  };

  // Send payload to backend Express proxy
  const submitAnalysis = async () => {
    if (!selectedImage) return;
    
    setIsLoading(true);
    setApiError(null);
    setLoadingStep(loadingMessages[0]);
    
    // Cycle loading states over time to keep experience reassuring
    const timerIds: NodeJS.Timeout[] = [];
    loadingMessages.forEach((msg, i) => {
      const t = setTimeout(() => {
        setLoadingStep(msg);
      }, i * 1500);
      timerIds.push(t);
    });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          mimeType: "image/jpeg"
        }),
      });

      const body = await res.json();
      
      if (!res.ok) {
        throw new Error(body.error || "An unexpected error occurred during analysis.");
      }

      if (body.success && body.data) {
        const foodResult = body.data as FoodAnalysisResult;
        setCurrentResult(foodResult);
        setActiveAnalysisImage(selectedImage);
        
        // Append into History Database
        const newItem: ScanHistoryItem = {
          id: `hist-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          image: selectedImage,
          result: foodResult
        };
        saveHistory([newItem, ...historyList]);
      } else {
        throw new Error("Invalid output received from the server scanner.");
      }
    } catch (err: any) {
      console.error("Scanner exception:", err);
      setApiError(err.message || "Failed to parse ingredient. Please clarify lighting and retry.");
    } finally {
      timerIds.forEach((t) => clearTimeout(t));
      setIsLoading(false);
    }
  };

  // Demo food picker
  const handlePresetSelect = (preset: typeof DEMO_PRESETS[number]) => {
    const backupImages = {
      fresh_apple: "https://images.unsplash.com/photo-1550258114-889489842165?w=500&auto=format&fit=crop&q=80",
      ripe_banana: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80",
      lettuce_spoiled: "https://images.unsplash.com/photo-1622484211148-716598e040c2?w=500&auto=format&fit=crop&q=80"
    };
    
    const pickedImage = backupImages[preset.imageName as keyof typeof backupImages];
    setSelectedImage(pickedImage);
    setQualityMetrics({
      brightness: 110,
      contrast: 45,
      tooDark: false,
      tooBright: false,
      isBlurry: false,
      score: 95,
      ok: true,
      details: "High clarity preset image loaded properly."
    });
    setCurrentResult(preset.data);
    setActiveAnalysisImage(pickedImage);
  };

  // Clean camera state on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Visual helper colors depending on freshness and safety
  const getSafetyTheme = (status?: string | null) => {
    const s = (status || "").toLowerCase();
    if (s.includes("safe")) {
      return {
        bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        badge: "bg-emerald-500 text-slate-905",
        text: "text-emerald-400",
        ring: "stroke-emerald-500",
        glow: "shadow-emerald-500/20"
      };
    } else if (s.includes("caution")) {
      return {
        bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        badge: "bg-amber-500 text-slate-905",
        text: "text-amber-400",
        ring: "stroke-amber-400",
        glow: "shadow-amber-500/20"
      };
    } else {
      return {
        bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        badge: "bg-rose-500 text-slate-905",
        text: "text-rose-400",
        ring: "stroke-rose-500",
        glow: "shadow-rose-500/20"
      };
    }
  };

  const safetyTheme = getSafetyTheme(currentResult?.safetyStatus);

  return (
    <div className="min-h-screen bg-bg-app text-text-main font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col antialiased">
      <header className="h-16 border-b border-border-main flex items-center justify-between px-6 bg-bg-header shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-widest">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Gemini Flash Connected
          </div>
        </div>

        {/* Global Control Toggles */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("scan")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "scan"
                  ? "bg-bg-card-sub text-primary-theme border border-border-main"
                  : "text-text-muted hover:text-text-title"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" />
                Scanner
              </div>
            </button>
            <button
              onClick={() => setActiveTab("presets")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "presets"
                  ? "bg-bg-card-sub text-primary-theme border border-border-main"
                  : "text-text-muted hover:text-text-title"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Apple className="h-3.5 w-3.5" />
                Presets
              </div>
            </button>
            
            <button
              onClick={() => setIsHistoryPanelOpen((prev) => !prev)}
              className={`p-2 rounded-lg border ml-1 transition-colors cursor-pointer ${
                isHistoryPanelOpen
                  ? "bg-bg-card-sub border-border-main text-primary-theme"
                  : "bg-transparent border-border-sub text-text-dark hover:text-text-title"
              }`}
              title="Toggle History Sidebar"
            >
              <History className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                window.parent.postMessage({ type: "CLOSE_SCANNER" }, "*");
              }}
              className="w-8 h-8 rounded-full border border-border-main bg-bg-card-sub hover:bg-bg-hud hover:text-rose-500 hover:border-rose-500/30 text-text-muted transition-all flex items-center justify-center cursor-pointer ml-1"
              title="Close Scanner and Return Home"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Primary Workspace container */}
      <main className="max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start p-3 sm:p-6">
        
        {/* LEFT COLUMN: History log (collapsible container) */}
        {isHistoryPanelOpen && (
          <aside className="lg:col-span-3 bg-bg-header border border-border-main rounded-2xl p-4 flex flex-col gap-4 self-stretch max-h-[80vh] overflow-y-auto">
            <div className="p-1 border-b border-border-sub flex items-center justify-between">
              <h2 className="text-xs font-bold text-text-dark uppercase tracking-[0.2em] flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-primary-theme" />
                Recent Scans ({historyList.length})
              </h2>
              {historyList.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="p-1 text-text-dark hover:text-rose-400 h-6 w-6 rounded transition-colors flex items-center justify-center cursor-pointer"
                  title="Clear history database"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
              {historyList.length === 0 ? (
                <div className="py-8 text-center text-text-dark flex flex-col items-center justify-center gap-2">
                  <BookmarkCheck className="h-8 w-8 text-text-dark" />
                  <p className="text-xs">No saved scans</p>
                  <p className="text-[10px] text-text-dark max-w-[150px] mx-auto">
                    Uploaded food photos will register here automatically
                  </p>
                </div>
              ) : (
                historyList.map((item) => {
                  const subTheme = getSafetyTheme(item.result.safetyStatus);
                  const isActive = currentResult?.foodName === item.result.foodName;
                  return (
                     <div
                      key={item.id}
                      onClick={() => {
                        setCurrentResult(item.result);
                        setSelectedImage(item.image);
                        setActiveAnalysisImage(item.image);
                        setQualityMetrics(null); // Clear live check on historic view loads
                      }}
                      className={`group relative flex items-center gap-3 p-3 mx-1 rounded-xl border transition-all cursor-pointer text-left ${
                        isActive
                          ? "bg-primary-theme/10 border-primary-theme/30"
                          : "bg-transparent border-transparent hover:bg-bg-card-sub"
                      }`}
                    >
                      <div className="h-12 w-12 rounded-lg bg-bg-app overflow-hidden border border-border-sub flex-shrink-0 relative">
                        {item.image.startsWith("data:") || item.image.startsWith("http") ? (
                          <img src={item.image} alt={item.result.foodName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-bg-hud flex items-center justify-center">
                            <Apple className="h-5 w-5 text-text-dark" />
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 text-[8px] px-1 bg-black/80 font-mono text-primary-theme font-semibold rounded-tl">
                          {item.result.freshnessPercentage}%
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="text-xs font-semibold text-text-main truncate group-hover:text-primary-theme transition-colors">
                          {item.result.foodName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${subTheme.bg}`}>
                            {item.result.safetyStatus}
                          </span>
                          <span className="text-[9px] text-text-dark font-mono truncate">
                            {item.timestamp.split(",")[0]}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="absolute right-2 text-text-dark hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                        title="Delete record"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* MIDDLE / WORKSPACE: Scanner engine or presets selection */}
        <div className={`${isHistoryPanelOpen ? "lg:col-span-9" : "lg:col-span-12"} grid grid-cols-1 md:grid-cols-12 gap-6 items-start w-full`}>
          
          {/* SCANNER CAPTURE CARD (Left on wider displays) */}
          <div className="md:col-span-5 flex flex-col gap-6 w-full">
            
            {activeTab === "presets" ? (
              <div id="demo-presets-card" className="bg-bg-card border border-border-main rounded-3xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Apple className="h-4 w-4 text-primary-theme" />
                  <h3 className="text-xs font-bold tracking-wider font-mono text-text-muted uppercase">
                    Demo Ingredients & Meals
                  </h3>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-1">
                  Select any option below to load organic chemical and physical freshness metrics:
                </p>

                <div className="flex flex-col gap-3">
                  {DEMO_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePresetSelect(preset)}
                      className="p-3 text-left rounded-xl bg-bg-app/60 hover:bg-bg-card-sub border border-border-sub hover:border-primary-theme/30 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-text-main group-hover:text-primary-theme transition-colors">
                          {preset.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold border ${getSafetyTheme(preset.data.safetyStatus).bg}`}>
                            {preset.data.safetyStatus}
                          </span>
                          <span className="text-[10px] text-text-dark font-mono">
                            Freshness: {preset.data.freshnessPercentage}%
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-text-dark group-hover:text-primary-theme transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div id="scanner-feed-card" className="bg-bg-card border border-border-main rounded-3xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold tracking-wider text-text-muted uppercase flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary-theme animate-pulse"></span>
                    Freshness Diagnostic Lens
                  </span>
                  
                  {isCameraActive && (
                    <button
                      onClick={stopCamera}
                      className="text-xs text-text-dark hover:text-text-title font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <Minimize className="h-3 w-3" /> Stop Lens
                    </button>
                  )}
                </div>

                {/* Primary Lens Window */}
                <div className="bg-bg-app aspect-square rounded-2xl overflow-hidden border border-border-main relative flex flex-col items-center justify-center min-h-[280px]">
                  
                  {/* Option 1: Live Webcam active state */}
                  {isCameraActive && !selectedImage && (
                    <div className="w-full h-full relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      
                      {/* Reticle guide frames matching visual requirements */}
                      <div className="absolute inset-4 border border-border-main rounded-2xl pointer-events-none flex items-center justify-center">
                        <div className="h-48 w-48 border border-dashed border-primary-theme/40 rounded-full flex items-center justify-center relative">
                          <div className="absolute top-2 text-[9px] font-mono tracking-widest text-primary-theme font-semibold bg-black/80 px-2 py-0.5 rounded border border-border-sub">
                            ALIGN INGREDIENTS
                          </div>
                          {/* Corner tabs */}
                          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary-theme"></div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary-theme"></div>
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary-theme"></div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary-theme"></div>
                        </div>
                      </div>

                      {/* Video capture control HUD */}
                      <div className="absolute bottom-4 inset-x-0 flex justify-center">
                        <button
                          onClick={captureSnapshot}
                          className="px-5 py-2.5 bg-primary-theme hover:bg-primary-theme-hover text-black font-extrabold rounded-xl text-xs tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <Camera className="h-4 w-4" /> Snap Photo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Option 2: Image captured or loaded preview */}
                  {selectedImage && (
                    <div className="w-full h-full relative group">
                      <img
                        src={selectedImage}
                        alt="Captured food input"
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Interactive hover reset */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedImage(null);
                            setQualityMetrics(null);
                          }}
                          className="px-4 py-2 bg-bg-card-sub border border-border-main text-text-title rounded-xl text-xs font-semibold hover:bg-bg-hud cursor-pointer"
                        >
                          Change Picture
                        </button>
                        <button
                          onClick={startCamera}
                          className="px-4 py-2 bg-primary-theme text-black font-semibold rounded-xl text-xs hover:bg-primary-theme-hover cursor-pointer"
                        >
                          Use Webcam
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Option 3: Standard default empty slot */}
                  {!isCameraActive && !selectedImage && (
                    <div className="flex flex-col items-center justify-center text-center p-6 gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-[#1E1E22] border border-white/5 flex items-center justify-center text-slate-500">
                        <Upload className="h-6 w-6 text-text-muted" />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium text-text-main">Drop food image or snap photo</p>
                        <p className="text-[10px] text-text-dark">Supports JPEG, PNG, or WEBP formats</p>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center mt-2">
                        <button
                          onClick={startCamera}
                          className="px-3 py-1.5 bg-primary-theme hover:bg-primary-theme-hover text-black rounded-lg text-[11px] font-extrabold tracking-wide uppercase flex items-center gap-1 shadow transition-colors cursor-pointer"
                        >
                          <Camera className="h-3 w-3" /> Start webcam
                        </button>
                        
                        <label className="px-3 py-1.5 bg-bg-card-sub hover:bg-bg-hud text-text-main border border-border-sub rounded-lg text-[11px] font-bold cursor-pointer transition-colors">
                          Browse files
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Canvas hidden container for raw snapshots */}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Friendly instruction and warning indicators */}
                {cameraError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Dynamic Quality diagnostics score card if image exists */}
                {selectedImage && qualityMetrics && (
                  <div className="p-3.5 bg-bg-app/80 border border-border-main rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                        Spectral Diagnostics
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        qualityMetrics.ok ? "bg-primary-theme/10 text-primary-theme" : "bg-amber-500/10 text-amber-500"
                      }`}>
                        Score: {qualityMetrics.score}% ({qualityMetrics.ok ? "OPTIMAL" : "UNCLEAR"})
                      </span>
                    </div>

                    <p className="text-[11px] text-text-muted leading-relaxed mb-3">
                      {qualityMetrics.details}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-text-muted">
                      <div className="bg-bg-card-sub p-1.5 rounded border border-border-sub flex justify-between">
                        <span>Intensity value:</span>
                        <span className="text-text-main">{qualityMetrics.brightness}/255</span>
                      </div>
                      <div className="bg-bg-card-sub p-1.5 rounded border border-border-sub flex justify-between">
                        <span>Luminance:</span>
                        <span className={qualityMetrics.tooDark ? "text-rose-400 font-bold" : "text-primary-theme"}>
                          {qualityMetrics.tooDark ? "Dim / Under-exposed" : "Calibrated"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submission button */}
                {selectedImage && (
                  <button
                    onClick={submitAnalysis}
                    disabled={isLoading}
                    className="w-full mt-2 py-3.5 bg-primary-theme disabled:bg-bg-card-sub disabled:text-text-dark disabled:border-border-sub disabled:cursor-not-allowed hover:bg-primary-theme-hover text-black font-extrabold rounded-2xl text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Running spectral analytics...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Diagnose Freshness</span>
                      </>
                    )}
                  </button>
                )}



                {isLoading && (
                  <div className="text-center py-2 flex flex-col gap-1 items-center animate-pulse">
                    <span className="text-[10px] font-mono text-primary-theme">{loadingStep}</span>
                    <div className="w-full bg-bg-app h-1 rounded-full overflow-hidden mt-1 border border-border-sub">
                      <div className="bg-primary-theme h-full w-[65%] animate-infinite-fill rounded-full"></div>
                    </div>
                  </div>
                )}

                {apiError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                    <h5 className="font-semibold mb-1">Scanning Error</h5>
                    <p className="leading-relaxed">{apiError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Quality Checklist indicator block */}
            <div className="h-20 bg-bg-card rounded-2xl border border-border-main flex items-center px-4 gap-4">
              <div className="text-[10px] font-bold text-text-dark uppercase tracking-widest w-20 line-clamp-2">Lens Quality</div>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary-theme shrink-0"></div>
                  <span className="text-[10px] text-text-muted font-semibold">Optimal Lux</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary-theme shrink-0"></div>
                  <span className="text-[10px] text-text-muted font-semibold">Sharp Edges</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary-theme shrink-0"></div>
                  <span className="text-[10px] text-text-muted font-semibold">Clear Focus</span>
                </div>
              </div>
            </div>
          </div>

          {/* RESULTS PANEL DASHBOARD (Right Column on wider screens) */}
          <div className="md:col-span-7 flex flex-col gap-6 w-full">
            {currentResult ? (
              <div className="flex flex-col gap-6 w-full">
                
                {/* Visual Header & Gauge segment */}
                <div className="bg-bg-card border border-border-main rounded-3xl p-6 flex flex-col gap-6 relative overflow-hidden">
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border-sub pb-4">
                    <div className="text-center sm:text-left">
                      <h2 className="text-xl font-bold tracking-tight text-text-title mb-1">
                        {currentResult.foodName}
                      </h2>
                      <p className="text-xs text-text-dark">
                        Confidence in scanning: <span className="font-mono text-text-main">{Math.round(currentResult.confidence * 100)}%</span>
                      </p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 border rounded-full text-center ${safetyTheme.bg}`}>
                      {currentResult.safetyStatus}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
                    {/* Freshness Dial Widget */}
                    <div className="flex flex-col items-center justify-center text-center relative shrink-0">
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        
                        {/* SVG Gauge circle */}
                        <svg className="absolute w-full h-full transform -rotate-90">
                          {/* Track underlay */}
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            className="radial-progress-underlay"
                            strokeWidth="6"
                            fill="none"
                          />
                          {/* Value meter */}
                          <motion.circle
                            cx="56"
                            cy="56"
                            r="48"
                            className={`radial-progress-bar ${safetyTheme.ring}`}
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray="301.6"
                            initial={{ strokeDashoffset: 301.6 }}
                            animate={{ strokeDashoffset: 301.6 - (301.6 * (currentResult.freshnessPercentage || 0)) / 100 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </svg>

                        {/* Score metrics center content */}
                        <div className="flex flex-col items-center pt-1 z-10">
                          <span className="text-2xl font-extrabold tracking-tight text-text-title">
                            {currentResult.freshnessPercentage}%
                          </span>
                          <span className="text-[8px] text-text-dark font-bold tracking-wider uppercase mt-1">
                            Freshness
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Freshness description details */}
                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-text-muted mb-1.5 tracking-wider">
                          <span>Shelf Life Estimate</span>
                          <span className="text-primary-theme font-mono">{currentResult.shelfLifeEstimate}</span>
                        </div>
                        <div className="h-1.5 bg-bg-hud rounded-full overflow-hidden border border-border-sub">
                          <motion.div
                            className="h-full bg-primary-theme"
                            initial={{ width: 0 }}
                            animate={{ width: `${currentResult.freshnessPercentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                      
                      <p className="text-xs text-text-muted leading-relaxed">
                        This food is currently assessed at <strong className={safetyTheme.text}>{currentResult.freshnessPercentage}% peak biological vitality</strong>. Confidence in this analysis is <span className="font-mono">{Math.round(currentResult.confidence * 100)}%</span>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Premium benefits indicator card */}
                <div className="bg-bg-card border border-border-main rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isPremium 
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' 
                        : 'bg-bg-card-sub text-text-muted border border-border-sub'
                    }`}>
                      <Crown className={`h-5 w-5 ${isPremium ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-text-title uppercase tracking-wider">
                        {isPremium ? "LastBite Premium Perks Active" : "Unlock Free Delivery & Discounts"}
                      </h4>
                      <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">
                        {isPremium 
                          ? "You receive Free Delivery and a premium order discount on this scanner transaction!"
                          : "Upgrade your account to qualify for free delivery and 10% - 20% order discounts."}
                      </p>
                    </div>
                  </div>
                  {isPremium ? (
                    <button
                      onClick={() => alert("Simulated Order Placed successfully with Premium Free Delivery and Discounts!")}
                      className="px-4 py-2 bg-primary-theme hover:bg-primary-theme-hover text-black text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-emerald-500/15"
                    >
                      Order Grocery
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsPricingOpen(true)}
                      className="px-4 py-2 bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/15"
                    >
                      Upgrade Plan
                    </button>
                  )}
                </div>

                {/* physical character analysis cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-bg-card-sub p-4 rounded-xl border border-border-sub text-left flex flex-col justify-between min-h-[90px]">
                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest block mb-1">
                      Surface Skin
                    </span>
                    <p className="text-[11px] text-text-main leading-relaxed truncate-2-lines font-semibold" title={currentResult.description.skin}>
                      {currentResult.description.skin}
                    </p>
                  </div>
                  <div className="bg-bg-card-sub p-4 rounded-xl border border-border-sub text-left flex flex-col justify-between min-h-[90px]">
                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest block mb-1">
                      Color / Ripeness
                    </span>
                    <p className="text-[11px] text-text-main leading-relaxed truncate-2-lines font-semibold" title={currentResult.description.color}>
                      {currentResult.description.color}
                    </p>
                  </div>
                  <div className="bg-bg-card-sub p-4 rounded-xl border border-border-sub text-left flex flex-col justify-between min-h-[90px]">
                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest block mb-1">
                      Texture / Feel
                    </span>
                    <p className="text-[11px] text-text-main leading-relaxed truncate-2-lines font-semibold" title={currentResult.description.texture}>
                      {currentResult.description.texture}
                    </p>
                  </div>
                  <div className="bg-bg-card-sub p-4 rounded-xl border border-border-sub text-left flex flex-col justify-between min-h-[90px]">
                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest block mb-1">
                      Moisture / Shine
                    </span>
                    <p className="text-[11px] text-text-main leading-relaxed truncate-2-lines font-semibold" title={currentResult.description.moisture}>
                      {currentResult.description.moisture}
                    </p>
                  </div>
                </div>

                {/* Nutritional macro trackers */}
                <div id="macronutrient-analytics-card" className="bg-bg-card rounded-3xl border border-border-main p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-primary-theme" />
                      Nutritional breakdown
                    </span>
                    <span className="text-xs font-mono bg-bg-app px-2 py-0.5 rounded border border-border-main text-text-main">
                      Estimated per portion
                    </span>
                  </div>

                  {/* Core Caloric HUD */}
                  <div className="p-3 bg-bg-hud rounded-xl border border-border-sub flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-rose-500" />
                      <div>
                        <span className="text-xs text-text-muted block leading-tight">Energy Density</span>
                        <span className="text-base font-bold font-mono tracking-tight text-text-title animate-pulse">
                          {currentResult.macroBreakdown.calories} kcal
                        </span>
                      </div>
                    </div>
                    
                    {/* Tiny secondary pills */}
                    <div className="flex gap-2 text-[10px] font-mono text-text-muted">
                      <span className="bg-bg-app px-2 py-1 rounded border border-border-sub">
                        Fiber: <strong className="text-text-main">{currentResult.macroBreakdown.fiber}g</strong>
                      </span>
                      <span className="bg-bg-app px-2 py-1 rounded border border-border-sub">
                        Sodium: <strong className="text-text-main">{currentResult.macroBreakdown.sodium}mg</strong>
                      </span>
                    </div>
                  </div>

                  {/* Progressive Macro Trackers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-1">
                    
                    {/* Carbohydrates tracker */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted font-medium">Carbohydrates</span>
                        <span className="font-mono font-bold text-primary-theme">{currentResult.macroBreakdown.carbs}g</span>
                      </div>
                      <div className="h-2 bg-bg-app rounded-full overflow-hidden border border-border-sub">
                        <motion.div
                          className="h-full bg-primary-theme rounded-full"
                          initial={{ width: 0 }}
                          // Animate out of standard Daily Allowance ceiling limit (e.g., 300g for visualization)
                          animate={{ width: `${Math.min(100, (currentResult.macroBreakdown.carbs / 300) * 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {/* Protein tracker */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted font-medium">Protein</span>
                        <span className="font-mono font-bold text-teal-400">{currentResult.macroBreakdown.protein}g</span>
                      </div>
                      <div className="h-2 bg-bg-app rounded-full overflow-hidden border border-border-sub">
                        <motion.div
                          className="h-full bg-teal-400 rounded-full"
                          initial={{ width: 0 }}
                          // Animate out of reference ceiling (e.g. 80g for Protein)
                          animate={{ width: `${Math.min(100, (currentResult.macroBreakdown.protein / 80) * 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {/* Fats tracker */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted font-medium">Lipid Fats</span>
                        <span className="font-mono font-bold text-amber-400">{currentResult.macroBreakdown.fats}g</span>
                      </div>
                      <div className="h-2 bg-bg-app rounded-full overflow-hidden border border-border-sub">
                        <motion.div
                          className="h-full bg-amber-400 rounded-full"
                          initial={{ width: 0 }}
                          // Animate out of reference ceiling (e.g. 70g for fat)
                          animate={{ width: `${Math.min(100, (currentResult.macroBreakdown.fats / 70) * 105)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                  </div>
                </div>



                {/* Practical storage action cards */}
                <div id="storage-tips-card" className="bg-bg-card border border-border-main rounded-3xl p-5 text-left">
                  <div className="flex items-center gap-2 mb-4 border-b border-border-sub pb-3">
                    <Info className="h-4 w-4 text-primary-theme" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
                      Preservation & Storage Guide
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2">
                    {currentResult.storageAdvice && currentResult.storageAdvice.length > 0 ? (
                      currentResult.storageAdvice.map((tip, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-2xl bg-bg-card-sub border border-border-sub"
                        >
                          <div className="h-5 w-5 rounded-full bg-primary-theme/10 border border-primary-theme/20 text-primary-theme flex items-center justify-center shrink-0 font-bold font-mono text-xs">
                            {idx + 1}
                          </div>
                          <p className="text-xs text-text-main leading-relaxed font-semibold">
                            {tip}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-text-dark font-mono">No storage advices parsed from ingredients.</p>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-bg-card border border-border-main rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[400px] h-full gap-4">
                <div className="h-14 w-14 rounded-2xl bg-bg-card-sub border border-border-sub flex items-center justify-center text-text-dark">
                  <Sparkles className="h-6 w-6 text-emerald-550/40 animate-pulse" />
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Workspace Pending Input</h3>
                  <p className="text-xs text-text-dark leading-relaxed">
                    Capture a raw photo using your webcam, browse local food graphics, or select from the demo tab on the left to review metrics.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </main>

      <footer className="max-w-7xl w-full mx-auto mt-12 py-6 border-t border-border-main flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-text-dark font-mono">
        <div>
          &copy; {new Date().getFullYear()} LastBite freshness index scanner
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-theme"></span>
            Gemini Flash Active
          </span>
          <span>Node.js / Express proxy layer enabled</span>
        </div>
      </footer>

      {/* Pricing and Subscription Modal */}
      <AnimatePresence>
        {isPricingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-bg-header border border-border-main rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl flex flex-col gap-6"
            >
              {/* Gold glow in top corner */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border-sub relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Crown className="h-5 w-5 text-black animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-text-title tracking-tight uppercase">LastBite Premium Access</h3>
                    <p className="text-xs text-text-muted">Unlock advanced scan diagnostics, priority delivery, and bulk order discounts</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsPricingOpen(false)}
                  className="p-2 text-text-muted hover:text-text-title hover:bg-bg-card-sub rounded-xl transition-all cursor-pointer"
                  title="Close Pricing Details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Monthly / Annual Billing Toggle */}
              <div className="flex justify-center items-center gap-3 py-1 relative z-10">
                <span className={`text-xs font-semibold ${!billingAnnual ? 'text-amber-400' : 'text-text-muted'}`}>Monthly Billing</span>
                <button
                  onClick={() => setBillingAnnual(!billingAnnual)}
                  className="w-12 h-6 bg-bg-hud rounded-full p-1 transition-colors relative focus:outline-none cursor-pointer"
                >
                  <div
                    className={`w-4 h-4 bg-amber-400 rounded-full shadow transition-all duration-300 transform ${
                      billingAnnual ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${billingAnnual ? 'text-amber-400' : 'text-text-muted'}`}>Annual Billing</span>
                  <span className="text-[9px] font-bold text-black bg-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Save 25%</span>
                </div>
              </div>

              {/* Pricing Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {/* Basic Plan */}
                <div className="bg-bg-card border border-border-sub rounded-2xl p-5 flex flex-col justify-between hover:border-border-main transition-all text-left">
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">Standard Option</span>
                    <h4 className="text-base font-bold text-text-title mb-2">Basic Plan</h4>
                    <p className="text-xs text-text-muted leading-relaxed mb-4">Core freshness scanning diagnostics for everyday personal meals.</p>
                    
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-3xl font-extrabold text-text-title">₹0</span>
                      <span className="text-xs text-text-dark">/ month</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-text-main mb-6">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary-theme shrink-0" />
                        <span>5 daily ingredients scans</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary-theme shrink-0" />
                        <span>Standard delivery rates</span>
                      </li>
                      <li className="flex items-center gap-2 text-text-dark">
                        <X className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-through">Bulk order discounts</span>
                      </li>
                      <li className="flex items-center gap-2 text-text-dark">
                        <X className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-through">AI Nutritionist advisor access</span>
                      </li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (isPremium) {
                        setCheckoutPlan('free');
                      } else {
                        setIsPricingOpen(false);
                      }
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      !isPremium
                        ? "bg-bg-app border border-border-main text-text-muted cursor-default"
                        : "bg-rose-500/10 text-rose-550 border border-rose-500/20 hover:bg-rose-500/25"
                    }`}
                  >
                    {!isPremium ? "Current Plan" : "Downgrade to Free"}
                  </button>
                </div>

                {/* Plus Premium Plan */}
                <div className="bg-bg-card border-2 border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between relative shadow-xl shadow-amber-500/5 hover:border-amber-500/60 transition-all text-left">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow">
                    Most Popular
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">Premium Scanner</span>
                    <h4 className="text-base font-bold text-text-title mb-2">Plus Active</h4>
                    <p className="text-xs text-text-muted leading-relaxed mb-4">Unlimited Gemini scanner diagnostic loads with free delivery and priority orders.</p>
                    
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-3xl font-extrabold text-text-title">
                        {billingAnnual ? "₹99" : "₹129"}
                      </span>
                      <span className="text-xs text-text-dark">/ month</span>
                      {billingAnnual && <span className="text-[10px] text-amber-400 font-bold ml-1">Billed annually</span>}
                    </div>

                    <ul className="space-y-2.5 text-xs text-text-main mb-6">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <strong>Unlimited access of smart AI chatbot</strong>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <strong>Unlimited AI freshness scans</strong>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span><strong>Free Delivery charges</strong> (no shipping fees)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span>10% Discount on orders over ₹2,500</span>
                      </li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => setCheckoutPlan('pro')}
                    className="w-full py-2.5 bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all cursor-pointer"
                  >
                    {isPremium ? "Change to Plus Plan" : "Go Plus Plan"}
                  </button>
                </div>

                {/* Family & Bulk Plan */}
                <div className="bg-bg-card border border-border-sub rounded-2xl p-5 flex flex-col justify-between hover:border-border-main transition-all text-left">
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">Max Savings</span>
                    <h4 className="text-base font-bold text-text-title mb-2">Family & Bulk</h4>
                    <p className="text-xs text-text-muted leading-relaxed mb-4">Ideal for large household purchases and premium grocery batches.</p>
                    
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-3xl font-extrabold text-text-title">
                        {billingAnnual ? "₹299" : "₹399"}
                      </span>
                      <span className="text-xs text-text-dark">/ month</span>
                      {billingAnnual && <span className="text-[10px] text-amber-400 font-bold ml-1">Billed annually</span>}
                    </div>

                    <ul className="space-y-2.5 text-xs text-text-main mb-6">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary-theme shrink-0" />
                        <strong>Unlimited access of smart AI chatbot</strong>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary-theme shrink-0" />
                        <strong>Unlimited AI freshness scans</strong>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary-theme shrink-0" />
                        <span><strong>Free Delivery charges</strong> (always zero fees)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary-theme shrink-0" />
                        <span>20% Discount on orders over ₹4,000</span>
                      </li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => setCheckoutPlan('family')}
                    className="w-full py-2.5 bg-bg-card-sub hover:bg-bg-hud text-text-main text-xs font-bold border border-border-main rounded-xl transition-all cursor-pointer"
                  >
                    Upgrade to Family
                  </button>
                </div>
              </div>

              {/* Security warning / footer note */}
              <div className="flex items-center gap-2 bg-bg-card-sub p-3 rounded-2xl border border-border-sub relative z-10 text-left">
                <Shield className="h-4 w-4 text-amber-400 shrink-0" />
                <p className="text-[10px] text-text-muted leading-normal">
                  All payment transactions are encrypted and processed by Stripe. You can adjust, suspend, or cancel subscription plans anytime directly from your user profile dashboard without extra fees.
                </p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Animated Stripe redirection overlay loader */}
      <AnimatePresence>
        {checkoutPlan && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-app/90 backdrop-blur-lg">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center text-center p-6 max-w-sm"
            >
              <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin flex items-center justify-center mb-6">
                <Crown className="h-6 w-6 text-amber-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-text-title mb-2 uppercase tracking-wide">Secure Billing Gateway</h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Establishing handshake connection to Stripe payment services... Please don't close this browser window.
              </p>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-bg-card-sub border border-border-sub rounded-full text-[10px] text-text-dark font-mono animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-theme"></span>
                HTTPS encrypted transaction active
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
