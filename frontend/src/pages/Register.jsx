import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, PenLine, Mail, Lock, Eye, EyeOff, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('reader');
  const [bio, setBio] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    if (name.trim().length > 100) {
      setError('Name cannot exceed 100 characters.');
      return;
    }

    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await register(name.trim(), email.trim(), password, role, bio.trim());
      if (res.success) {
        // Navigate back to login page with prefilled credentials & success banner
        navigate('/login', {
          state: {
            successMessage: `Account created successfully for ${name.trim()}! Please sign in with your password.`,
            registeredEmail: email.trim(),
            registeredRole: role,
          },
          replace: true,
        });
      } else {
        setError(res.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network or server error during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-[#1A382B] text-white flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 tracking-tight">
            Create Lumen Account
          </h1>
          <p className="text-xs text-stone-600">
            Join as a reader to test your knowledge or an author to publish editorial pieces
          </p>
        </div>

        {/* Register Form Card */}
        <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-2">
                Choose Account Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('reader')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition ${
                    role === 'reader'
                      ? 'bg-[#1A382B] text-white border-[#1A382B] shadow-xs'
                      : 'bg-[#FAF7F2] text-stone-700 border-[#EDE8DF] hover:bg-[#EFECE6]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xs font-bold">Reader</span>
                  </div>
                  <span className={`text-[11px] ${role === 'reader' ? 'text-white/80' : 'text-stone-500'}`}>
                    Read articles & take quizzes
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('author')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition ${
                    role === 'author'
                      ? 'bg-[#1A382B] text-white border-[#1A382B] shadow-xs'
                      : 'bg-[#FAF7F2] text-stone-700 border-[#EDE8DF] hover:bg-[#EFECE6]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PenLine className="w-4 h-4" />
                    <span className="text-xs font-bold">Author</span>
                  </div>
                  <span className={`text-[11px] ${role === 'author' ? 'text-white/80' : 'text-stone-500'}`}>
                    Write pieces & create quizzes
                  </span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Thomas Okeke"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#EFECE6] border border-transparent rounded-xl text-xs sm:text-sm text-stone-900 placeholder-[#9E988D] focus:outline-none focus:bg-white focus:border-[#1A382B] focus:ring-2 focus:ring-[#1A382B]/20 transition"
                />
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              </div>
            </div>

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

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Password (min. 6 chars)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 bg-[#EFECE6] border border-transparent rounded-xl text-xs sm:text-sm text-stone-900 placeholder-[#9E988D] focus:outline-none focus:bg-white focus:border-[#1A382B] focus:ring-2 focus:ring-[#1A382B]/20 transition"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-stone-400 hover:text-stone-700 absolute right-2.5 top-2.5"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#EFECE6] border border-transparent rounded-xl text-xs sm:text-sm text-stone-900 placeholder-[#9E988D] focus:outline-none focus:bg-white focus:border-[#1A382B] focus:ring-2 focus:ring-[#1A382B]/20 transition"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            {/* Bio (Optional) */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Bio / Tagline <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Short bio about your background, interests, or expertise..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#EFECE6] border border-transparent rounded-xl text-xs text-stone-900 placeholder-[#9E988D] focus:outline-none focus:bg-white focus:border-[#1A382B] focus:ring-2 focus:ring-[#1A382B]/20 transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#1A382B] hover:bg-[#11261D] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-stone-500 pt-3 border-t border-[#EDE8DF]">
            Already have a Lumen account?{' '}
            <Link to="/login" className="text-[#1A382B] font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
