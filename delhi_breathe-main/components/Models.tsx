import React, { useState } from 'react';
import { MODELS } from '../constants';
import { Model } from '../types';
import { Activity, GitBranch, Terminal, Play, X } from 'lucide-react';

export const Models: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Model Zoo</h2>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:opacity-90">
          Compare All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MODELS.map(model => (
          <div 
            key={model.id}
            onClick={() => setSelectedModel(model)}
            className="group bg-card border border-border rounded-xl p-5 hover:border-accent hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
               <Play size={40} className="text-accent" />
             </div>
             <div className="mb-4">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{model.type}</span>
                <h3 className="text-xl font-bold mt-1 group-hover:text-accent transition-colors">{model.name}</h3>
             </div>
             <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                   <div className="text-xs text-muted-foreground">RMSE</div>
                   <div className="text-lg font-mono font-bold">{model.rmse}</div>
                </div>
                <div>
                   <div className="text-xs text-muted-foreground">R² Score</div>
                   <div className="text-lg font-mono font-bold text-green-500">{model.r2}</div>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Model Request / Builder Section */}
      <div className="mt-10 bg-card border border-border rounded-xl p-8 shadow-inner">
        <div className="flex items-center gap-3 mb-6">
          <Terminal size={24} className="text-accent" />
          <h3 className="text-2xl font-bold">Request Custom GBM Model</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="space-y-4">
              <label className="block text-sm font-medium">Architecture</label>
              <select className="w-full bg-muted border border-input rounded p-2 text-sm focus:ring-1 focus:ring-accent outline-none">
                 <option>Gradient Boosting Machine (GBM)</option>
                 <option>XGBoost (DART)</option>
                 <option>LightGBM (GOSS)</option>
              </select>
              
              <label className="block text-sm font-medium">Loss Function</label>
              <select className="w-full bg-muted border border-input rounded p-2 text-sm focus:ring-1 focus:ring-accent outline-none">
                 <option>RMSE</option>
                 <option>Huber Loss</option>
                 <option>Quantile</option>
              </select>
           </div>
           
           <div className="space-y-4">
              <label className="block text-sm font-medium">Hyperparameters</label>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <span className="text-xs text-muted-foreground">Learning Rate</span>
                    <input type="number" defaultValue={0.01} step={0.01} className="w-full bg-muted border border-input rounded p-2 text-sm mt-1" />
                 </div>
                 <div>
                    <span className="text-xs text-muted-foreground">Max Depth</span>
                    <input type="number" defaultValue={6} className="w-full bg-muted border border-input rounded p-2 text-sm mt-1" />
                 </div>
                 <div>
                    <span className="text-xs text-muted-foreground">Num Leaves</span>
                    <input type="number" defaultValue={31} className="w-full bg-muted border border-input rounded p-2 text-sm mt-1" />
                 </div>
                 <div>
                    <span className="text-xs text-muted-foreground">Bagging Fraction</span>
                    <input type="number" defaultValue={0.8} step={0.1} className="w-full bg-muted border border-input rounded p-2 text-sm mt-1" />
                 </div>
              </div>
           </div>
           
           <div className="flex flex-col justify-end">
              <div className="bg-black/90 text-green-400 font-mono text-xs p-4 rounded h-32 mb-4 overflow-y-auto">
                 {'>'} Initializing training environment...<br/>
                 {'>'} Allocating GPU resources...<br/>
                 <span className="animate-pulse">_</span>
              </div>
              <button className="w-full bg-accent text-accent-foreground py-2 rounded font-medium hover:brightness-110 transition-all">
                Submit Training Request
              </button>
           </div>
        </div>
      </div>

      {/* Model Detail Popup */}
      {selectedModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-6 relative animate-in fade-in zoom-in duration-200">
             <button 
               onClick={() => setSelectedModel(null)}
               className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full"
             >
               <X size={20} />
             </button>
             
             <h2 className="text-2xl font-bold mb-1">{selectedModel.name}</h2>
             <span className="text-sm text-accent font-medium bg-accent/10 px-2 py-1 rounded">{selectedModel.type}</span>
             
             <p className="mt-4 text-muted-foreground">{selectedModel.description}</p>
             
             <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
                <div className="text-center">
                   <div className="text-3xl font-bold">{selectedModel.rmse}</div>
                   <div className="text-xs text-muted-foreground uppercase tracking-wider">RMSE</div>
                </div>
                <div className="text-center">
                   <div className="text-3xl font-bold text-green-500">{selectedModel.r2}</div>
                   <div className="text-xs text-muted-foreground uppercase tracking-wider">R² Score</div>
                </div>
                <div className="text-center">
                   <div className="text-3xl font-bold">{selectedModel.mae}</div>
                   <div className="text-xs text-muted-foreground uppercase tracking-wider">MAE</div>
                </div>
             </div>
             
             <div className="mt-6 flex gap-2">
                <button className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium">
                   Download Weights
                </button>
                <button className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-lg text-sm font-medium">
                   View Architecture
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
