import { Site, Model } from './types';

export const SITES: Site[] = [
  { id: 1, name: "Ashok Vihar", lat: 28.69536, lng: 77.18168, pollutionLevel: 180 },
  { id: 2, name: "Dwaraka Sector 8", lat: 28.5718, lng: 77.07125, pollutionLevel: 120 },
  { id: 3, name: "Jawaharlal Nehru Stadium", lat: 28.58278, lng: 77.23441, pollutionLevel: 150 },
  { id: 4, name: "Narela", lat: 28.82286, lng: 77.10197, pollutionLevel: 210 },
  { id: 5, name: "Okhla Phase 2", lat: 28.53077, lng: 77.27123, pollutionLevel: 230 },
  { id: 6, name: "Rohini", lat: 28.72954, lng: 77.09601, pollutionLevel: 195 },
  { id: 7, name: "Sonia Vihar", lat: 28.71052, lng: 77.24951, pollutionLevel: 160 },
];

export const MODELS: Model[] = [
  { id: 'lstm', name: 'LSTM Deep', type: 'Deep Learning', rmse: 12.4, r2: 0.89, mae: 8.2, description: "Long Short-Term Memory network optimized for temporal sequences." },
  { id: 'catboost', name: 'CatBoost Pro', type: 'Gradient Boosting', rmse: 10.1, r2: 0.92, mae: 7.5, description: "High-performance gradient boosting on decision trees." },
  { id: 'lgbm', name: 'LightGBM', type: 'Gradient Boosting', rmse: 11.2, r2: 0.90, mae: 7.9, description: "Gradient boosting framework that uses tree based learning algorithms." },
  { id: 'xgboost', name: 'XGBoost', type: 'Gradient Boosting', rmse: 11.5, r2: 0.89, mae: 8.0, description: "Scalable, portable and distributed gradient boosting library." },
  { id: 'prophet', name: 'Prophet', type: 'Statistical', rmse: 18.5, r2: 0.75, mae: 14.2, description: "Forecasting procedure based on an additive model." },
  { id: 'arima', name: 'ARIMA', type: 'Statistical', rmse: 20.1, r2: 0.70, mae: 16.5, description: "AutoRegressive Integrated Moving Average." },
  { id: 'transformer', name: 'Transformer', type: 'Deep Learning', rmse: 9.8, r2: 0.93, mae: 7.1, description: "Attention-based mechanism for capturing long-range dependencies." },
  { id: 'svr', name: 'SVR', type: 'Machine Learning', rmse: 15.2, r2: 0.82, mae: 11.0, description: "Support Vector Regression." },
];

export const POLLUTANTS = ['NO2', 'O3', 'PM2.5', 'PM10', 'SO2', 'CO'];
export const GRANULARITIES = ['1h', '6h', '1d', '1w', '1m'];

// Mock data generator for charts
export const generateChartData = (days: number) => {
  const data = [];
  const now = new Date();
  for (let i = 0; i < days * 24; i++) {
    const date = new Date(now.getTime() - (days * 24 - i) * 3600 * 1000);
    data.push({
      time: date.toISOString(),
      NO2: Math.floor(Math.random() * 50) + 20 + Math.sin(i / 10) * 10,
      O3: Math.floor(Math.random() * 40) + 10 + Math.cos(i / 12) * 15,
      predicted_NO2: Math.floor(Math.random() * 50) + 22 + Math.sin(i / 10) * 10,
      predicted_O3: Math.floor(Math.random() * 40) + 12 + Math.cos(i / 12) * 15,
    });
  }
  return data;
};
