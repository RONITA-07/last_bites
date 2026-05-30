"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, Upload, Trash2, History, Sparkles, Shield, AlertTriangle, 
  ShieldCheck, Flame, ChevronRight, RefreshCw, Eye, Info, Check, 
  HelpCircle, Apple, TrendingDown, Droplet, Zap, BookmarkCheck, 
  Minimize, Crown, X, Sun, Moon 
} from 'lucide-react';
import { analyzeImageQuality } from '../../../utils/imageQuality';
import { API_BASE_URL } from '@/utils/api';

// Demo presets for mock sandbox testing
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
    },
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
    },
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
    },
  }
];

export default function AIScannerPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  // Tabs & Toggles
  const [activeTab, setActiveTab] = useState("scan"); // "scan" | "presets"
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(true);
  
  // Premium & Modal States
  const [isPremium, setIsPremium] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  // Scanner States
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  // Live quality assessment states
  const [qualityMetrics, setQualityMetrics] = useState(null);
  const [isEvaluatingQuality, setIsEvaluatingQuality] = useState(false);
  
  // Results & History
  const [currentResult, setCurrentResult] = useState(null);
  const [activeAnalysisImage, setActiveAnalysisImage] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  
  // Loading cycling statuses
  const [loadingStep, setLoadingStep] = useState("");
  const loadingMessages = [
    "Performing brightness assessments...",
    "Tracing spectral surface colors...",
    "Querying deep visual indexes via Gemini...",
    "Assessing dermal moisture & safety...",
    "Compiling macro ratios from ingredients..."
  ];

  // Auth Protection Check
  useEffect(() => {
    const stored = localStorage.getItem('decarb_user');
    if (!stored) {
      router.push('/?auth=login');
      return;
    }
    const u = JSON.parse(stored);
    if (u.role !== 'customer') {
      router.push('/');
      return;
    }
    setUser(u);

    // Initial premium loads
    setIsPremium(localStorage.getItem('decarb_premium') === 'true');
  }, [router]);

  // Monitor deep pricing request url
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('premium') === 'true') {
      setIsPricingOpen(true);
    }
  }, []);

  // Listen to parent events (Gold Crown clicks in navigation navbar)
  useEffect(() => {
    const handleOpenPremium = () => {
      setIsPricingOpen(true);
    };
    window.addEventListener('open-premium-modal', handleOpenPremium);
    return () => window.removeEventListener('open-premium-modal', handleOpenPremium);
  }, []);

  // Persisted history loaders
  useEffect(() => {
    const saved = localStorage.getItem("food_freshness_history");
    if (saved) {
      try {
        setHistoryList(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local scan histories.", e);
      }
    } else {
      const initialHistory = [
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

  const saveHistory = (newList) => {
    setHistoryList(newList);
    localStorage.setItem("food_freshness_history", JSON.stringify(newList));
  };

  const deleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const filtered = historyList.filter((item) => item.id !== id);
    saveHistory(filtered);
    if (currentResult && historyList.find((h) => h.id === id)?.result.foodName === currentResult.foodName) {
      setCurrentResult(null);
      setActiveAnalysisImage(null);
    }
  };

  const clearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear your freshness scan database?")) {
      saveHistory([]);
      setCurrentResult(null);
      setActiveAnalysisImage(null);
    }
  };

  // Camera API Streams
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
    } catch (err) {
      console.error("Camera access failed:", err);
      setCameraError("Camera permission is blocked or unavailable on this device. Please select standard File Upload instead.");
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

  const captureSnapshot = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setSelectedImage(dataUrl);
        stopCamera();
        await evaluateQuality(dataUrl);
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Str = event.target?.result;
        setSelectedImage(base64Str);
        await evaluateQuality(base64Str);
      };
      reader.readAsDataURL(file);
    }
  };

  const evaluateQuality = async (imgBase64) => {
    setIsEvaluatingQuality(true);
    try {
      const evaluation = await analyzeImageQuality(imgBase64);
      setQualityMetrics(evaluation);
    } catch (e) {
      console.error("Error evaluating image quality:", e);
    } finally {
      setIsEvaluatingQuality(false);
    }
  };

  // Submit base64 to serverless Next.js API route!
  const submitAnalysis = async () => {
    if (!selectedImage) return;
    
    setIsLoading(true);
    setApiError(null);
    setLoadingStep(loadingMessages[0]);
    
    const timerIds = [];
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
        const foodResult = body.data;
        setCurrentResult(foodResult);
        setActiveAnalysisImage(selectedImage);
        
        const newItem = {
          id: `hist-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          image: selectedImage,
          result: foodResult
        };
        saveHistory([newItem, ...historyList]);
      } else {
        throw new Error("Invalid output received from the server scanner.");
      }
    } catch (err) {
      console.error("Scanner exception:", err);
      setApiError(err.message || "Failed to parse ingredient. Please clarify lighting and retry.");
    } finally {
      timerIds.forEach((t) => clearTimeout(t));
      setIsLoading(false);
    }
  };

  // Demo presets picker
  const handlePresetSelect = (preset) => {
    const backupImages = {
      fresh_apple: "https://images.unsplash.com/photo-1550258114-889489842165?w=500&auto=format&fit=crop&q=80",
      ripe_banana: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80",
      lettuce_spoiled: "https://images.unsplash.com/photo-1622484211148-716598e040c2?w=500&auto=format&fit=crop&q=80"
    };
    
    const pickedImage = backupImages[preset.imageName];
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

  // Pricing premium live checkout using Razorpay Test API Keys
  useEffect(() => {
    if (!checkoutPlan) return;

    const runPremiumPayment = async () => {
      // 1. If downgrading to basic free plan, do it immediately
      if (checkoutPlan === 'free') {
        setIsPremium(false);
        localStorage.removeItem("decarb_premium");
        window.dispatchEvent(new Event('auth-change'));
        setCheckoutPlan(null);
        setIsPricingOpen(false);
        alert("Downgraded to Standard Basic free plan successfully.");
        return;
      }

      // 2. Determine price based on selected plan and billing option
      let price = 0;
      if (checkoutPlan === 'pro') {
        price = billingAnnual ? 1428 : 179;
      } else if (checkoutPlan === 'bulk') {
        price = billingAnnual ? 2868 : 349;
      }

      try {
        console.log(`[Premium Checkout] Initiating Razorpay payment order for ₹${price}`);
        
        // Create order on express backend
        const orderRes = await fetch(`${API_BASE_URL}/api/payment/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: price, currency: 'INR' }),
        });
        const orderData = await orderRes.json();
        
        if (!orderRes.ok) {
          throw new Error(orderData.error || 'Failed to initialize payment order');
        }

        // Live Razorpay payment modal instantiation
        if (typeof window !== 'undefined' && window.Razorpay) {
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SvOgND0abqlxRv',
            amount: orderData.amount,
            currency: orderData.currency,
            name: "Last Bite Premium",
            description: `Decarb Premium Upgrade - ${checkoutPlan.toUpperCase()}`,
            order_id: orderData.id,
            handler: async function (response) {
              try {
                // Verify signature on backend
                const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                  })
                });
                const verifyData = await verifyRes.json();
                if (!verifyRes.ok || !verifyData.verified) {
                  throw new Error(verifyData.error || 'Payment signature verification failed');
                }

                // Successful verification -> upgrade premium state
                setIsPremium(true);
                localStorage.setItem("decarb_premium", "true");
                window.dispatchEvent(new Event('auth-change'));
                setCheckoutPlan(null);
                setIsPricingOpen(false);
                alert(`LastBite Premium plan successfully activated!\nPlan: ${checkoutPlan === 'pro' ? 'PLUS (PREMIUM)' : 'FAMILY & BULK'}\nThank you for choosing LastBite!`);
              } catch (err) {
                alert(`Verification failed: ${err.message}`);
                setCheckoutPlan(null);
              }
            },
            prefill: {
              name: user?.name || '',
              email: user?.email || '',
            },
            theme: {
              color: "#fbbf24" // premium gold brand color
            },
            modal: {
              ondismiss: function () {
                console.log('[Premium Checkout] User dismissed the payment gateway.');
                setCheckoutPlan(null);
              }
            }
          };
          
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          throw new Error('Razorpay SDK failed to load. Please verify your internet connection.');
        }
      } catch (err) {
        console.error('[Premium Checkout] Error:', err);
        alert(`Failed to complete subscription upgrade: ${err.message}`);
        setCheckoutPlan(null);
      }
    };

    runPremiumPayment();
  }, [checkoutPlan, billingAnnual, user, router]);

  // Clean camera state on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!user) return null;

  // Visual helper colors depending on freshness and safety
  const getSafetyTheme = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("safe")) {
      return {
        bg: "rgba(16, 185, 129, 0.1) text-emerald-400 border-emerald-500/20",
        colorHex: "#10b981",
        ring: "stroke-emerald-500",
      };
    } else if (s.includes("caution")) {
      return {
        bg: "rgba(245, 158, 11, 0.1) text-amber-400 border-amber-500/20",
        colorHex: "#f59e0b",
        ring: "stroke-amber-400",
      };
    } else {
      return {
        bg: "rgba(239, 68, 68, 0.1) text-rose-400 border-rose-500/20",
        colorHex: "#ef4444",
        ring: "stroke-rose-500",
      };
    }
  };

  const safetyTheme = getSafetyTheme(currentResult?.safetyStatus);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      color: 'var(--text-primary)',
      fontFamily: "'Inter', sans-serif",
      paddingTop: '90px', // Header offsets
      paddingBottom: '50px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transition: 'var(--transition-smooth)'
    }}>
      
      {/* Header controls strip */}
      <div style={{
        maxWidth: '1200px',
        width: '95%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        background: 'var(--glass)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-soft)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            width: '10px',
            height: '10px',
            background: '#10b981',
            borderRadius: '50%',
            display: 'inline-block',
            boxShadow: '0 0 10px #10b981'
          }}></span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            Gemini Flash Native Engine
          </span>
        </div>

        {/* Action controllers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setActiveTab("scan")}
            style={{
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: activeTab === 'scan' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'scan' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Camera size={14} /> Scanner
          </button>

          <button
            onClick={() => setActiveTab("presets")}
            style={{
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: activeTab === 'presets' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'presets' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Apple size={14} /> Presets
          </button>

          <button
            onClick={() => setIsHistoryPanelOpen(!isHistoryPanelOpen)}
            style={{
              padding: '8px',
              background: isHistoryPanelOpen ? 'rgba(47,107,79,0.15)' : 'transparent',
              color: isHistoryPanelOpen ? 'var(--primary)' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            title="Toggle Scan History"
          >
            <History size={15} />
          </button>

          <button
            onClick={() => router.push('/consumer')}
            style={{
              padding: '8px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Return to Home Dashboard"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Primary Workspace container */}
      <div style={{
        maxWidth: '1200px',
        width: '95%',
        display: 'grid',
        gridTemplateColumns: isHistoryPanelOpen ? '260px 1fr' : '1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Left Side: Recent Scans History (Collapsible Panel) */}
        {isHistoryPanelOpen && (
          <aside className="glass-panel" style={{
            padding: '20px',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={14} style={{ color: 'var(--primary)' }} /> Scan Log ({historyList.length})
              </h3>
              {historyList.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  style={{ background: 'none', border: 'none', color: '#c5221f', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Clear all records"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historyList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                  <BookmarkCheck size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.75rem' }}>No recent scans</p>
                  <p style={{ fontSize: '0.62rem', marginTop: '4px' }}>Analyze ingredients to populate list.</p>
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
                        setQualityMetrics(null);
                      }}
                      style={{
                        padding: '10px',
                        background: isActive ? 'var(--accent)' : 'var(--surface-alt)',
                        borderRadius: '14px',
                        border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '10px',
                        position: 'relative',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        position: 'relative',
                        flexShrink: 0
                      }}>
                        <img src={item.image} alt={item.result.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          background: 'rgba(0,0,0,0.85)',
                          color: 'var(--primary)',
                          fontSize: '0.55rem',
                          fontWeight: 800,
                          padding: '1px 3px',
                          borderRadius: '4px 0 0 0'
                        }}>
                          {item.result.freshnessPercentage}%
                        </span>
                      </div>
                      
                      <div style={{ minWidth: 0, flexGrow: 1 }}>
                        <h4 style={{ fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                          {item.result.foodName}
                        </h4>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            padding: '1px 4px',
                            borderRadius: '4px',
                            background: subTheme.bg.split(' ')[0],
                            color: subTheme.colorHex,
                            border: `1px solid ${subTheme.colorHex}20`
                          }}>
                            {item.result.safetyStatus}
                          </span>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                            {item.timestamp.split(',')[0]}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* Right Side: Primary Active Workspace */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          width: '100%'
        }}>
          
          {/* LENS CAPTURE & CONTROL CARD */}
          <div className="floating-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeTab === 'presets' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
                  <Apple size={16} /> Sandbox Presets
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Load simulated organic scan results to explore full diagnostic parameters immediately:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  {DEMO_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => handlePresetSelect(preset)}
                      style={{
                        padding: '12px',
                        background: 'var(--surface-alt)',
                        border: '1px solid var(--border)',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{preset.name}</span>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.58rem',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: getSafetyTheme(preset.data.safetyStatus).bg.split(' ')[0],
                            color: getSafetyTheme(preset.data.safetyStatus).colorHex,
                            border: `1px solid ${getSafetyTheme(preset.data.safetyStatus).colorHex}20`
                          }}>
                            {preset.data.safetyStatus}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Freshness: {preset.data.freshnessPercentage}%</span>
                        </div>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--primary)' }} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                  Freshness Lens Captures
                </span>

                {/* Primary Lens Camera View Box */}
                <div style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  background: '#0B130F',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Option 1: Camera stream running */}
                  {isCameraActive && !selectedImage && (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                      />
                      
                      {/* Targets Overlays */}
                      <div style={{
                        position: 'absolute',
                        inset: '16px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none'
                      }}>
                        <div style={{
                          width: '180px',
                          height: '180px',
                          border: '2px dashed rgba(82, 183, 136, 0.4)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          <span style={{
                            position: 'absolute',
                            top: '10px',
                            background: 'rgba(0,0,0,0.85)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.55rem',
                            color: '#52B788',
                            fontWeight: 800,
                            letterSpacing: '0.05em'
                          }}>ALIGN FOOD ITEM</span>
                        </div>
                      </div>

                      {/* Snap shutter button */}
                      <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                        <button
                          onClick={captureSnapshot}
                          style={{
                            padding: '10px 16px',
                            background: '#52B788',
                            border: 'none',
                            color: '#000000',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(82,183,136,0.3)'
                          }}
                        >
                          <Camera size={14} /> Snap Photo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Option 2: Image snap captured or file chosen */}
                  {selectedImage && (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <img src={selectedImage} alt="Analysis Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {/* Quality checks overlays on captured frames */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                        <button
                          onClick={() => {
                            setSelectedImage(null);
                            setQualityMetrics(null);
                          }}
                          style={{
                            padding: '8px 12px',
                            background: '#ffffff',
                            color: '#000',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          Retake
                        </button>
                        <button
                          onClick={startCamera}
                          style={{
                            padding: '8px 12px',
                            background: 'var(--primary)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          Use Lens
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Option 3: Camera idle and no image select */}
                  {!isCameraActive && !selectedImage && (
                    <div style={{
                      padding: '24px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        background: 'var(--surface-alt)',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border)'
                      }}>
                        <Upload size={22} style={{ color: 'var(--text-secondary)' }} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Upload surplus box image</h4>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '200px' }}>
                          Upload raw pictures or use native devices cameras
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '8px' }}>
                        <button
                          onClick={startCamera}
                          style={{
                            padding: '10px',
                            background: 'var(--primary)',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Camera size={14} /> Open Device Camera
                        </button>

                        <label style={{
                          padding: '10px',
                          background: 'var(--surface-alt)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}>
                          <Upload size={14} /> Select File
                          <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Image Quality check metric panel */}
                {selectedImage && qualityMetrics && (
                  <div style={{
                    padding: '12px',
                    background: qualityMetrics.ok ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    borderRadius: '14px',
                    border: qualityMetrics.ok ? '1px dashed rgba(16,185,129,0.2)' : '1px dashed rgba(239,68,68,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        Pixel Quality Verification
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        color: qualityMetrics.ok ? '#10b981' : '#ef4444'
                      }}>
                        Score: {qualityMetrics.score}/100 • {qualityMetrics.ok ? "PASS" : "LOW QUALITY"}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                      {qualityMetrics.details}
                    </p>
                  </div>
                )}

                {/* Analyse Button */}
                {selectedImage && (
                  <button
                    onClick={submitAnalysis}
                    disabled={isLoading || (qualityMetrics && !qualityMetrics.ok)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      fontSize: '0.8rem',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: (isLoading || (qualityMetrics && !qualityMetrics.ok)) ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                      opacity: (isLoading || (qualityMetrics && !qualityMetrics.ok)) ? 0.65 : 1
                    }}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={14} className="ra2-spinner" style={{ animation: 'spin 1s linear infinite' }} />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Diagnostic Food Freshness
                      </>
                    )}
                  </button>
                )}
                
                {/* Dynamic cycling loading view */}
                {isLoading && (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700, fontStyle: 'italic', animation: 'pulse 1.5s infinite' }}>
                      {loadingStep}
                    </p>
                  </div>
                )}

                {/* Error Banner */}
                {apiError && (
                  <div style={{
                    padding: '12px',
                    background: '#FCE8E6',
                    color: '#C5221F',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    border: '1px solid rgba(197, 34, 31, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span>{apiError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FRESHNESS & SAFETY RESULTS PORTAL */}
          <div style={{ width: '100%' }}>
            {currentResult ? (
              <div className="floating-card animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Header title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Identified Specimen
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {currentResult.foodName}
                    </h3>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: safetyTheme.bg.split(' ')[0],
                    color: safetyTheme.colorHex,
                    border: `1px solid ${safetyTheme.colorHex}20`
                  }}>
                    {currentResult.safetyStatus} STATUS
                  </span>
                </div>

                {/* Circular Gauge and Shelf life info */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    border: `5px solid ${safetyTheme.colorHex}15`,
                    borderTop: `5px solid ${safetyTheme.colorHex}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)', lineHeight: 1 }}>{currentResult.freshnessPercentage}%</strong>
                    <span style={{ fontSize: '0.45rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>Fresh</span>
                  </div>

                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <h4 style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Estimated Shelf-Life
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px', lineHeight: '1.4' }}>
                      ⏳ {currentResult.shelfLifeEstimate}
                    </p>
                  </div>
                </div>

                {/* Surface descriptions details */}
                <div>
                  <h4 style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Dermal & Physical Condition
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ padding: '10px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <span style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Outer Skin</span>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-primary)', marginTop: '2px', lineHeight: '1.3' }}>{currentResult.description.skin}</p>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <span style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Oxidation & Color</span>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-primary)', marginTop: '2px', lineHeight: '1.3' }}>{currentResult.description.color}</p>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <span style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Structure / Texture</span>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-primary)', marginTop: '2px', lineHeight: '1.3' }}>{currentResult.description.texture}</p>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <span style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Surface Moisture</span>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-primary)', marginTop: '2px', lineHeight: '1.3' }}>{currentResult.description.moisture}</p>
                    </div>
                  </div>
                </div>

                {/* Storage advice checklists */}
                <div>
                  <h4 style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Revival & Storage Advice
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {currentResult.storageAdvice.map((advice, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{
                          width: '14px',
                          height: '14px',
                          background: 'rgba(16,185,129,0.15)',
                          color: '#10b981',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.5rem',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>✓</span>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: '1.3' }}>{advice}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nutritional macronutrients breakdowns */}
                <div>
                  <h4 style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Estimated Nutrients Breakdown
                  </h4>
                  <div style={{ padding: '16px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Visible Portion Calories</span>
                      <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>🔥 {currentResult.macroBreakdown.calories} kcal</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* Protein */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Protein</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{currentResult.macroBreakdown.protein}g</strong>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
                          <div style={{ width: `${Math.min(100, (currentResult.macroBreakdown.protein / 20) * 100)}%`, height: '100%', background: '#3b82f6', borderRadius: '2px' }}></div>
                        </div>
                      </div>
                      
                      {/* Carbs */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Carbohydrates</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{currentResult.macroBreakdown.carbs}g</strong>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
                          <div style={{ width: `${Math.min(100, (currentResult.macroBreakdown.carbs / 80) * 100)}%`, height: '100%', background: '#f59e0b', borderRadius: '2px' }}></div>
                        </div>
                      </div>

                      {/* Fats */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Total Fats</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{currentResult.macroBreakdown.fats}g</strong>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
                          <div style={{ width: `${Math.min(100, (currentResult.macroBreakdown.fats / 20) * 100)}%`, height: '100%', background: '#ec4899', borderRadius: '2px' }}></div>
                        </div>
                      </div>

                      {/* Fiber */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Dietary Fiber</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{currentResult.macroBreakdown.fiber}g</strong>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
                          <div style={{ width: `${Math.min(100, (currentResult.macroBreakdown.fiber / 15) * 100)}%`, height: '100%', background: '#10b981', borderRadius: '2px' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '40px 24px',
                border: '1px dashed var(--border)',
                background: 'var(--surface-alt)',
                borderRadius: '24px'
              }}>
                <div>
                  <Sparkles size={32} style={{ color: 'var(--primary)', opacity: 0.5, margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Freshness Diagnostics Portal</h3>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '240px', margin: '4px auto 0' }}>
                    Select a preset or snap a picture on the left to review chemical and moisture safety assessments.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── Subscriptions pricing Checkout Modal overlay ── */}
      {isPricingOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card animate-fade-in" style={{
            maxWidth: '680px',
            width: '92%',
            padding: '24px',
            borderRadius: '24px',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-hover)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Crown size={20} style={{ color: '#fbbf24' }} /> Unlock Premium Decarbonization
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Get ultimate organic diagnostic checks & unlimited surplus coupon redemptions.</p>
              </div>
              <button
                onClick={() => setIsPricingOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                &times;
              </button>
            </div>

            {/* Toggle Billing */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: billingAnnual ? 'var(--text-secondary)' : 'var(--primary)' }}>Monthly Billing</span>
              <button
                onClick={() => setBillingAnnual(!billingAnnual)}
                style={{
                  width: '42px',
                  height: '22px',
                  borderRadius: '11px',
                  background: 'var(--primary)',
                  border: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '3px',
                  left: billingAnnual ? '23px' : '3px',
                  transition: 'left 0.2s'
                }}></div>
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: billingAnnual ? 'var(--primary)' : 'var(--text-secondary)' }}>
                Annual Billing <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 5px', borderRadius: '6px', fontSize: '0.58rem', fontWeight: 800 }}>SAVE 30%</span>
              </span>
            </div>

            {/* Pricing Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              
              {/* Card 1: Basic */}
              <div style={{
                padding: '16px',
                background: 'var(--surface-alt)',
                borderRadius: '18px',
                border: !isPremium ? '2px solid var(--primary)' : '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                position: 'relative'
              }}>
                {!isPremium && <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.55rem', background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>ACTIVE</span>}
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>Standard Basic</h4>
                <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>₹0</strong>
                <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>Default organic diagnostic limits (5 scans/day) and standard checkout.</p>
                <button
                  onClick={() => setCheckoutPlan('free')}
                  disabled={checkoutPlan !== null || !isPremium}
                  style={{
                    padding: '8px',
                    background: 'var(--border)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: (checkoutPlan || !isPremium) ? 'default' : 'pointer',
                    marginTop: 'auto'
                  }}
                >
                  {!isPremium ? 'Current Plan' : 'Downgrade'}
                </button>
              </div>

              {/* Card 2: Pro Plus */}
              <div style={{
                padding: '16px',
                background: 'var(--surface-alt)',
                borderRadius: '18px',
                border: isPremium ? '2px solid #fbbf24' : '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                position: 'relative',
                boxShadow: isPremium ? '0 0 15px rgba(251,191,36,0.1)' : 'none'
              }}>
                {isPremium && <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.55rem', background: '#fbbf24', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>LEGEND PREMIUM</span>}
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>Decarb Plus+</h4>
                <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  ₹{billingAnnual ? '119' : '179'}<span style={{ fontSize: '0.65rem', fontWeight: 500 }}>/mo</span>
                </strong>
                <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>Unlimited chemical-freshness audits, automatic CO₂ certified stats, and 10% bonus GreenCoins on checkout.</p>
                <button
                  onClick={() => setCheckoutPlan('pro')}
                  disabled={checkoutPlan !== null || isPremium}
                  style={{
                    padding: '8px',
                    background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    cursor: (checkoutPlan || isPremium) ? 'default' : 'pointer',
                    marginTop: 'auto'
                  }}
                >
                  {isPremium ? 'Active Premium' : checkoutPlan === 'pro' ? 'Upgrading...' : 'Upgrade Now'}
                </button>
              </div>

              {/* Card 3: Bulk */}
              <div style={{
                padding: '16px',
                background: 'var(--surface-alt)',
                borderRadius: '18px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>Family & Store</h4>
                <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  ₹{billingAnnual ? '239' : '349'}<span style={{ fontSize: '0.65rem', fontWeight: 500 }}>/mo</span>
                </strong>
                <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>Up to 5 accounts in one household bundle. Deep diagnostic history and direct automatic monthly food donations.</p>
                <button
                  onClick={() => setCheckoutPlan('bulk')}
                  disabled={checkoutPlan !== null}
                  style={{
                    padding: '8px',
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: checkoutPlan ? 'default' : 'pointer',
                    marginTop: 'auto'
                  }}
                >
                  {checkoutPlan === 'bulk' ? 'Processing...' : 'Choose Bundle'}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .ra2-spinner {
          display: inline-block;
        }
      `}} />
    </div>
  );
}
