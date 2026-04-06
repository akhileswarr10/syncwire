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
            <div
                className="flex flex-col items-center justify-center h-64 gap-3 rounded-2xl border"
                style={{ background: 'var(--sw-bg-2)', borderColor: 'var(--sw-border)' }}
            >
                <div
                    className="w-9 h-9 border-[3px] rounded-full animate-spin"
                    style={{ borderColor: 'var(--sw-border)', borderTopColor: 'var(--sw-indigo)' }}
                />
                <p className="text-sm font-medium" style={{ color: 'var(--sw-text-3)' }}>
                    Loading tasks…
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="p-8 rounded-2xl border text-center"
                style={{ background: 'var(--sw-red-subtle)', borderColor: 'var(--sw-red)' }}
            >
                <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--sw-red)' }} />
                <h3 className="text-base font-bold mb-1" style={{ color: 'var(--sw-text-1)' }}>
                    Connection Error
                </h3>
                <p className="text-sm mb-5" style={{ color: 'var(--sw-text-2)' }}>
                    Make sure the SyncWire backend is running on port 5000.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'var(--sw-bg-2)', color: 'var(--sw-text-1)', border: '1px solid var(--sw-border)' }}
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Search + Filter Bar */}
            <div
                className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl border"
                style={{ background: 'var(--sw-bg-2)', borderColor: 'var(--sw-border)' }}
            >
                {/* Search */}
                <div className="relative flex-1">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: 'var(--sw-text-3)' }}
                    />
                    <input
                        type="text"
                        placeholder="Search tasks, assignees, meetings…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-all"
                        style={{
                            background: 'var(--sw-bg-3)',
                            border: '1px solid var(--sw-border)',
                            color: 'var(--sw-text-1)',
                        }}
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--sw-indigo)'; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--sw-border)'; }}
                    />
                </div>

                {/* Status filter */}
                <div
                    className="flex items-center gap-1 p-1 rounded-xl"
                    style={{ background: 'var(--sw-bg-3)', border: '1px solid var(--sw-border)' }}
                >
                    {(['all', 'pending', 'completed', 'extension_requested'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 capitalize whitespace-nowrap"
                            style={{
                                background: statusFilter === s ? 'var(--sw-bg-2)' : 'transparent',
                                color: statusFilter === s ? 'var(--sw-indigo)' : 'var(--sw-text-2)',
                                boxShadow: statusFilter === s ? 'var(--sw-shadow)' : 'none',
                            }}
                        >
                            {s === 'extension_requested' ? 'Requests' : s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tasks list */}
            <div className="space-y-3">
                {filteredTasks?.length === 0 ? (
                    <div
                        className="p-12 text-center rounded-2xl border border-dashed"
                        style={{ borderColor: 'var(--sw-border)', color: 'var(--sw-text-3)' }}
                    >
                        <Archive className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">No tasks match your filters.</p>
                    </div>
                ) : (
                    filteredTasks?.map((task) => (
                        <div
                            key={task.id}
                            className="group rounded-2xl border p-5 transition-all duration-200"
                            style={{
                                background: 'var(--sw-bg-2)',
                                borderColor: task.task_status === 'extension_requested'
                                    ? 'rgba(245,158,11,0.25)'
                                    : 'var(--sw-border)',
                                boxShadow: 'var(--sw-shadow)',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLDivElement).style.borderColor =
                                    task.task_status === 'extension_requested'
                                        ? 'var(--sw-amber)'
                                        : 'var(--sw-indigo)';
                                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLDivElement).style.borderColor =
                                    task.task_status === 'extension_requested'
                                        ? 'rgba(245,158,11,0.25)'
                                        : 'var(--sw-border)';
                                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                            }}
                        >
                            {/* Extension request banner */}
                            {task.task_status === 'extension_requested' && (
                                <div
                                    className="mb-4 p-4 rounded-xl border sw-animate-fade-up"
                                    style={{ background: 'var(--sw-amber-subtle)', borderColor: 'rgba(245,158,11,0.3)' }}
                                >
                                    <h4
                                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2"
                                        style={{ color: 'var(--sw-amber)' }}
                                    >
                                        <Clock className="w-3.5 h-3.5" /> Extension Requested
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--sw-text-2)' }}>
                                        <span className="font-semibold" style={{ color: 'var(--sw-text-3)' }}>Reason: </span>
                                        &quot;{task.reason_for_delay}&quot;
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs" style={{ color: 'var(--sw-amber)' }}>
                                            Proposed:{' '}
                                            <strong>
                                                {new Date(task.requested_deadline || '').toLocaleString()}
                                            </strong>
                                        </p>
                                        <button
                                            onClick={() => handleApprove(task.id)}
                                            disabled={approvingId === task.id}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                            style={{ background: 'var(--sw-amber)', color: '#0f172a' }}
                                        >
                                            {approvingId === task.id
                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                : <CheckCircle className="w-3 h-3" />}
                                            Approve & Update
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col lg:flex-row gap-5">
                                {/* Main content */}
                                <div className="flex-1 space-y-3 min-w-0">
                                    {/* Title + badge */}
                                    <div className="flex items-start justify-between gap-3">
                                        <h3
                                            className="text-base font-bold leading-snug"
                                            style={{ color: 'var(--sw-text-1)' }}
                                        >
                                            {task.description}
                                        </h3>
                                        <span
                                            className={cn('sw-badge shrink-0', {
                                                'sw-badge-completed': task.task_status === 'completed',
                                                'sw-badge-amber': task.task_status === 'extension_requested',
                                                'sw-badge-indigo': task.task_status === 'extended',
                                                'sw-badge-pending': task.task_status === 'pending' || task.task_status === 'in_progress',
                                            })}
                                        >
                                            {task.task_status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {/* Context */}
                                    <p
                                        className="text-sm leading-relaxed line-clamp-2"
                                        style={{ color: 'var(--sw-text-2)' }}
                                    >
                                        {task.detailed_context || 'No additional context provided.'}
                                    </p>

                                    {/* Meta chips */}
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { icon: LayoutDashboard, value: task.meeting_title, color: 'var(--sw-indigo)' },
                                            { icon: User, value: task.assignee_email, color: '#38bdf8' },
                                            { icon: Calendar, value: new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), color: '#fb7185' },
                                        ].map(({ icon: Icon, value, color }) => (
                                            <div
                                                key={value}
                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                                                style={{ background: 'var(--sw-bg-3)', border: '1px solid var(--sw-border)', color: 'var(--sw-text-2)' }}
                                            >
                                                <Icon className="w-3 h-3" style={{ color }} />
                                                {value}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right panel */}
                                <div
                                    className="lg:w-44 flex lg:flex-col justify-between items-center lg:items-end gap-3 lg:border-l lg:pl-5"
                                    style={{ borderColor: 'var(--sw-border)' }}
                                >
                                    {/* Email status */}
                                    <div className="flex flex-col items-end">
                                        <p
                                            className="text-[9px] font-bold uppercase tracking-widest mb-1"
                                            style={{ color: 'var(--sw-text-3)' }}
                                        >
                                            Email
                                        </p>
                                        <div
                                            className="flex items-center gap-1.5 text-xs font-medium"
                                            style={{
                                                color:
                                                    task.email_status === 'sent'   ? 'var(--sw-emerald)' :
                                                    task.email_status === 'failed' ? 'var(--sw-red)' :
                                                    'var(--sw-text-3)',
                                            }}
                                        >
                                            {task.email_status === 'sent'   && <CheckCircle className="w-3.5 h-3.5" />}
                                            {task.email_status === 'failed' && <AlertCircle className="w-3.5 h-3.5" />}
                                            {task.email_status === 'pending'&& <Clock className="w-3.5 h-3.5" />}
                                            {task.email_status}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => setSelectedTranscript({ title: task.meeting_title, content: task.meeting_transcript })}
                                            title="View Transcript"
                                            className="p-2 rounded-lg transition-all"
                                            style={{ background: 'var(--sw-bg-3)', color: 'var(--sw-text-2)', border: '1px solid var(--sw-border)' }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--sw-indigo)'; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--sw-text-2)'; }}
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedMessage(task)}
                                            title="View Task Details"
                                            className="p-2 rounded-lg transition-all"
                                            style={{ background: 'var(--sw-bg-3)', color: 'var(--sw-text-2)', border: '1px solid var(--sw-border)' }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--sw-indigo)'; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--sw-text-2)'; }}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Transcript Modal ── */}
            {selectedTranscript && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sw-animate-fade-in"
                    style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(6px)' }}
                >
                    <div
                        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden sw-animate-fade-up"
                        style={{
                            background: 'var(--sw-bg-2)',
                            border: '1px solid var(--sw-border)',
                            boxShadow: 'var(--sw-shadow-lg)',
                        }}
                    >
                        <div
                            className="flex items-center justify-between px-6 py-4 border-b"
                            style={{ borderColor: 'var(--sw-border)' }}
                        >
                            <div>
                                <h3 className="text-base font-bold" style={{ color: 'var(--sw-text-1)' }}>
                                    Meeting Transcript
                                </h3>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--sw-text-3)' }}>
                                    {selectedTranscript.title}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTranscript(null)}
                                className="p-1.5 rounded-lg transition-all"
                                style={{ background: 'var(--sw-bg-3)', color: 'var(--sw-text-2)' }}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {selectedTranscript.content ? (
                                <pre
                                    className="text-sm leading-relaxed whitespace-pre-wrap font-mono-dm"
                                    style={{ color: 'var(--sw-text-2)' }}
                                >
                                    {selectedTranscript.content}
                                </pre>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40" style={{ color: 'var(--sw-text-3)' }}>
                                    <Archive className="w-9 h-9 mb-3 opacity-40" />
                                    <p className="text-sm">Transcript not available.</p>
                                </div>
                            )}
                        </div>
                        <div
                            className="flex justify-end px-6 py-3 border-t"
                            style={{ borderColor: 'var(--sw-border)' }}
                        >
                            <button
                                onClick={() => setSelectedTranscript(null)}
                                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                                style={{ background: 'var(--sw-bg-3)', color: 'var(--sw-text-1)', border: '1px solid var(--sw-border)' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Message / Context Modal ── */}
            {selectedMessage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sw-animate-fade-in"
                    style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(6px)' }}
                >
                    <div
                        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden sw-animate-fade-up"
                        style={{
                            background: 'var(--sw-bg-2)',
                            border: '1px solid var(--sw-border)',
                            boxShadow: 'var(--sw-shadow-lg)',
                        }}
                    >
                        <div
                            className="flex items-center justify-between px-6 py-4 border-b"
                            style={{ borderColor: 'var(--sw-border)' }}
                        >
                            <div>
                                <h3 className="text-base font-bold" style={{ color: 'var(--sw-text-1)' }}>Task Details</h3>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--sw-text-3)' }}>
                                    {selectedMessage.meeting_title}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="p-1.5 rounded-lg transition-all"
                                style={{ background: 'var(--sw-bg-3)', color: 'var(--sw-text-2)' }}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--sw-text-3)' }}>
                                    Description
                                </p>
                                <p className="text-base font-semibold" style={{ color: 'var(--sw-text-1)' }}>
                                    {selectedMessage.description}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--sw-text-3)' }}>
                                    Context & Details
                                </p>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--sw-text-2)' }}>
                                    {selectedMessage.detailed_context || 'No specific context provided.'}
                                </p>
                            </div>
                            <div
                                className="flex flex-wrap gap-5 pt-4 border-t text-sm"
                                style={{ borderColor: 'var(--sw-border)' }}
                            >
                                {[
                                    { label: 'Status', value: selectedMessage.task_status.replace('_', ' ') },
                                    { label: 'Assignee', value: selectedMessage.assignee_email },
                                    { label: 'Deadline', value: new Date(selectedMessage.deadline).toLocaleString() },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <span className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--sw-text-3)' }}>
                                            {label}
                                        </span>
                                        <span style={{ color: 'var(--sw-text-2)' }} className="capitalize">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div
                            className="flex justify-end px-6 py-3 border-t"
                            style={{ borderColor: 'var(--sw-border)' }}
                        >
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                                style={{ background: 'var(--sw-bg-3)', color: 'var(--sw-text-1)', border: '1px solid var(--sw-border)' }}
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
