
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { fetchAnalysis } from '../services/api'; // UPDATED IMPORT

// Mock SHAP data generator (Can remain client-side as it is visualization logic, or be moved to API if needed)
const generateShapData = (feature: string, impact: 'high' | 'low') => {
  return Array.from({ length: 50 }, () => ({
    x: (Math.random() - 0.5) * (impact === 'high' ? 2 : 0.5), // SHAP value
    y: Math.random() * 10, // Jitter
    featureVal: Math.random() // Color intensity
  }));
};

const FEATURES_LIST = ['Temperature', 'Wind Speed', 'Traffic Vol', 'Humidity', 'Prev Day NO2', 'Solar Rad', 'Pressure'];

export const Research: React.FC = () => {
  const [analysis, setAnalysis] = React.useState("Analyzing feature importance...");

  React.useEffect(() => {
    const fetchResearchAnalysis = async () => {
      try {
        const result = await fetchAnalysis("Explain SHAP values for NO2 pollution model. Top features: Temperature, Wind Speed.");
        setAnalysis(result);
      } catch (e) {
        setAnalysis("Analysis unavailable.");
      }
    };
    fetchResearchAnalysis();
  }, []);

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Model Interpretability</h2>
          <p className="text-muted-foreground mt-1">SHAP (SHapley Additive exPlanations) values to understand feature impact.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NO2 Model Features */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4">
          <h3 className="font-semibold mb-4 text-center border-b border-border pb-2">NO2 Model - Top Features</h3>
          <div className="flex flex-col gap-2">
            {FEATURES_LIST.map((feature, idx) => (
              <div key={idx} className="flex items-center h-12">
                <span className="w-24 text-xs font-medium text-right pr-4 truncate">{feature}</span>
                <div className="flex-1 h-full relative">
                  {/* Pseudo-Beeswarm using Scatter */}
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 0, bottom: 0 }}>
                      <XAxis type="number" dataKey="x" hide domain={[-1.5, 1.5]} />
                      <YAxis type="number" dataKey="y" hide />
                      <ZAxis type="number" dataKey="featureVal" range={[20, 20]} />
                      <Tooltip cursor={false} content={() => null} />
                      <ReferenceLine x={0} stroke="#666" strokeDasharray="3 3" />
                      <Scatter 
                        data={generateShapData(feature, idx < 3 ? 'high' : 'low')} 
                        fill="#8884d8" 
                        shape={(props: any) => {
                          const { cx, cy, payload } = props;
                          // Color gradient based on feature value (Red=High, Blue=Low)
                          const color = payload.featureVal > 0.5 ? '#ef4444' : '#3b82f6';
                          return <circle cx={cx} cy={cy} r={3} fill={color} opacity={0.6} />;
                        }}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
            <div className="flex justify-center text-xs text-muted-foreground mt-2">
              <span>← Low Impact</span>
              <span className="mx-2">|</span>
              <span>High Impact →</span>
            </div>
          </div>
        </div>

        {/* O3 Model Features */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4">
          <h3 className="font-semibold mb-4 text-center border-b border-border pb-2">O3 Model - Top Features</h3>
          <div className="flex flex-col gap-2">
            {[...FEATURES_LIST].reverse().map((feature, idx) => (
               <div key={idx} className="flex items-center h-12">
               <span className="w-24 text-xs font-medium text-right pr-4 truncate">{feature}</span>
               <div className="flex-1 h-full relative">
                 <ResponsiveContainer width="100%" height="100%">
                   <ScatterChart margin={{ top: 0, bottom: 0 }}>
                     <XAxis type="number" dataKey="x" hide domain={[-1.5, 1.5]} />
                     <YAxis type="number" dataKey="y" hide />
                     <ReferenceLine x={0} stroke="#666" strokeDasharray="3 3" />
                     <Scatter 
                       data={generateShapData(feature, idx < 2 ? 'high' : 'low')} 
                       shape={(props: any) => {
                         const { cx, cy, payload } = props;
                         const color = payload.featureVal > 0.5 ? '#ef4444' : '#3b82f6';
                         return <circle cx={cx} cy={cy} r={3} fill={color} opacity={0.6} />;
                       }}
                     />
                   </ScatterChart>
                 </ResponsiveContainer>
               </div>
             </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-accent/5 border border-accent/20 rounded-xl">
        <h4 className="font-bold text-accent mb-2">Interpretation Analysis</h4>
        <div className="prose dark:prose-invert text-sm" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>') }} />
      </div>
    </div>
  );
};
