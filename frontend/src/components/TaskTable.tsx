'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle,
    AlertCircle,
    Clock,
    Search,
    User,
    Calendar,
    ExternalLink,
    Filter,
    Archive,
    LayoutDashboard,
    Loader2,
    FileText,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
    id: number;
    meeting_id: number;
    meeting_title: string;
    meeting_transcript?: string;
    assignee_email: string;
    description: string;
    detailed_context: string;
    deadline: string;
    task_status: 'pending' | 'in_progress' | 'completed' | 'extension_requested' | 'extended';
    email_status: 'pending' | 'sent' | 'failed';
    reason_for_delay?: string;
    requested_deadline?: string;
}

export default function TaskTable() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'extension_requested'>('all');
    const [approvingId, setApprovingId] = useState<number | null>(null);
    const [selectedTranscript, setSelectedTranscript] = useState<{title: string, content: string | undefined} | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<Task | null>(null);
    const queryClient = useQueryClient();

    const { data: tasks, isLoading, error } = useQuery<Task[]>({
        queryKey: ['tasks'],
        queryFn: async () => {
            const response = await fetch('http://localhost:5000/api/tasks');
            if (!response.ok) throw new Error('Failed to fetch tasks');
            return response.json();
        },
        refetchInterval: 10000,
    });

    const handleApprove = async (taskId: number) => {
        setApprovingId(taskId);
        try {
            const res = await fetch('http://localhost:5000/api/tasks/approve-extension', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId })
            });
            if (res.ok) {
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
            }
        } catch (err) {
            console.error('Approval failed:', err);
        } finally {
            setApprovingId(null);
        }
    };

    const filteredTasks = tasks?.filter(task => {
        const matchesSearch =
            task.description.toLowerCase().includes(search.toLowerCase()) ||
            task.assignee_email.toLowerCase().includes(search.toLowerCase()) ||
            task.meeting_title.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'all' || task.task_status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Loading your tasks...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/20 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-200 mb-2">Connection Error</h3>
                <p className="text-slate-500 mb-6">Make sure the SyncWire backend is running on port 5000.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 transition-colors"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search tasks, assignees, or meetings..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    />
                </div>

                <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-full md:w-auto">
                    {(['all', 'pending', 'completed', 'extension_requested'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "px-4 py-2 text-sm font-semibold rounded-xl transition-all capitalize whitespace-nowrap",
                                statusFilter === s
                                    ? "bg-slate-800 text-indigo-400 shadow-sm"
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {s === 'extension_requested' ? 'Requests' : s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {filteredTasks?.length === 0 ? (
                    <div className="p-12 text-center bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl">
                        <Archive className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No tasks found matching your filters.</p>
                    </div>
                ) : (
                    filteredTasks?.map((task) => (
                        <div
                            key={task.id}
                            className="group bg-slate-900/50 border border-slate-800 p-6 rounded-3xl hover:border-indigo-500/30 hover:bg-slate-900 transition-all duration-300"
                        >
                            {task.task_status === 'extension_requested' && (
                                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                    <h4 className="flex items-center gap-2 text-amber-500 font-bold text-sm mb-2 uppercase tracking-widest">
                                        <Clock className="w-4 h-4" /> Extension Requested
                                    </h4>
                                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                                        <span className="text-slate-500 font-semibold italic">Employee Reason:</span> "{task.reason_for_delay}"
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-amber-500/80">
                                            Proposed Deadline: <span className="font-bold">{new Date(task.requested_deadline || '').toLocaleString()}</span>
                                        </p>
                                        <button
                                            onClick={() => handleApprove(task.id)}
                                            disabled={approvingId === task.id}
                                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all flex items-center gap-2"
                                        >
                                            {approvingId === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                            Approve & Update
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                                            {task.description}
                                        </h3>
                                        <div className={cn(
                                            "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            task.task_status === 'completed' ? "bg-emerald-500/10 text-emerald-400" :
                                                task.task_status === 'extension_requested' ? "bg-amber-500/10 text-amber-500" :
                                                    task.task_status === 'extended' ? "bg-indigo-500/10 text-indigo-400" :
                                                        "bg-slate-800 text-slate-400"
                                        )}>
                                            {task.task_status}
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 italic">
                                        {task.detailed_context || 'No specific context provided.'}
                                    </p>

                                    <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider">
                                        <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                                            {task.meeting_title}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                            <User className="w-3.5 h-3.5 text-sky-400" />
                                            {task.assignee_email}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                            <Calendar className="w-3.5 h-3.5 text-rose-400" />
                                            {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:w-48 flex lg:flex-col justify-between items-center lg:items-end gap-3 lg:border-l lg:border-slate-800 lg:pl-6">
                                    <div className="flex flex-col items-center lg:items-end">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Notification</p>
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                                            task.email_status === 'sent' ? "text-emerald-500" :
                                                task.email_status === 'failed' ? "text-red-500" :
                                                    "text-slate-500"
                                        )}>
                                            {task.email_status === 'sent' ? <CheckCircle className="w-4 h-4" /> :
                                                task.email_status === 'failed' ? <AlertCircle className="w-4 h-4" /> :
                                                    <Clock className="w-4 h-4" />}
                                            Gmail {task.email_status}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setSelectedTranscript({ title: task.meeting_title, content: task.meeting_transcript })}
                                            title="View Transcript"
                                            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-all"
                                        >
                                            <FileText className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => setSelectedMessage(task)}
                                            title="View Entire Message"
                                            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-all group/btn"
                                        >
                                            <ExternalLink className="w-5 h-5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Transcript Modal */}
            {selectedTranscript && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-200">Meeting Transcript</h3>
                                <p className="text-sm text-slate-500 mt-1">{selectedTranscript.title}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedTranscript(null)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1">
                            {selectedTranscript.content ? (
                                <div className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                                    {selectedTranscript.content}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                                    <Archive className="w-10 h-10 mb-4 opacity-50" />
                                    <p>Transcript not available for this meeting.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                            <button 
                                onClick={() => setSelectedTranscript(null)}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message / context Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-200">Entire Message</h3>
                                <p className="text-sm text-slate-500 mt-1">{selectedMessage.meeting_title}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedMessage(null)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1 space-y-6">
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h4>
                                <p className="text-lg font-medium text-slate-200">{selectedMessage.description}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Context & Details</h4>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {selectedMessage.detailed_context || 'No specific context provided.'}
                                </p>
                            </div>
                            <div className="pt-4 border-t border-slate-800/50 flex flex-wrap gap-6 text-sm">
                                <div>
                                    <span className="text-slate-500 font-medium block mb-1">Status</span>
                                    <span className="text-slate-300 capitalize">{selectedMessage.task_status.replace('_', ' ')}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium block mb-1">Assignee</span>
                                    <span className="text-slate-300">{selectedMessage.assignee_email}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium block mb-1">Deadline</span>
                                    <span className="text-slate-300">{new Date(selectedMessage.deadline).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                            <button 
                                onClick={() => setSelectedMessage(null)}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
