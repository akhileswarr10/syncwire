'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    CheckCircle,
    Clock,
    Calendar,
    AlertCircle,
    Loader2,
    Send,
    CheckCircle2,
    Zap
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
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
        } catch {
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
        } catch {
            setError('Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div
            className="min-h-screen flex flex-col items-center justify-center gap-3"
            style={{ background: 'var(--sw-bg)' }}
        >
            <div
                className="w-10 h-10 border-[3px] rounded-full animate-spin"
                style={{ borderColor: 'var(--sw-border)', borderTopColor: 'var(--sw-indigo)' }}
            />
            <p className="text-sm font-medium" style={{ color: 'var(--sw-text-3)' }}>
                Verifying secure link…
            </p>
        </div>
    );

    if (error) return (
        <div
            className="min-h-screen flex items-center justify-center p-6"
            style={{ background: 'var(--sw-bg)' }}
        >
            <div
                className="max-w-md w-full p-8 rounded-2xl border text-center"
                style={{ background: 'var(--sw-bg-2)', borderColor: 'var(--sw-red)', boxShadow: 'var(--sw-shadow-lg)' }}
            >
                <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--sw-red)' }} />
                <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--sw-text-1)' }}>Invalid Link</h1>
                <p className="text-sm mb-6" style={{ color: 'var(--sw-text-2)' }}>{error}</p>
                <Link
                    href="/"
                    className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'var(--sw-bg-3)', color: 'var(--sw-text-1)', border: '1px solid var(--sw-border)' }}
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen py-10 px-5 sw-mesh-bg" style={{ background: 'var(--sw-bg)' }}>
            <div className="max-w-2xl mx-auto space-y-5">

                {/* Top bar */}
                <div className="flex items-center justify-between mb-2">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm font-semibold"
                        style={{ color: 'var(--sw-text-2)' }}
                    >
                        <Zap className="w-4 h-4" style={{ color: 'var(--sw-indigo)' }} />
                        SyncWire
                    </Link>
                    <span
                        className="sw-badge sw-badge-indigo"
                        style={{ background: 'var(--sw-indigo-subtle)', color: 'var(--sw-indigo)' }}
                    >
                        🔒 Secure Link
                    </span>
                </div>

                {/* Task header card */}
                <div
                    className="rounded-2xl border p-6 relative overflow-hidden"
                    style={{
                        background: 'var(--sw-bg-2)',
                        borderColor: 'var(--sw-border)',
                        boxShadow: 'var(--sw-shadow)',
                    }}
                >
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse 70% 50% at 90% -20%, var(--sw-indigo-subtle), transparent)',
                        }}
                    />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span
                                className={cn('sw-badge', {
                                    'sw-badge-completed': task?.task_status === 'completed',
                                    'sw-badge-amber': task?.task_status === 'extension_requested',
                                    'sw-badge-indigo': task?.task_status === 'extended',
                                    'sw-badge-pending': task?.task_status === 'pending' || task?.task_status === 'in_progress',
                                })}
                            >
                                {task?.task_status?.replace('_', ' ')}
                            </span>
                        </div>
                        <h1
                            className="text-2xl font-bold leading-snug mb-3"
                            style={{ color: 'var(--sw-text-1)', fontFamily: 'var(--font-dm-sans)' }}
                        >
                            {task?.description}
                        </h1>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--sw-text-2)' }}>
                            {task?.detailed_context}
                        </p>
                    </div>
                </div>

                {/* Success alert */}
                {successMsg && (
                    <div
                        className="flex items-center gap-3 px-5 py-4 rounded-2xl border sw-animate-slide-down"
                        style={{ background: 'var(--sw-emerald-subtle)', borderColor: 'var(--sw-emerald)', color: 'var(--sw-emerald)' }}
                    >
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-semibold">{successMsg}</p>
                    </div>
                )}

                {/* Info grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div
                        className="p-5 rounded-2xl border"
                        style={{ background: 'var(--sw-bg-2)', borderColor: 'var(--sw-border)' }}
                    >
                        <p
                            className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5"
                            style={{ color: 'var(--sw-text-3)' }}
                        >
                            <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--sw-indigo)' }} />
                            Deadline
                        </p>
                        <p className="text-xl font-bold" style={{ color: 'var(--sw-text-1)' }}>
                            {new Date(task?.deadline || '').toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--sw-text-3)' }}>
                            {new Date(task?.deadline || '').toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>

                    <div
                        className="p-5 rounded-2xl border"
                        style={{ background: 'var(--sw-bg-2)', borderColor: 'var(--sw-border)' }}
                    >
                        <p
                            className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5"
                            style={{ color: 'var(--sw-text-3)' }}
                        >
                            <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--sw-emerald)' }} />
                            Origin Meeting
                        </p>
                        <p className="text-base font-bold leading-snug" style={{ color: 'var(--sw-text-1)' }}>
                            {task?.meeting_title}
                        </p>
                        <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--sw-text-3)' }}>
                            {task?.meeting_summary}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                {!successMsg && task?.task_status !== 'completed' && (
                    <div
                        className="rounded-2xl border p-6 space-y-5"
                        style={{ background: 'var(--sw-bg-2)', borderColor: 'var(--sw-border)', boxShadow: 'var(--sw-shadow)' }}
                    >
                        <p
                            className="text-xs font-bold uppercase tracking-widest"
                            style={{ color: 'var(--sw-text-3)' }}
                        >
                            Your Actions
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Complete button */}
                            <button
                                onClick={() => handleStatusUpdate('completed')}
                                disabled={submitting}
                                className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                                style={{ background: 'var(--sw-emerald)', color: '#ffffff' }}
                                onMouseEnter={(e) => {
                                    if (!(e.currentTarget as HTMLButtonElement).disabled) {
                                        (e.currentTarget as HTMLButtonElement).style.opacity = '0.88';
                                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                                }}
                            >
                                {submitting
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <CheckCircle className="w-4 h-4" />}
                                Mark as Completed
                            </button>

                            {/* Extension button */}
                            <button
                                onClick={() => setShowExtension(true)}
                                disabled={submitting || showExtension}
                                className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                                style={{
                                    background: 'var(--sw-bg-3)',
                                    color: 'var(--sw-text-1)',
                                    border: '1px solid var(--sw-border)',
                                }}
                            >
                                <Clock className="w-4 h-4" />
                                Request Extension
                            </button>
                        </div>

                        {/* Extension form */}
                        {showExtension && (
                            <form
                                onSubmit={handleRequestExtension}
                                className="pt-5 border-t space-y-4 sw-animate-fade-up"
                                style={{ borderColor: 'var(--sw-border)' }}
                            >
                                <div className="space-y-2">
                                    <label
                                        className="text-[10px] font-bold uppercase tracking-widest"
                                        style={{ color: 'var(--sw-text-3)' }}
                                    >
                                        Reason for Delay
                                    </label>
                                    <textarea
                                        required
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Briefly explain why you need more time…"
                                        className="w-full h-28 px-4 py-3 rounded-xl text-sm resize-none focus:outline-none transition-all font-mono-dm"
                                        style={{
                                            background: 'var(--sw-bg-3)',
                                            border: '1px solid var(--sw-border)',
                                            color: 'var(--sw-text-1)',
                                        }}
                                        onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--sw-indigo)'; }}
                                        onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--sw-border)'; }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label
                                        className="text-[10px] font-bold uppercase tracking-widest"
                                        style={{ color: 'var(--sw-text-3)' }}
                                    >
                                        Requested New Deadline
                                    </label>
                                    <input
                                        required
                                        type="datetime-local"
                                        value={newDeadline}
                                        onChange={(e) => setNewDeadline(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all font-mono-dm"
                                        style={{
                                            background: 'var(--sw-bg-3)',
                                            border: '1px solid var(--sw-border)',
                                            color: 'var(--sw-text-1)',
                                        }}
                                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--sw-indigo)'; }}
                                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--sw-border)'; }}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                                        style={{ background: 'var(--sw-indigo)', color: '#ffffff' }}
                                    >
                                        {submitting
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Send className="w-4 h-4" />}
                                        Submit Request
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowExtension(false)}
                                        className="px-6 py-3 rounded-xl font-bold text-sm transition-all"
                                        style={{
                                            background: 'var(--sw-bg-3)',
                                            color: 'var(--sw-text-1)',
                                            border: '1px solid var(--sw-border)',
                                        }}
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
