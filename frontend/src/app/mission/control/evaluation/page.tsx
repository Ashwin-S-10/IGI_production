import { AdminEvaluationPanel } from "@/components/dashboards/admin-evaluation-panel";

export default function EvaluationPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00] mb-3">Admin Control</p>
          <h1 className="text-4xl font-bold text-white tracking-wide mb-4" style={{textShadow: "0 0 20px rgba(255, 107, 0, 0.5)"}}>
            Manual Evaluation Queue
          </h1>
          <p className="text-white/80 max-w-3xl">
            Review and score Round 1 & 2 submissions from teams. Each question is worth 0-10 points.
            Once all 10 questions for a team are evaluated, click "Update Score" to finalize their total.
          </p>
        </div>
        
        <AdminEvaluationPanel />
      </div>
    </div>
  );
}
