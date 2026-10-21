import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState(location.state?.registeredRole || 'admin');
  const [email, setEmail] = useState(location.state?.registeredEmail || 'admin@lumen.com');
  const [password, setPassword] = useState(location.state?.registeredEmail ? '' : 'password123');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState(
    location.state?.successMessage || ''
  );
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/profile';

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessNotice(location.state.successMessage);

      if (location.state.registeredEmail) {
        setEmail(location.state.registeredEmail);
        setPassword('');
      }
    }
  }, [location.state]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
    setSuccessNotice('');

    if (role === 'admin') {
      setEmail('admin@lumen.com');
      setPassword('password123');
    } else if (role === 'author') {
      setEmail('priya.mehta@lumen.com');
      setPassword('password123');
    } else {
      setEmail('reader@lumen.com');
      setPassword('password123');
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('password123');
    setSelectedRole(demoRole);
    setError('');
    setLoading(true);

    try {
      const res = await login(demoEmail, 'password123');

      if (res.success) {
        if (res.user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/profile', { replace: true });
        }
      } else {
        setError(
          res.message || 'Failed to sign in with demo credentials.'
        );
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await login(email.trim(), password);

      if (res.success) {
        if (res.user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (res.user.role === 'author') {
          navigate('/profile', { replace: true });
        } else {
          navigate(
            from === '/login' ? '/profile' : from,
            { replace: true }
          );
        }
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError(
        'Failed to connect to authentication service. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">

        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-[#1A382B] text-white flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>

          <h1 className="font-serif text-3xl font-bold text-stone-900 tracking-tight">
            Sign In to Lumen
          </h1>

          <p className="text-xs text-stone-600">
            Access your editorial account, articles, and community discussions
          </p>
        </div>

        {/* Quick Demo Fill Buttons Banner */}
        <div className="bg-[#1A382B] text-white rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <Sparkles className="w-4 h-4" />
            <span>One-Click Demo Instant Sign In</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">

            <button
              type="button"
              onClick={() =>
                handleQuickDemoLogin(
                  'admin@lumen.com',
                  'admin'
                )
              }
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-left transition"
            >
              <div className="font-bold text-white">
                Amara Silva
              </div>
              <div className="text-[10px] text-emerald-200">
                Admin Account
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleQuickDemoLogin(
                  'priya.mehta@lumen.com',
                  'author'
                )
              }
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-left transition"
            >
              <div className="font-bold text-white">
                Priya Mehta
              </div>
              <div className="text-[10px] text-emerald-200">
                Author Account
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleQuickDemoLogin(
                  'author@lumen.com',
                  'author'
                )
              }
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-left transition"
            >
              <div className="font-bold text-white">
                Thomas Okeke
              </div>
              <div className="text-[10px] text-emerald-200">
                Author Account
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleQuickDemoLogin(
                  'reader@lumen.com',
                  'reader'
                )
              }
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-left transition"
            >
              <div className="font-bold text-white">
                Lena Kaufmann
              </div>
              <div className="text-[10px] text-emerald-200">
                Reader Account
              </div>
            </button>

          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">

          {/* Success Banner */}
          {successNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />

              <div className="font-medium">
                {successNotice}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />

              <div className="font-medium">
                {error}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Email Address
              </label>

              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#EFECE6] border border-transparent rounded-xl text-xs sm:text-sm text-stone-900 placeholder-[#9E988D] focus:outline-none focus:bg-white focus:border-[#1A382B] focus:ring-2 focus:ring-[#1A382B]/20 transition"
                />

                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-800">
                  Password
                </label>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#EFECE6] border border-transparent rounded-xl text-xs sm:text-sm text-stone-900 placeholder-[#9E988D] focus:outline-none focus:bg-white focus:border-[#1A382B] focus:ring-2 focus:ring-[#1A382B]/20 transition"
                />

                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="p-1 text-stone-400 hover:text-stone-700 absolute right-3 top-2.5"
                  title={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#1A382B] hover:bg-[#11261D] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-stone-500 pt-3 border-t border-[#EDE8DF]">
            Don't have an account yet?{' '}

            <Link
              to="/register"
              className="text-[#1A382B] font-bold hover:underline"
            >
              Create an account
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;