import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

function scoreColor(score) {
  if (score >= 80) return "#10B981";
  if (score >= 50) return "#F59E0B";
  if (score >= 30) return "#F97316";
  return "#EF4444";
}

const LABELS = {
  ocr_confidence_score: "OCR Confidence",
  tribal_status_score: "Tribal Status",
  dc_permission_score: "DC Permission",
  forest_risk_score: "Forest Check",
  mutation_history_score: "Mutation History",
  khatiyan_age_score: "Khatiyan Age",
  chain_of_title_score: "Chain of Title",
};

export default function RiskBreakdownChart({ assessment }) {
  if (!assessment) return null;

  const data = Object.entries(LABELS).map(([key, label]) => ({
    name: label,
    score: assessment[key] ?? 0,
  }));

  return (
    <div className="bg-bg-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Risk Breakdown</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" fontSize={12} />
          <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={12} width={120} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((entry, i) => (
              <Cell key={i} fill={scoreColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
