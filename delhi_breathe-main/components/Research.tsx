import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { fetchAnalysis } from "../services/api"; // UPDATED IMPORT

// Mock SHAP data generator with importance values
const generateFeatureImportance = () => {
  return [
    { feature: "Temperature", importance: 0.28, impact: "high" },
    { feature: "Wind Speed", importance: 0.22, impact: "high" },
    { feature: "Traffic Vol", importance: 0.18, impact: "high" },
    { feature: "Humidity", importance: 0.14, impact: "medium" },
    { feature: "Prev Day NO2", importance: 0.11, impact: "medium" },
    { feature: "Solar Rad", importance: 0.05, impact: "low" },
    { feature: "Pressure", importance: 0.02, impact: "low" },
  ];
};

const FEATURES_LIST = [
  "Temperature",
  "Wind Speed",
  "Traffic Vol",
  "Humidity",
  "Prev Day NO2",
  "Solar Rad",
  "Pressure",
];

export const Research: React.FC = () => {
  const [analysis, setAnalysis] = React.useState(
    "Analyzing feature importance..."
  );
  const [graphType, setGraphType] = React.useState<"bar" | "line" | "radar">(
    "bar"
  );

  React.useEffect(() => {
    const fetchResearchAnalysis = async () => {
      try {
        const result = await fetchAnalysis(
          "Explain SHAP values for NO2 pollution model. Top features: Temperature, Wind Speed."
        );
        setAnalysis(result);
      } catch (e) {
        setAnalysis("Analysis unavailable.");
      }
    };
    fetchResearchAnalysis();
  }, []);

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex justify-between items-end border-b border-border/70 pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-accent to-blue-600 bg-clip-text text-transparent">
            Model Interpretability
          </h2>
          <p className="text-muted-foreground mt-1">
            SHAP (SHapley Additive exPlanations) values to understand feature
            impact.
          </p>
        </div>

        {/* Graph Type Dropdown */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Visualization Type
          </label>
          <select
            value={graphType}
            onChange={(e) =>
              setGraphType(e.target.value as "bar" | "line" | "radar")
            }
            className="bg-card border border-input rounded-lg text-sm p-2 focus:ring-2 focus:ring-accent focus:border-accent/50 outline-none shadow-sm hover:shadow-md transition-all"
          >
            <option value="bar">Horizontal Bar</option>
            <option value="line">Line Chart</option>
            <option value="radar">Radar Chart</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NO2 Model Features */}
        <div className="bg-gradient-to-br from-card via-card to-accent/5 rounded-xl border border-border/70 shadow-xl hover:shadow-2xl transition-all p-6 backdrop-blur-sm">
          <h3 className="font-semibold mb-6 text-lg border-b border-border/70 pb-3 bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
            NO2 Model - Feature Importance
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            {graphType === "bar" && (
              <BarChart
                data={generateFeatureImportance()}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  opacity={0.3}
                  vertical={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 0.3]}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <YAxis
                  dataKey="feature"
                  type="category"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  width={115}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  formatter={(value) => [
                    (value * 100).toFixed(1) + "%",
                    "Importance",
                  ]}
                />
                <Bar dataKey="importance" radius={[0, 8, 8, 0]}>
                  {generateFeatureImportance().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.impact === "high"
                          ? "#3b82f6"
                          : entry.impact === "medium"
                          ? "#8b5cf6"
                          : "#ef4444"
                      }
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
            {graphType === "line" && (
              <LineChart data={generateFeatureImportance()}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  opacity={0.3}
                />
                <XAxis dataKey="feature" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [
                    (value * 100).toFixed(1) + "%",
                    "Importance",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="importance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 5 }}
                />
              </LineChart>
            )}
            {graphType === "radar" && (
              <RadarChart data={generateFeatureImportance()}>
                <PolarGrid strokeDasharray="3 3" stroke="var(--border)" />
                <PolarAngleAxis dataKey="feature" fontSize={10} />
                <PolarRadiusAxis
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                />
                <Radar
                  name="Importance"
                  dataKey="importance"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [
                    (value * 100).toFixed(1) + "%",
                    "Importance",
                  ]}
                />
              </RadarChart>
            )}
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>High Impact</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span>Medium Impact</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>Low Impact</span>
            </div>
          </div>
        </div>

        {/* O3 Model Features */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-semibold mb-6 text-lg border-b border-border pb-3">
            O3 Model - Feature Importance
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            {graphType === "bar" && (
              <BarChart
                data={[...generateFeatureImportance()].reverse()}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  opacity={0.3}
                  vertical={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 0.3]}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <YAxis
                  dataKey="feature"
                  type="category"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  width={115}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  formatter={(value) => [
                    (value * 100).toFixed(1) + "%",
                    "Importance",
                  ]}
                />
                <Bar dataKey="importance" radius={[0, 8, 8, 0]}>
                  {[...generateFeatureImportance()]
                    .reverse()
                    .map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.impact === "high"
                            ? "#10b981"
                            : entry.impact === "medium"
                            ? "#f59e0b"
                            : "#6b7280"
                        }
                        opacity={0.8}
                      />
                    ))}
                </Bar>
              </BarChart>
            )}
            {graphType === "line" && (
              <LineChart data={[...generateFeatureImportance()].reverse()}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  opacity={0.3}
                />
                <XAxis dataKey="feature" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [
                    (value * 100).toFixed(1) + "%",
                    "Importance",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="importance"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 5 }}
                />
              </LineChart>
            )}
            {graphType === "radar" && (
              <RadarChart data={[...generateFeatureImportance()].reverse()}>
                <PolarGrid strokeDasharray="3 3" stroke="var(--border)" />
                <PolarAngleAxis dataKey="feature" fontSize={10} />
                <PolarRadiusAxis
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                />
                <Radar
                  name="Importance"
                  dataKey="importance"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [
                    (value * 100).toFixed(1) + "%",
                    "Importance",
                  ]}
                />
              </RadarChart>
            )}
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500"></div>
              <span>High Impact</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500"></div>
              <span>Medium Impact</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-500"></div>
              <span>Low Impact</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-accent/5 border border-accent/20 rounded-xl">
        <h4 className="font-bold text-accent mb-2">Interpretation Analysis</h4>
        <div
          className="prose dark:prose-invert prose-sm max-w-none text-sm"
          dangerouslySetInnerHTML={{
            __html: analysis
              .replace(/\n/g, "<br/>")
              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
              .replace(/\*(.*?)\*/g, "<em>$1</em>")
              .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
              .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
              .replace(/^#+\s+(.+)$/gm, (match, p1, offset, str) => {
                const level = match.match(/^#+/)[0].length;
                return `<h${level} class="font-bold mt-3 mb-2">${p1}</h${level}>`;
              }),
          }}
        />
      </div>
    </div>
  );
};
