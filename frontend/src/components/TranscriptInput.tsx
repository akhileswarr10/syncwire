'use client';

import { useState, useRef } from 'react';
import { Upload, Play, CheckCircle2, Loader2, FileText, AlertCircle } from 'lucide-react';

interface TranscriptInputProps {
    onSuccess: () => void;
}

type Step = 'idle' | 'parsing' | 'updating' | 'notifying' | 'completed' | 'error';

export default function TranscriptInput({ onSuccess }: TranscriptInputProps) {
    const [transcript, setTranscript] = useState('');
    const [status, setStatus] = useState<Step>('idle');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setTranscript(event.target?.result as string);
        };
        reader.readAsText(file);
    };

    const runExecutioner = async () => {
        if (!transcript.trim()) return;

        setStatus('parsing');
        setError(null);

        try {
            const response = await fetch('http://localhost:5000/api/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transcript }),
            });

            if (!response.ok) {
                throw new Error('Failed to process transcript');
            }

            setStatus('updating');
            // Artificial delay for better UX on the stepper
            await new Promise(r => setTimeout(r, 1000));

            setStatus('notifying');
            await new Promise(r => setTimeout(r, 1000));

            setStatus('completed');
            setTranscript('');
            onSuccess();

            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    };

    const steps = [
        { id: 'parsing', label: 'Parsing Transcript', icon: FileText },
        { id: 'updating', label: 'Saving to Database', icon: Upload },
        { id: 'notifying', label: 'Sending Notifications', icon: AlertCircle },
    ];

    const getStepStatus = (stepId: string) => {
        const statusOrder = ['idle', 'parsing', 'updating', 'notifying', 'completed'];
        const currentIdx = statusOrder.indexOf(status);
        const stepIdx = statusOrder.indexOf(stepId);

        if (status === 'error') return 'error';
        if (status === 'completed') return 'completed';
        if (currentIdx > stepIdx) return 'completed';
        if (currentIdx === stepIdx) return 'active';
        return 'pending';
    };

    return (
        <div className="space-y-5">
            {/* Transcript Input Card */}
            <div
                className="rounded-2xl border overflow-hidden"
                style={{ background: 'var(--sw-bg-2)', borderColor: 'var(--sw-border)', boxShadow: 'var(--sw-shadow)' }}
            >
                {/* Card Header */}
                <div
                    className="flex items-center justify-between px-5 py-3.5 border-b"
                    style={{ borderColor: 'var(--sw-border)', background: 'var(--sw-bg-3)' }}
                >
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--sw-border-2)' }} />
                            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--sw-border-2)' }} />
                            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--sw-border-2)' }} />
                        </div>
                        <span
                            className="text-xs font-medium ml-2"
                            style={{ color: 'var(--sw-text-3)', fontFamily: 'var(--font-dm-mono)' }}
                        >
                            meeting_transcript.txt
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".txt,.vtt"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                            style={{
                                background: 'var(--sw-bg-2)',
                                border: '1px solid var(--sw-border)',
                                color: 'var(--sw-text-2)',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.color = 'var(--sw-text-1)';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sw-border-2)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.color = 'var(--sw-text-2)';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sw-border)';
                            }}
                            title="Upload .txt or .vtt file"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Upload File
                        </button>
                    </div>
                </div>

                {/* Textarea */}
                <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder={`Paste your meeting transcript here...\n\nExample:\n[00:00] Alice: Let's review the Q3 roadmap...\n[00:45] Bob: I'll handle the API integration by Friday.`}
                    className="w-full h-72 px-5 py-4 text-sm leading-relaxed resize-none focus:outline-none transition-all font-mono-dm"
                    style={{
                        background: 'var(--sw-bg-2)',
                        color: 'var(--sw-text-1)',
                        caretColor: 'var(--sw-indigo)',
                    }}
                />

                {/* Char count */}
                <div
                    className="flex items-center justify-end px-5 py-2 border-t"
                    style={{ borderColor: 'var(--sw-border)' }}
                >
                    <span
                        className="text-[10px] font-medium tabular-nums"
                        style={{ color: 'var(--sw-text-3)', fontFamily: 'var(--font-dm-mono)' }}
                    >
                        {transcript.length.toLocaleString()} chars
                    </span>
                </div>
            </div>

            {/* Execution Panel */}
            <div
                className="rounded-2xl border p-5"
                style={{ background: 'var(--sw-bg-2)', borderColor: 'var(--sw-border)', boxShadow: 'var(--sw-shadow)' }}
            >
                <div className="flex flex-col lg:flex-row items-center gap-6">
                    {/* Steps */}
                    <div className="flex items-center gap-0 flex-1 w-full">
                        {steps.map((step, idx) => {
                            const stepStatus = getStepStatus(step.id);
                            const Icon = step.icon;
                            const isLast = idx === steps.length - 1;
                            return (
                                <div key={step.id} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                                        {/* Icon bubble */}
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-300 shrink-0"
                                            style={{
                                                background:
                                                    stepStatus === 'completed' ? 'var(--sw-emerald-subtle)' :
                                                    stepStatus === 'active'    ? 'var(--sw-indigo-subtle)' :
                                                    stepStatus === 'error'     ? 'var(--sw-red-subtle)' :
                                                    'var(--sw-bg-3)',
                                                borderColor:
                                                    stepStatus === 'completed' ? 'var(--sw-emerald)' :
                                                    stepStatus === 'active'    ? 'var(--sw-indigo)' :
                                                    stepStatus === 'error'     ? 'var(--sw-red)' :
                                                    'var(--sw-border)',
                                                color:
                                                    stepStatus === 'completed' ? 'var(--sw-emerald)' :
                                                    stepStatus === 'active'    ? 'var(--sw-indigo)' :
                                                    stepStatus === 'error'     ? 'var(--sw-red)' :
                                                    'var(--sw-text-3)',
                                            }}
                                        >
                                            {stepStatus === 'completed' ? (
                                                <CheckCircle2 className="w-4.5 h-4.5" />
                                            ) : stepStatus === 'active' ? (
                                                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                                            ) : (
                                                <Icon className="w-4 h-4" />
                                            )}
                                        </div>
                                        {/* Label */}
                                        <div className="text-center">
                                            <p
                                                className="text-[9px] font-bold uppercase tracking-widest"
                                                style={{ color: 'var(--sw-text-3)' }}
                                            >
                                                Step {idx + 1}
                                            </p>
                                            <p
                                                className="text-[11px] font-semibold leading-tight mt-0.5"
                                                style={{
                                                    color:
                                                        stepStatus === 'active'    ? 'var(--sw-text-1)' :
                                                        stepStatus === 'completed' ? 'var(--sw-text-2)' :
                                                        'var(--sw-text-3)',
                                                }}
                                            >
                                                {step.label}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Connector */}
                                    {!isLast && (
                                        <div
                                            className="flex-1 h-0.5 mx-2 rounded-full transition-all duration-500"
                                            style={{
                                                background:
                                                    getStepStatus(steps[idx + 1].id) === 'completed' ||
                                                    stepStatus === 'completed'
                                                        ? 'var(--sw-emerald)'
                                                        : 'var(--sw-border)',
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div
                        className="hidden lg:block w-px h-16 rounded-full"
                        style={{ background: 'var(--sw-border)' }}
                    />

                    {/* Run Button */}
                    <div className="shrink-0 w-full lg:w-auto">
                        <button
                            onClick={runExecutioner}
                            disabled={!transcript.trim() || (status !== 'idle' && status !== 'error' && status !== 'completed')}
                            className="w-full lg:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                background: 'var(--sw-indigo)',
                                color: '#ffffff',
                            }}
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
                            {status === 'parsing' || status === 'updating' || status === 'notifying' ? (
                                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            ) : status === 'completed' ? (
                                <CheckCircle2 className="w-4.5 h-4.5" />
                            ) : (
                                <Play className="w-4.5 h-4.5" />
                            )}
                            {status === 'idle' && 'Run Executioner'}
                            {(status === 'parsing' || status === 'updating' || status === 'notifying') && 'Executing…'}
                            {status === 'completed' && 'Done!'}
                            {status === 'error' && 'Retry'}
                        </button>
                    </div>
                </div>

                {/* Error banner */}
                {status === 'error' && error && (
                    <div
                        className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm sw-animate-slide-down"
                        style={{
                            background: 'var(--sw-red-subtle)',
                            borderColor: 'var(--sw-red)',
                            color: 'var(--sw-red)',
                        }}
                    >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Success banner */}
                {status === 'completed' && (
                    <div
                        className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm sw-animate-slide-down"
                        style={{
                            background: 'var(--sw-emerald-subtle)',
                            borderColor: 'var(--sw-emerald)',
                            color: 'var(--sw-emerald)',
                        }}
                    >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Execution complete — tasks extracted, emails sent, calendar events created.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
