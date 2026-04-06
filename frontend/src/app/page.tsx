"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TranscriptInput from "@/components/TranscriptInput";
import TaskTable from "@/components/TaskTable";
import { useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"new" | "archive">("new");
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  return (
    <main className="flex min-h-screen" style={{ background: 'var(--sw-bg)' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-y-auto sw-mesh-bg">
        <div className="max-w-6xl mx-auto px-8 lg:px-12 py-10">
          {/* Header */}
          <header className="mb-10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--sw-indigo-subtle)' }}
                >
                  <Zap className="w-3.5 h-3.5" style={{ color: 'var(--sw-indigo)' }} />
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--sw-indigo)' }}
                >
                  {activeTab === "new" ? "New Execution" : "Task Archive"}
                </span>
              </div>
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{ color: 'var(--sw-text-1)', fontFamily: 'var(--font-dm-sans)' }}
              >
                {activeTab === "new"
                  ? "Process Meeting Transcript"
                  : "Task Archive & Analysis"}
              </h2>
              <p className="text-sm mt-1.5 font-normal" style={{ color: 'var(--sw-text-2)' }}>
                {activeTab === "new"
                  ? "Paste or upload a transcript to extract tasks, send emails, and create calendar events."
                  : "Search, filter, and manage all extracted tasks from past meetings."}
              </p>
            </div>
          </header>

          {/* Content */}
          <section>
            {activeTab === "new" ? (
              <TranscriptInput onSuccess={handleSuccess} />
            ) : (
              <TaskTable />
            )}
          </section>

          {/* Footer */}
          <footer
            className="mt-20 pt-8 pb-4 flex items-center justify-between text-xs font-medium border-t"
            style={{ borderColor: 'var(--sw-border)', color: 'var(--sw-text-3)' }}
          >
            <p>© 2026 SyncWire MCP. All rights reserved.</p>
            <p>Powered by SambaNova · Meta-Llama 3.3 70B</p>
          </footer>
        </div>
      </div>
    </main>
  );
}
