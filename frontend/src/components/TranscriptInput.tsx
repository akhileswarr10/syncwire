'use client';

import { useState, useRef } from 'react';
import { Upload, Play, CheckCircle2, Loader2, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setError(err.message || 'An unexpected error occurred');
        }
    };

    const steps = [
        { id: 'parsing', label: 'Parsing Transcript', icon: FileText },
        { id: 'updating', label: 'Updating MySQL', icon: Upload },
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
        <div className="space-y-6">
            <div className="relative group">
                <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste your meeting transcript here..."
                    className="w-full h-80 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none group-hover:border-slate-700 font-mono text-sm leading-relaxed"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".txt,.vtt"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                        title="Upload Transcript"
                    >
                        <Upload className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-6 bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
                <div className="flex items-center gap-8 flex-1">
                    {steps.map((step, idx) => {
                        const stepStatus = getStepStatus(step.id);
                        return (
                            <div key={step.id} className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    stepStatus === 'completed' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" :
                                        stepStatus === 'active' ? "bg-indigo-500/10 border-indigo-500 text-indigo-500 animate-pulse" :
                                            stepStatus === 'error' ? "bg-red-500/10 border-red-500 text-red-500" :
                                                "border-slate-800 text-slate-600"
                                )}>
                                    {stepStatus === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                                        stepStatus === 'active' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                            <step.icon className="w-5 h-5" />}
                                </div>
                                <div className="hidden lg:block">
                                    <p className={cn(
                                        "text-xs font-semibold uppercase tracking-wider",
                                        stepStatus === 'pending' ? "text-slate-600" : "text-slate-400"
                                    )}>
                                        Step {idx + 1}
                                    </p>
                                    <p className={cn(
                                        "text-sm font-medium",
                                        stepStatus === 'active' ? "text-slate-100" :
                                            stepStatus === 'completed' ? "text-slate-300" :
                                                "text-slate-500"
                                    )}>
                                        {step.label}
                                    </p>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className="hidden xl:block w-12 h-px bg-slate-800 ml-4" />
                                )}
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={runExecutioner}
                    disabled={status !== 'idle' && status !== 'completed' && status !== 'error' || !transcript.trim()}
                    className={cn(
                        "px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                        status === 'completed'
                            ? "bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            : status === 'error'
                                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                    )}
                >
                    {status === 'completed' ? (
                        <>
                            <CheckCircle2 className="w-5 h-5" />
                            Success
                        </>
                    ) : status === 'error' ? (
                        <>
                            <AlertCircle className="w-5 h-5" />
                            Retry
                        </>
                    ) : (
                        <>
                            <Play className="w-5 h-5 fill-current" />
                            Run Executioner
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}
        </div>
    );
}
