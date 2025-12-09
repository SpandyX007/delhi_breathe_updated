
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { SITES, MODELS, GRANULARITIES } from '../constants';
import { fetchForecastData, fetchAnalysis } from '../services/api'; // UPDATED IMPORT
import { 
  RefreshCcw, Calendar, BrainCircuit, Cloud, CloudRain, Wind, 
  Droplets, Eye, Gauge, TrendingUp, TrendingDown, AlertTriangle 
} from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Reusable Components
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
    "bg-gradient-to-br from-card to-card/80 text-card-foreground rounded-xl border border-border/70",
    "shadow-xl shadow-black/5 dark:shadow-black/20",
    "hover:shadow-2xl hover:border-accent/30 transition-all duration-300",
    "backdrop-blur-sm relative overflow-hidden",
    "before:absolute before:inset-0 before:bg-gradient-to-br before:from-accent/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:pointer-events-none",
    className
  )}>
    {children}
  </div>
);

const ControlSelect = ({ label, value, options, onChange, multiple = false }: any) => (
  <div className="flex flex-col gap-1 min-w-[120px]">
    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</label>
    <select
      value={value}
      onChange={(e) => {
        if (multiple) {
          onChange(e.target.value);
        } else {
          onChange(e.target.value);
        }
      }}
      className="bg-card border border-border rounded-lg text-sm p-2 focus:ring-2 focus:ring-accent/50 focus:border-accent/50 outline-none transition-all shadow-sm hover:shadow-md hover:border-accent/30"
    >
      {options.map((opt: any) => (
        <option key={opt.value || opt} value={opt.value || opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
  </div>
);

export const Dashboard: React.FC = () => {
  const [fromDate, setFromDate] = useState('2023-10-01');
  const [toDate, setToDate] = useState('2023-10-07');
  const [granularity, setGranularity] = useState('1h');
  const [selectedSites, setSelectedSites] = useState<number[]>([1, 2]); // IDs
  const [selectedPollutants, setSelectedPollutants] = useState<string[]>(['NO2']);
  const [selectedModels, setSelectedModels] = useState<string[]>(['lstm']);
  const [data, setData] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState("Loading analysis...");
  const [loadingData, setLoadingData] = useState(false);
  const [hoveredNO2, setHoveredNO2] = useState<any>(null);
  const [hoveredO3, setHoveredO3] = useState<any>(null);

  // Weather and AQI State
  const [currentWeather, setCurrentWeather] = useState({
    temp: 28,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    visibility: 6.5,
    pressure: 1013
  });
  
  const [currentAQI, setCurrentAQI] = useState({
    value: 187,
    category: 'Moderate',
    level: 'Poor',
    trend: 'up',
    pm25: 98,
    pm10: 156,
    no2: 45,
    o3: 32
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate slight variations in weather and AQI
      setCurrentWeather(prev => ({
        ...prev,
        temp: prev.temp + (Math.random() - 0.5) * 0.5,
        windSpeed: prev.windSpeed + (Math.random() - 0.5) * 2
      }));
      
      setCurrentAQI(prev => ({
        ...prev,
        value: Math.max(50, Math.min(300, prev.value + (Math.random() - 0.5) * 10)),
        pm25: Math.max(20, Math.min(150, prev.pm25 + (Math.random() - 0.5) * 5))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auto-Granularity Logic
  const optimizeGranularity = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 2) return '1h';
    if (diffDays <= 14) return '6h';
    return '1d';
  };

  // Update granularity when dates change (User triggers)
  const handleDateChange = (type: 'start' | 'end', val: string) => {
    if (type === 'start') {
      setFromDate(val);
      setGranularity(optimizeGranularity(val, toDate));
    } else {
      setToDate(val);
      setGranularity(optimizeGranularity(fromDate, val));
    }
  };

  // FETCH DATA EFFECT
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const result = await fetchForecastData({
          fromDate,
          toDate,
          granularity,
          sites: selectedSites
        });
        setData(result);
      } catch (e) {
        console.error("Failed to load forecast data", e);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [fromDate, toDate, granularity, selectedSites]);

  // FETCH ANALYSIS EFFECT
  useEffect(() => {
    const loadAnalysis = async () => {
      setAnalysis("Analyzing forecast data...");
      const context = `
        Sites: ${selectedSites.map(s => SITES.find(site => site.id === s)?.name).join(', ')}
        Models: ${selectedModels.join(', ')}
        Pollutants: ${selectedPollutants.join(', ')}
        Date Range: ${fromDate} to ${toDate}
        Data Trend: Fluctuating with high peaks in evening.
      `;
      try {
        const result = await fetchAnalysis(context);
        setAnalysis(result);
      } catch (e) {
        setAnalysis("Analysis unavailable.");
      }
    };
    loadAnalysis();
  }, [selectedSites, selectedModels, selectedPollutants, fromDate, toDate]);

  const toggleSite = (id: number) => {
    setSelectedSites(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Helper function to get AQI color and category
  const getAQIInfo = (aqi: number) => {
    if (aqi <= 50) return { color: 'from-green-500 to-green-600', bg: 'bg-green-500/10', text: 'text-green-600', category: 'Good', icon: '😊' };
    if (aqi <= 100) return { color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-500/10', text: 'text-yellow-600', category: 'Moderate', icon: '😐' };
    if (aqi <= 200) return { color: 'from-orange-500 to-orange-600', bg: 'bg-orange-500/10', text: 'text-orange-600', category: 'Poor', icon: '😷' };
    if (aqi <= 300) return { color: 'from-red-500 to-red-600', bg: 'bg-red-500/10', text: 'text-red-600', category: 'Very Poor', icon: '🤢' };
    return { color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/10', text: 'text-purple-600', category: 'Severe', icon: '☠️' };
  };

  const aqiInfo = getAQIInfo(currentAQI.value);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* NEW: Live Weather & AQI Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current AQI Card */}
        <Card className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Delhi Air Quality</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Real-time AQI Index</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full ring-1 ring-accent/20">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-semibold text-accent">LIVE</span>
              </div>
            </div>

            <div className="flex items-end gap-4 mb-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-bold bg-gradient-to-r ${aqiInfo.color} bg-clip-text text-transparent`}>
                    {Math.round(currentAQI.value)}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-2xl">{aqiInfo.icon}</span>
                    {currentAQI.trend === 'up' ? (
                      <TrendingUp size={16} className="text-red-500" />
                    ) : (
                      <TrendingDown size={16} className="text-green-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${aqiInfo.bg} ${aqiInfo.text}`}>
                    {aqiInfo.category}
                  </span>
                  <span className="text-xs text-muted-foreground">AQI Level</span>
                </div>
              </div>
            </div>

            {/* Pollutant Breakdown */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-card to-accent/5 p-3 rounded-lg border border-border/50">
                <div className="text-xs text-muted-foreground mb-1">PM2.5</div>
                <div className="text-lg font-bold">{Math.round(currentAQI.pm25)}</div>
                <div className="text-xs text-muted-foreground">µg/m³</div>
              </div>
              <div className="bg-gradient-to-br from-card to-accent/5 p-3 rounded-lg border border-border/50">
                <div className="text-xs text-muted-foreground mb-1">PM10</div>
                <div className="text-lg font-bold">{Math.round(currentAQI.pm10)}</div>
                <div className="text-xs text-muted-foreground">µg/m³</div>
              </div>
              <div className="bg-gradient-to-br from-card to-accent/5 p-3 rounded-lg border border-border/50">
                <div className="text-xs text-muted-foreground mb-1">NO₂</div>
                <div className="text-lg font-bold">{currentAQI.no2}</div>
                <div className="text-xs text-muted-foreground">µg/m³</div>
              </div>
              <div className="bg-gradient-to-br from-card to-accent/5 p-3 rounded-lg border border-border/50">
                <div className="text-xs text-muted-foreground mb-1">O₃</div>
                <div className="text-lg font-bold">{currentAQI.o3}</div>
                <div className="text-xs text-muted-foreground">µg/m³</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Current Weather Card */}
        <Card className="p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Weather Conditions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">New Delhi, India</p>
              </div>
              <Cloud size={24} className="text-accent" />
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    {Math.round(currentWeather.temp)}
                  </span>
                  <span className="text-3xl text-muted-foreground">°C</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-medium text-foreground">{currentWeather.condition}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Feels like</div>
                <div className="text-2xl font-semibold">{Math.round(currentWeather.temp - 2)}°</div>
              </div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-card to-blue-500/5 p-3 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets size={14} className="text-blue-500" />
                  <span className="text-xs text-muted-foreground">Humidity</span>
                </div>
                <div className="text-lg font-bold">{currentWeather.humidity}%</div>
              </div>
              <div className="bg-gradient-to-br from-card to-blue-500/5 p-3 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Wind size={14} className="text-cyan-500" />
                  <span className="text-xs text-muted-foreground">Wind</span>
                </div>
                <div className="text-lg font-bold">{Math.round(currentWeather.windSpeed)} km/h</div>
              </div>
              <div className="bg-gradient-to-br from-card to-blue-500/5 p-3 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={14} className="text-teal-500" />
                  <span className="text-xs text-muted-foreground">Visibility</span>
                </div>
                <div className="text-lg font-bold">{currentWeather.visibility.toFixed(1)} km</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 1. Map Section */}
      <Card className="h-[400px] relative overflow-hidden flex flex-col">
        <div className="absolute top-4 right-4 z-[400] bg-card/90 backdrop-blur p-2 rounded-lg border border-border shadow-lg">
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1">Live Heatmap</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>High: Okhla Ph-2</span>
          </div>
        </div>
        <MapContainer center={[28.6448, 77.2167]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {SITES.map(site => (
            <CircleMarker
              key={site.id}
              center={[site.lat, site.lng]}
              pathOptions={{
                color: 'transparent',
                fillColor: site.pollutionLevel > 200 ? '#ef4444' : site.pollutionLevel > 150 ? '#f97316' : '#22c55e',
                fillOpacity: 0.6
              }}
              radius={site.pollutionLevel / 10}
            >
              <Popup className="custom-popup">
                <div className="text-sm font-bold">{site.name}</div>
                <div className="text-xs">AQI: {site.pollutionLevel}</div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </Card>

      {/* 2. Controls Toolbar (Sticky) */}
      <div className="sticky top-0 z-10 p-4 bg-gradient-to-r from-card/95 via-card/95 to-accent/5 backdrop-blur-xl border-b border-border/70 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 flex flex-wrap gap-4 items-end shadow-xl">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Range</label>
          <div className="flex items-center gap-2 bg-gradient-to-r from-card to-card/80 border border-border rounded-lg p-2 shadow-md hover:shadow-lg hover:border-accent/30 transition-all">
            <Calendar size={14} className="text-accent ml-1" />
            <input type="date" value={fromDate} onChange={(e) => handleDateChange('start', e.target.value)} className="bg-transparent text-sm w-24 outline-none" />
            <span className="text-muted-foreground">-</span>
            <input type="date" value={toDate} onChange={(e) => handleDateChange('end', e.target.value)} className="bg-transparent text-sm w-24 outline-none" />
          </div>
        </div>

        <ControlSelect
          label="Granularity"
          value={granularity}
          options={GRANULARITIES}
          onChange={setGranularity}
        />

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Sites (Max 4)</label>
          <div className="dropdown relative group">
            <button className="bg-muted/30 border border-input rounded text-sm px-3 py-1.5 w-40 text-left truncate hover:bg-muted/50 transition">
              {selectedSites.length} selected
            </button>
            <div className="hidden group-hover:block absolute top-full left-0 w-56 bg-card border border-border shadow-xl rounded mt-1 p-2 z-50 max-h-60 overflow-y-auto">
              {SITES.map(site => (
                <label key={site.id} className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={selectedSites.includes(site.id)}
                    onChange={() => toggleSite(site.id)}
                    className="rounded border-input text-accent focus:ring-accent"
                  />
                  {site.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <ControlSelect
          label="Models (Max 2)"
          value={selectedModels[0]}
          options={MODELS.map(m => ({ value: m.id, label: m.name }))}
          onChange={(val: string) => setSelectedModels([val])}
        />

        <button className="ml-auto bg-gradient-to-r from-accent via-blue-500 to-accent hover:shadow-2xl hover:shadow-accent/30 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg transition-all flex items-center gap-2 hover:scale-105 active:scale-95 ring-2 ring-accent/20">
          <RefreshCcw size={14} className={loadingData ? "animate-spin" : ""} /> Update Forecasts
        </button>
      </div>

      {/* 3. Forecast Charts */}
      {/* Chart 1: NO2 */}
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full shadow-sm"></span>
            NO2 Concentration Forecast (µg/m³)
          </h3>
          <span className="text-xs font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border/50 shadow-sm">Model: {MODELS.find(m => m.id === selectedModels[0])?.name}</span>
        </div>
        <div className="h-[450px] w-full">
          {loadingData ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading Data...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                onMouseMove={(e) => {
                  if (e.activePayload) setHoveredNO2(e.activePayload[0].payload);
                }}
                onMouseLeave={() => setHoveredNO2(null)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={true} horizontal={true} />
                <XAxis
                  dataKey="time"
                  tickFormatter={(t) => new Date(t).toLocaleDateString()}
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '4px' }}
                  cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                {hoveredNO2 && (
                  <ReferenceLine y={hoveredNO2.NO2} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
                )}
                <Line type="monotone" dataKey="NO2" name="Actual (Avg)" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="predicted_NO2" name="Predicted (Avg)" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Chart 2: O3 */}
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full shadow-sm"></span>
            O3 Concentration Forecast (µg/m³)
          </h3>
          <span className="text-xs font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border/50 shadow-sm">Model: {MODELS.find(m => m.id === selectedModels[0])?.name}</span>
        </div>
        <div className="h-[450px] w-full">
          {loadingData ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading Data...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                onMouseMove={(e) => {
                  if (e.activePayload) setHoveredO3(e.activePayload[0].payload);
                }}
                onMouseLeave={() => setHoveredO3(null)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={true} horizontal={true} />
                <XAxis
                  dataKey="time"
                  tickFormatter={(t) => new Date(t).toLocaleDateString()}
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                  cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                {hoveredO3 && (
                  <ReferenceLine y={hoveredO3.O3} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
                )}
                <Line type="monotone" dataKey="O3" name="Actual (Avg)" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="predicted_O3" name="Predicted (Avg)" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* 4. Analysis Box */}
      <Card className="p-6 bg-gradient-to-br from-card via-accent/5 to-card border-l-4 border-l-accent shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-accent via-blue-500 to-accent/80 rounded-xl text-white shadow-lg shadow-accent/30 ring-2 ring-accent/20">
            <BrainCircuit size={24} />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-foreground via-accent to-blue-600 bg-clip-text text-transparent">AI Insight & Analysis</h3>
        </div>
        <div className="prose dark:prose-invert prose-sm max-w-none">
          {analysis === "Loading analysis..." || analysis === "Analyzing forecast data..." ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              Thinking...
            </div>
          ) : (
            <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          )}
        </div>
      </Card>
    </div>
  );
};
