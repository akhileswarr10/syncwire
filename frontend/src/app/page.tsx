"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TranscriptInput from "@/components/TranscriptInput";
import TaskTable from "@/components/TaskTable";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"new" | "archive">("new");
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  return (
    <main className="flex min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-y-auto px-8 lg:px-12 py-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
              {activeTab === "new"
                ? "Create New Execution"
                : "Task Archive Analysis"}
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              {activeTab === "new"
                ? "Paste your transcript to extract tasks and trigger notifications."
                : "Monitor and search all tasks identified in past meetings."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                  U{i}
                </div>
              ))}
            </div> */}
          </div>
        </header>

        <section className="max-w-6xl">
          {activeTab === "new" ? (
            <TranscriptInput onSuccess={handleSuccess} />
          ) : (
            <TaskTable />
          )}
        </section>

        <footer className="mt-20 border-t border-slate-900 pt-8 pb-4 flex items-center justify-between text-slate-600 text-xs font-medium">
          <p>© 2026 SyncWire MCP. All rights reserved.</p>
          {/* <div className="flex items-center gap-6">
            <a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">API Keys</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Status</a>
          </div> */}
        </footer>
      </div>
    </main>
  );
}
