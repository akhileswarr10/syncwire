'use client';

import { PlusCircle, Archive, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
    activeTab: 'new' | 'archive';
    setActiveTab: (tab: 'new' | 'archive') => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const tabs = [
        { id: 'new', label: 'New Meeting', icon: PlusCircle },
        { id: 'archive', label: 'Task Archive', icon: Archive },
    ];

    return (
        <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col h-screen">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">SyncWire</h1>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-indigo-600/10 text-indigo-400 font-medium"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                            )}
                        >
                            <Icon className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                            )} />
                            {tab.label}
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20">
                    <p className="text-xs font-medium text-indigo-300 mb-1">MCP Powered</p>
                    <p className="text-[10px] text-indigo-300/60 leading-relaxed">
                        Smart meeting execution with Gmail & Calendar integration.
                    </p>
                </div>
            </div>
        </div>
    );
}
