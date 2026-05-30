export interface FoodDescription {
  skin: string;
  color: string;
  texture: string;
  moisture: string;
}

export interface MacroBreakdown {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sodium: number; // in mg
}

export interface FoodAnalysisResult {
  foodName: string;
  confidence: number;
  freshnessPercentage: number;
  safetyStatus: 'Safe' | 'Caution' | 'Unsafe' | string;
  shelfLifeEstimate: string;
  description: FoodDescription;
  storageAdvice: string[];
  macroBreakdown: MacroBreakdown;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  image: string; // Base64 representation or mockup URL
  result: FoodAnalysisResult;
}

export interface QualityValidationResult {
  brightness: number;
  contrast: number;
  tooDark: boolean;
  tooBright: boolean;
  isBlurry: boolean;
  score: number; // 0 to 100 overall image quality score
  ok: boolean;
  details: string;
}
