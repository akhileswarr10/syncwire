'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    CheckCircle,
    Clock,
    Calendar,
    AlertCircle,
    Loader2,
    ArrowRight,
    Send,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
    id: number;
    description: string;
    detailed_context: string;
    deadline: string;
    assignee_email: string;
    meeting_title: string;
    meeting_summary: string;
    task_status: string;
}

export default function TaskUpdatePage() {
    const { token } = useParams();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showExtension, setShowExtension] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Form State
    const [reason, setReason] = useState('');
    const [newDeadline, setNewDeadline] = useState('');

    useEffect(() => {
        async function fetchTask() {
            try {
                const res = await fetch(`http://localhost:5000/api/tasks/token/${token}`);
                if (!res.ok) throw new Error('Invalid or expired magic link');
                const data = await res.json();
                setTask(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchTask();
    }, [token]);

    const handleStatusUpdate = async (status: string) => {
        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/api/tasks/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, status })
            });
            if (res.ok) {
                setSuccessMsg(`Task successfully marked as ${status}!`);
                setTask(prev => prev ? { ...prev, task_status: status } : null);
            }
        } catch (err) {
            setError('Failed to update task');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestExtension = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/api/tasks/request-extension', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, reason, requestedDeadline: new Date(newDeadline).toISOString() })
            });
            if (res.ok) {
                setSuccessMsg('Extension request submitted to your manager.');
                setShowExtension(false);
                setTask(prev => prev ? { ...prev, task_status: 'extension_requested' } : null);
            }
        } catch (err) {
            setError('Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Verifying Secure Link...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-slate-900 border border-red-500/20 p-8 rounded-3xl text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-slate-100 mb-2">Invalid Link</h1>
                <p className="text-slate-500 mb-8">{error}</p>
                <a href="/" className="inline-block px-8 py-3 bg-slate-800 text-slate-100 rounded-2xl hover:bg-slate-700 transition-all">
                    Go to Dashboard
                </a>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2.5rem] relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 bg-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                                Secure Magic Link
                            </div>
                            <div className={cn(
                                "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                                task?.task_status === 'completed' ? "bg-emerald-600/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                            )}>
                                {task?.task_status}
                            </div>
                        </div>
                        <h1 className="text-4xl font-extrabold mb-4">{task?.description}</h1>
                        <p className="text-slate-400 leading-relaxed text-lg max-w-2xl italic">
                            "{task?.detailed_context}"
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -mr-32 -mt-32" />
                </div>

                {/* Success Alert */}
                {successMsg && (
                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center gap-4 text-emerald-400 animate-in fade-in slide-in-from-top-4">
                        <CheckCircle2 className="w-6 h-6" />
                        <p className="font-semibold">{successMsg}</p>
                    </div>
                )}

                {/* Task Info Grid */}
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                        <h3 className="font-bold text-slate-400 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-400" /> Current Deadline
                        </h3>
                        <p className="text-2xl font-black text-slate-100">
                            {new Date(task?.deadline || '').toLocaleDateString(undefined, {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                        <h3 className="font-bold text-slate-400 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400" /> Origin Meeting
                        </h3>
                        <p className="text-xl font-bold text-slate-200">{task?.meeting_title}</p>
                        <p className="text-xs text-slate-500 line-clamp-2">{task?.meeting_summary}</p>
                    </div>
                </div>

                {/* Actions */}
                {!successMsg && task?.task_status !== 'completed' && (
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] space-y-8">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => handleStatusUpdate('completed')}
                                disabled={submitting}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                                Mark as Completed
                            </button>

                            <button
                                onClick={() => setShowExtension(true)}
                                disabled={submitting || showExtension}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                <Clock className="w-6 h-6" />
                                Request Extension
                            </button>
                        </div>

                        {showExtension && (
                            <form onSubmit={handleRequestExtension} className="space-y-6 pt-6 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-2">
                                        Reason for Delay
                                    </label>
                                    <textarea
                                        required
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Briefly explain why you need more time..."
                                        className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-2">
                                        Requested New Deadline
                                    </label>
                                    <input
                                        required
                                        type="datetime-local"
                                        value={newDeadline}
                                        onChange={(e) => setNewDeadline(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        Submit Request
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowExtension(false)}
                                        className="px-8 py-4 bg-slate-800 text-slate-100 rounded-xl font-bold hover:bg-slate-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
