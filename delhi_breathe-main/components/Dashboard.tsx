
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { SITES, MODELS, GRANULARITIES } from '../constants';
import { fetchForecastData, fetchAnalysis } from '../services/api'; // UPDATED IMPORT
import { RefreshCcw, Calendar, BrainCircuit } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Reusable Components
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
    "bg-card text-card-foreground rounded-xl border border-border/50",
    "shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50",
    "hover:shadow-xl transition-shadow duration-300",
    "backdrop-blur-sm",
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
      className="bg-card border border-border rounded-lg text-sm p-2 focus:ring-2 focus:ring-accent/50 outline-none transition-all shadow-sm hover:shadow"
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

  return (
    <div className="flex flex-col gap-6 h-full">
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
      <div className="sticky top-0 z-10 p-4 bg-card/95 backdrop-blur-md border-b border-border/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 flex flex-wrap gap-4 items-end shadow-lg">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Range</label>
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-2 shadow-sm hover:shadow transition-shadow">
            <Calendar size={14} className="text-accent ml-1" />
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-transparent text-sm w-24 outline-none" />
            <span className="text-muted-foreground">-</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-transparent text-sm w-24 outline-none" />
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

        <button className="ml-auto bg-gradient-to-r from-accent to-teal-600 hover:shadow-xl text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg transition-all flex items-center gap-2 hover:scale-105 active:scale-95">
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
        <div className="h-[300px] w-full">
          {loadingData ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading Data...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="time"
                  tickFormatter={(t) => new Date(t).toLocaleDateString()}
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '4px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="NO2" name="Actual (Avg)" stroke="#64748b" strokeWidth={1} dot={false} strokeDasharray="5 5" />
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
        <div className="h-[300px] w-full">
          {loadingData ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading Data...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="time"
                  tickFormatter={(t) => new Date(t).toLocaleDateString()}
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="O3" name="Actual (Avg)" stroke="#64748b" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="predicted_O3" name="Predicted (Avg)" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* 4. Analysis Box */}
      <Card className="p-6 bg-gradient-to-br from-card via-card to-accent/5 border-l-4 border-l-accent shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-accent to-teal-600 rounded-xl text-white shadow-lg">
            <BrainCircuit size={24} />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">AI Insight & Analysis</h3>
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
