import React, { useState } from "react";
import { MODELS } from "../constants";
import { Model } from "../types";
import { Activity, GitBranch, Terminal, Play, X } from "lucide-react";

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
        {MODELS.map((model) => (
          <div
            key={model.id}
            onClick={() => setSelectedModel(model)}
            className="group bg-card border border-border rounded-xl p-5 hover:border-accent hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
              <Play size={40} className="text-accent" />
            </div>
            <div className="mb-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                {model.type}
              </span>
              <h3 className="text-xl font-bold mt-1 group-hover:text-accent transition-colors">
                {model.name}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <div className="text-xs text-muted-foreground">RMSE</div>
                <div className="text-lg font-mono font-bold">{model.rmse}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">R² Score</div>
                <div className="text-lg font-mono font-bold text-green-500">
                  {model.r2}
                </div>
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
                <span className="text-xs text-muted-foreground">
                  Learning Rate
                </span>
                <input
                  type="number"
                  defaultValue={0.01}
                  step={0.01}
                  className="w-full bg-muted border border-input rounded p-2 text-sm mt-1"
                />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Max Depth</span>
                <input
                  type="number"
                  defaultValue={6}
                  className="w-full bg-muted border border-input rounded p-2 text-sm mt-1"
                />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Num Leaves
                </span>
                <input
                  type="number"
                  defaultValue={31}
                  className="w-full bg-muted border border-input rounded p-2 text-sm mt-1"
                />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Bagging Fraction
                </span>
                <input
                  type="number"
                  defaultValue={0.8}
                  step={0.1}
                  className="w-full bg-muted border border-input rounded p-2 text-sm mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <div className="bg-black/90 text-green-400 font-mono text-xs p-4 rounded h-32 mb-4 overflow-y-auto">
              {">"} Initializing training environment...
              <br />
              {">"} Allocating GPU resources...
              <br />
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setSelectedModel(null)}
        >
          <div
            className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border p-8 relative my-8 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedModel(null)}
              className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">{selectedModel.name}</h2>
              <span className="text-sm text-accent font-medium bg-accent/10 px-3 py-1 rounded-full">
                {selectedModel.type}
              </span>
            </div>

            <p className="text-muted-foreground mb-6 text-base">
              {selectedModel.description}
            </p>

            {/* Performance Metrics */}
            <div className="mt-6 grid grid-cols-4 gap-3 border-t border-b border-border py-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{selectedModel.rmse}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  RMSE
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {selectedModel.r2}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  R² Score
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{selectedModel.mae}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  MAE
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {selectedModel.performance?.accuracy}%
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Accuracy
                </div>
              </div>
            </div>

            {/* Specifications */}
            {selectedModel.specifications && (
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-3 text-accent">
                  Specifications
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
                  {selectedModel.specifications.architecture && (
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        Architecture
                      </span>
                      <ul className="mt-2 space-y-1">
                        {selectedModel.specifications.architecture.map(
                          (item, i) => (
                            <li
                              key={i}
                              className="text-sm flex items-center gap-2"
                            >
                              <span className="w-1 h-1 bg-accent rounded-full"></span>
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                  <div>
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        Parameters
                      </span>
                      <p className="text-sm font-mono mt-1">
                        {selectedModel.specifications.parameters?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        Input Features
                      </span>
                      <p className="text-sm font-mono mt-1">
                        {selectedModel.specifications.inputFeatures}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Procedures */}
            {selectedModel.procedures && (
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-3 text-accent">
                  Training Procedures
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedModel.procedures.preprocessing && (
                    <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                      <span className="text-xs font-semibold text-blue-400 uppercase">
                        Preprocessing
                      </span>
                      <ul className="mt-2 space-y-1">
                        {selectedModel.procedures.preprocessing.map(
                          (item, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground"
                            >
                              • {item}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                  {selectedModel.procedures.training && (
                    <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                      <span className="text-xs font-semibold text-purple-400 uppercase">
                        Training
                      </span>
                      <ul className="mt-2 space-y-1">
                        {selectedModel.procedures.training.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedModel.procedures.validation && (
                    <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                      <span className="text-xs font-semibold text-green-400 uppercase">
                        Validation
                      </span>
                      <ul className="mt-2 space-y-1">
                        {selectedModel.procedures.validation.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedModel.procedures.optimization && (
                    <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
                      <span className="text-xs font-semibold text-orange-400 uppercase">
                        Optimization
                      </span>
                      <ul className="mt-2 space-y-1">
                        {selectedModel.procedures.optimization.map(
                          (item, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground"
                            >
                              • {item}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key Ideas & Insights */}
            {selectedModel.ideas && (
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-3 text-accent">
                  Key Insights & Analysis
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedModel.ideas.strengths && (
                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <span className="text-xs font-semibold text-green-400 uppercase">
                        ✓ Strengths
                      </span>
                      <ul className="mt-2 space-y-1">
                        {selectedModel.ideas.strengths.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedModel.ideas.limitations && (
                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <span className="text-xs font-semibold text-red-400 uppercase">
                        ⚠ Limitations
                      </span>
                      <ul className="mt-2 space-y-1">
                        {selectedModel.ideas.limitations.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedModel.ideas.bestUseCases && (
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 col-span-2">
                      <span className="text-xs font-semibold text-blue-400 uppercase">
                        Best Use Cases
                      </span>
                      <ul className="mt-2 space-y-1">
                        {selectedModel.ideas.bestUseCases.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Benchmarks */}
            {selectedModel.performance && (
              <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-border">
                <h3 className="font-bold text-sm mb-3 text-muted-foreground uppercase">
                  Performance Benchmarks
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Training Time
                    </span>
                    <p className="font-mono font-semibold mt-1">
                      {selectedModel.performance.trainingTime}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Inference Time
                    </span>
                    <p className="font-mono font-semibold mt-1">
                      {selectedModel.performance.inferenceTime}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Memory Usage
                    </span>
                    <p className="font-mono font-semibold mt-1">
                      {selectedModel.performance.memoryUsage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button className="flex-1 bg-accent text-accent-foreground py-2.5 rounded-lg text-sm font-medium hover:brightness-110 transition-all">
                Download Weights
              </button>
              <button className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-lg text-sm font-medium transition-all">
                View Architecture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
