import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  Database,
  Cpu,
  History,
  Settings,
  X,
  GraduationCap,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  FolderUp,
  SlidersHorizontal,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  // Role-scoped navigation definition
  const navigationGroups = isAdmin
    ? [
        {
          title: 'Administration',
          items: [
            { name: 'System Overview', path: '/dashboard', icon: LayoutDashboard, badge: 'Overview' },
            { name: 'Staff Management', path: '/admin/staff', icon: ShieldCheck, badge: 'Staff' },
            { name: 'Dataset Management', path: '/admin/datasets', icon: FolderUp, badge: 'CSV' },
            { name: 'Model Training (RF)', path: '/admin/models', icon: Cpu, badge: 'RF' },
          ]
        },
        {
          title: 'Assessment Studio',
          items: [
            { name: 'Question Generator', path: '/generate-paper', icon: FileSpreadsheet, badge: 'TN 6–12' },
            { name: 'Paper Preview', path: '/preview', icon: FileText, badge: null },
            { name: 'Question Bank', path: '/question-bank', icon: Database, badge: null },
          ]
        },
        {
          title: 'Archive & Setup',
          items: [
            { name: 'Generation History', path: '/history', icon: History, badge: null },
            { name: 'System Telemetry', path: '/settings', icon: Settings, badge: null },
          ]
        }
      ]
    : [
        {
          title: 'Assessment Engine',
          items: [
            { name: 'Faculty Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: null },
            { name: 'Generate Paper', path: '/generate-paper', icon: FileSpreadsheet, badge: 'TN 6–12' },
            { name: 'Paper Preview', path: '/preview', icon: FileText, badge: null },
            { name: 'Question Bank', path: '/question-bank', icon: Database, badge: null },
          ]
        },
        {
          title: 'My Records',
          items: [
            { name: 'My Generated Papers', path: '/history', icon: History, badge: null },
            { name: 'Faculty Profile', path: '/settings', icon: Settings, badge: null },
          ]
        }
      ];

  // Active navigation indicator
  let currentNav = { name: 'Dashboard' };
  for (const group of navigationGroups) {
    const found = group.items.find((item) => item.path === location.pathname);
    if (found) {
      currentNav = found;
      break;
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div data-ui="true" className="min-h-[100dvh] flex bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-950">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: Deep Obsidian with subtle metallic borders */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0B0F19] text-slate-200 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/70">
          <Link to="/dashboard" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/25 ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                <span>ExamForge</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30 tracking-wider">
                  TNSB
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium tracking-wide">
                Tamil Nadu State Board (6–12)
              </div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-950/50'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : (isAdmin ? 'A' : 'T')}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {user?.full_name || user?.email || 'User'}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span className="uppercase">{user?.role || 'Teacher'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="text-slate-400">ExamForge</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800">{currentNav.name}</span>
            </div>
          </div>

          {/* Right Header Status Chip */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200/60 text-blue-900 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Tamil Nadu State Board (Classes 6–12)</span>
            </div>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                Administrator
              </span>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
