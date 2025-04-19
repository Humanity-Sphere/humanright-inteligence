// Interface für einzelne Faktorvorhersage
export interface FactorPrediction {
  factorId: number;
  factorName: string;
  predictedValue: number;
  confidence: number;
  trend: string;
  trendMagnitude: number;
}