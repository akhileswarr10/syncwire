'use client';

import { PlusCircle, Archive, Zap, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

interface SidebarProps {
  activeTab: 'new' | 'archive';
  setActiveTab: (tab: 'new' | 'archive') => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { theme, toggle } = useTheme();

  const tabs = [
    { id: 'new', label: 'New Meeting', icon: PlusCircle, desc: 'Process transcript' },
    { id: 'archive', label: 'Task Archive', icon: Archive, desc: 'Review all tasks' },
  ];

  return (
    <aside
      className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r"
      style={{
        background: 'var(--sw-bg-2)',
        borderColor: 'var(--sw-border)',
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-7 pb-6 border-b" style={{ borderColor: 'var(--sw-border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--sw-indigo)' }}
          >
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <div>
            <h1
              className="text-base font-bold tracking-tight leading-none"
              style={{ color: 'var(--sw-text-1)', fontFamily: 'var(--font-dm-sans)' }}
            >
              SyncWire
            </h1>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--sw-text-3)' }}>
              MCP Executioner
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p
          className="text-[10px] font-bold uppercase tracking-widest px-3 mb-3"
          style={{ color: 'var(--sw-text-3)' }}
        >
          Workspace
        </p>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'new' | 'archive')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-left group'
              )}
              style={{
                background: isActive ? 'var(--sw-indigo-subtle)' : 'transparent',
                color: isActive ? 'var(--sw-indigo)' : 'var(--sw-text-2)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--sw-bg-3)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--sw-text-1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--sw-text-2)';
                }
              }}
            >
              <Icon
                className="w-4.5 h-4.5 shrink-0"
                style={{ color: isActive ? 'var(--sw-indigo)' : 'inherit' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{tab.label}</p>
                <p
                  className="text-[10px] font-normal leading-tight mt-0.5 truncate"
                  style={{ color: isActive ? 'var(--sw-indigo)' : 'var(--sw-text-3)', opacity: 0.8 }}
                >
                  {tab.desc}
                </p>
              </div>
              {isActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--sw-indigo)' }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: MCP badge + theme toggle */}
      <div className="px-3 pb-5 space-y-3">
        {/* MCP Status Card */}
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: 'var(--sw-indigo-subtle)',
            borderColor: 'rgba(99,102,241,0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold" style={{ color: 'var(--sw-indigo)' }}>
              MCP Connected
            </span>
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--sw-text-2)' }}>
            Gmail & Calendar integrations active.
          </p>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150"
          style={{ background: 'var(--sw-bg-3)', color: 'var(--sw-text-2)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--sw-text-1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--sw-text-2)';
          }}
        >
          <span className="text-xs font-medium">
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
          <div
            className="w-8 h-4.5 rounded-full relative transition-all duration-200 flex items-center px-0.5"
            style={{ background: theme === 'dark' ? 'var(--sw-indigo)' : 'var(--sw-border-2)' }}
          >
            <div
              className="w-3.5 h-3.5 rounded-full bg-white shadow transition-all duration-200 flex items-center justify-center"
              style={{ transform: theme === 'dark' ? 'translateX(14px)' : 'translateX(0)' }}
            >
              {theme === 'dark'
                ? <Moon className="w-2 h-2 text-slate-600" />
                : <Sun className="w-2 h-2 text-amber-500" />}
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}
