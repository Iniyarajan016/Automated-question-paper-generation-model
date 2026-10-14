import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email.trim(), password);

      // Determine appropriate destination based on role and prior navigation
      const userRole = res?.user?.role;
      let targetPath = '/dashboard';

      if (location.state?.from?.pathname && location.state.from.pathname !== '/login') {
        const fromPath = location.state.from.pathname;
        // Prevent teachers from being redirected into admin-only routes
        if (fromPath.startsWith('/admin') && userRole !== 'admin') {
          targetPath = '/dashboard';
        } else {
          targetPath = fromPath;
        }
      } else {
        targetPath = '/dashboard';
      }

      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8F9FA] text-slate-900 font-sans">
      {/* ========================================================= */}
      {/* LEFT PANEL — BRANDING & QUESTION PAPER SHOWCASE          */}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] flex-col justify-between p-10 xl:p-14 border-r border-slate-200/90 bg-[#F8F9FB]">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              ExamForge <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200">AI</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">Tamil Nadu State Board Assessment Platform</div>
          </div>
        </div>

        {/* Hero Narrative & Understated Question Paper Visual */}
        <div className="max-w-xl space-y-6 my-auto py-8">
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              Question papers, thoughtfully generated.
            </h1>
            <p className="text-sm xl:text-base text-slate-600 leading-relaxed max-w-lg">
              Create curriculum-aligned examination papers for Classes 6–12 with intelligent question selection and Bloom’s Taxonomy mapping.
            </p>
          </div>

          {/* Understated Question Paper Visual */}
          <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 xl:p-6 space-y-4">
            {/* Paper Header */}
            <div className="border-b border-slate-100 pb-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                <span>Tamil Nadu State Board</span>
                <span>Annual Assessment</span>
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">Class 10 — Science (General)</h2>
                <span className="text-xs font-semibold text-slate-600">Max Marks: 75</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>Duration: 2.5 Hours</span>
                <span>•</span>
                <span>Subject Code: SCI-10</span>
              </div>
            </div>

            {/* Paper Section A */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Section A — Objective (1 Mark each)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">10 Marks</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1 text-xs text-slate-700">
                <p className="font-medium text-slate-800">
                  1. Which plant hormone promotes cell division in growing apical tissues?
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-600 pl-1">
                  <span>(A) Auxin</span>
                  <span>(B) Cytokinin</span>
                  <span>(C) Gibberellin</span>
                  <span>(D) Abscisic acid</span>
                </div>
                <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-600 font-medium">Biology • Unit 16</span>
                  <span className="text-slate-300">•</span>
                  <span>Bloom: Remembering</span>
                </div>
              </div>
            </div>

            {/* Paper Section B */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                  Section B — Short Answer (2 Marks each)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">20 Marks</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1 text-xs text-slate-700">
                <p className="font-medium text-slate-800">
                  2. State Snell's law of refraction and write its mathematical formula.
                </p>
                <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-600 font-medium">Physics • Unit 2</span>
                  <span className="text-slate-300">•</span>
                  <span>Bloom: Understanding</span>
                </div>
              </div>
            </div>

            {/* Understated Curriculum Metadata Footer */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Samacheer Kalvi Curriculum</span>
              </div>
              <span className="text-[11px] text-slate-400">Random Forest Verified</span>
            </div>
          </div>
        </div>

        {/* Bottom Trust Statement */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Designed for Tamil Nadu State Board education</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT PANEL — SIGN IN FORM                               */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 xl:w-[48%] flex items-center justify-center p-6 sm:p-12 xl:p-16 bg-white">
        <div className="w-full max-w-sm sm:max-w-md space-y-6">
          {/* Mobile-only Branding Header */}
          <div className="lg:hidden flex items-center gap-2.5 pb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                ExamForge <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200">AI</span>
              </div>
              <div className="text-[11px] text-slate-500">Tamil Nadu State Board Assessment</div>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500">
              Sign in to access your ExamForge workspace.
            </p>
          </div>

          {/* Error Message Box */}
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold tracking-wide transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure Access Footer Note */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Secure access for administrators and teachers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
