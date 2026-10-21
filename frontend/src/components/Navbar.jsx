import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import TrustBadge from './trust/TrustBadge';

import {
  BookOpen,
  LayoutGrid,
  Search,
  PenLine,
  User,
  Bell,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  CheckCheck,
  Sparkles,
  Sun,
  Moon,
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

const Navbar = () => {
  const {
    user,
    isAuthenticated,
    isAuthor,
    isAdmin,
    logout,
    switchDemoUser,
  } = useAuth();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('lumen_dark_mode') === 'true';
  });

  const navigate = useNavigate();
  const location = useLocation();

  const userDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const roleSwitcherRef = useRef(null);

  const [notifications, setNotifications] = useState([]);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lumen_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lumen_dark_mode', 'false');
    }
  }, [darkMode]);

  const demoUsers = [
    {
      name: 'Priya Mehta',
      email: 'priya.mehta@lumen.com',
      role: 'Author',
      badge:
        'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      name: 'Thomas Okeke',
      email: 'author@lumen.com',
      role: 'Author',
      badge:
        'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      name: 'Amara Silva',
      email: 'admin@lumen.com',
      role: 'Admin',
      badge:
        'bg-purple-50 text-purple-800 border-purple-200',
    },
    {
      name: 'Lena Kaufmann',
      email: 'reader@lumen.com',
      role: 'Reader',
      badge:
        'bg-stone-100 text-stone-700 border-stone-200',
    },
  ];

  // Fetch notifications
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, location.pathname]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();

      if (
        response.data?.success &&
        response.data?.notifications
      ) {
        setNotifications(response.data.notifications);
      }
    } catch (err) {
      // Ignore notification errors
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          unread: false,
        }))
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);

      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === id
            ? {
                ...n,
                isRead: true,
                unread: false,
              }
            : n
        )
      );
    } catch (err) {
      console.error('Mark single read error:', err);
    }
  };

  const handleSwitchPersona = async (email) => {
    setRoleSwitcherOpen(false);
    await switchDemoUser(email);
    navigate('/');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }

      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target)
      ) {
        setNotifDropdownOpen(false);
      }

      if (
        roleSwitcherRef.current &&
        !roleSwitcherRef.current.contains(event.target)
      ) {
        setRoleSwitcherOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setNotifDropdownOpen(false);
    setRoleSwitcherOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';

    const parts = name.trim().split(' ');

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
  };

  // Active navigation states
  const isHomeActive = location.pathname === '/';
  const isBrowseActive =
    location.pathname.startsWith('/browse');
  const isDiscussionActive =
    location.pathname.startsWith('/discussions');
  const isChatActive =
    location.pathname.startsWith('/chat');
  const isWriteActive =
    location.pathname.startsWith('/write');
  const isQuizBuilderActive =
    location.pathname.startsWith('/quiz-builder');
  const isAdminActive =
    location.pathname.startsWith('/admin');
  const isProfileActive =
    location.pathname === '/profile';

  // Support both notification data formats
  const unreadCount = notifications.filter(
    (n) => !n.isRead || n.unread
  ).length;

  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: LayoutGrid,
      active: isHomeActive,
    },
    {
      to: '/browse',
      label: 'Browse',
      icon: Search,
      active: isBrowseActive,
    },
    {
      to: '/discussions',
      label: 'Discussions',
      icon: MessageSquare,
      active: isDiscussionActive,
    },
    {
      to: '/chat',
      label: 'Chat',
      icon: MessageSquare,
      active: isChatActive,
      show: isAuthenticated,
    },
    {
      to: '/write',
      label: 'Write',
      icon: PenLine,
      active: isWriteActive,
      show: isAuthor || isAdmin,
    },
    {
      to: '/quiz-builder',
      label: 'Quizzes',
      icon: BookOpen,
      active: isQuizBuilderActive,
      show: isAuthor || isAdmin,
    },
    {
      to: '/admin',
      label: 'Admin',
      mobileLabel: 'Admin Center',
      icon: ShieldCheck,
      iconClass: 'text-emerald-700',
      active: isAdminActive,
      show: isAdmin,
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User,
      active: isProfileActive,
      show: isAuthenticated,
    },
  ];


  return (
    <nav className="sticky top-0 z-50 bg-[#FAF7F2]/95 dark:bg-[#121614]/95 backdrop-blur-md border-b border-[#EDE8DF] dark:border-[#2D3732] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3.5">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1A382B] flex items-center justify-center text-white shadow-xs group-hover:bg-[#11261D] transition">
              <BookOpen className="w-4 h-4" />
            </div>

            <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Lumen
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1.5">
            {navItems
              .filter(({ show }) => show !== false)
              .map(
                ({
                  to,
                  label,
                  icon: Icon,
                  iconClass,
                  active,
                }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                      active
                        ? 'bg-[#1A382B] text-white shadow-xs font-semibold'
                        : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-[#EFECE6]/70 dark:hover:bg-[#242C28]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        iconClass || ''
                      }`}
                    />

                    {label}
                  </Link>
                )
              )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">

            {/* Dark Mode */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full text-stone-600 dark:text-stone-300 hover:bg-[#EFECE6] dark:hover:bg-[#242C28] transition"
              title={
                darkMode
                  ? 'Switch to Light Mode'
                  : 'Switch to Dark Mode'
              }
            >
              {darkMode ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5" />
              )}
            </button>

            {/* Demo Persona Switcher */}
            <div
              className="relative"
              ref={roleSwitcherRef}
            >
              <button
                type="button"
                onClick={() =>
                  setRoleSwitcherOpen(
                    !roleSwitcherOpen
                  )
                }
                className="hidden lg:flex items-center gap-1.5 bg-[#EFECE6] dark:bg-[#242C28] hover:bg-[#E7E2D9] px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 border border-[#E2DDD3] dark:border-[#2D3732] transition"
                title="Switch Demo Persona"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
                <span>Demo Switcher</span>
                <ChevronDown className="w-3 h-3 text-stone-500" />
              </button>

              {roleSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1C221F] border border-[#EDE8DF] dark:border-[#2D3732] rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#EDE8DF] dark:border-[#2D3732]">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Demo Persona Switcher
                    </p>

                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Select persona to test role-specific UI
                    </p>
                  </div>

                  <div className="py-1">
                    {demoUsers.map((u) => (
                      <button
                        key={u.email}
                        onClick={() =>
                          handleSwitchPersona(u.email)
                        }
                        className={`w-full flex items-center justify-between px-4 py-2 text-xs hover:bg-[#FAF7F2] dark:hover:bg-[#242C28] transition text-left ${
                          user?.email === u.email
                            ? 'bg-[#FAF7F2] dark:bg-[#242C28] font-bold'
                            : ''
                        }`}
                      >
                        <div>
                          <span className="font-bold text-stone-900 dark:text-stone-100 block">
                            {u.name}
                          </span>

                          <span className="text-[10px] text-stone-400 font-mono">
                            {u.email}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${u.badge}`}
                        >
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <>
                {/* User Dropdown */}
                <div
                  className="relative"
                  ref={userDropdownRef}
                >
                  <button
                    onClick={() =>
                      setUserDropdownOpen(
                        !userDropdownOpen
                      )
                    }
                    className="flex items-center gap-2 bg-[#EFECE6] dark:bg-[#242C28] hover:bg-[#E7E2D9] px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-800 dark:text-stone-200 border border-[#E2DDD3] dark:border-[#2D3732] transition shadow-2xs"
                  >
                    <span className="truncate max-w-[140px] sm:max-w-[180px]">
                      {user?.name}
                    </span>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-stone-300/60 dark:bg-stone-700 text-stone-700 dark:text-stone-200">
                      {user?.role}
                    </span>

                    <TrustBadge score={user?.trustScore ?? 50} level={user?.trustLevel} size="sm" variant="compact" />

                    <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1C221F] border border-[#EDE8DF] dark:border-[#2D3732] rounded-2xl shadow-xl py-2 z-50">

                      <div className="px-4 py-2.5 border-b border-[#EDE8DF] dark:border-[#2D3732] mb-1">
                        <p className="text-[11px] text-stone-500">
                          Signed in as
                        </p>

                        <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                          {user?.name}
                        </p>

                        <p className="text-xs text-stone-500 truncate">
                          {user?.email}
                        </p>
                      </div>

                      {/* Profile */}
                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-[#242C28] transition"
                      >
                        <User className="w-4 h-4 text-stone-500" />
                        My Profile
                      </Link>

                      {/* Report Appeals */}
                      <Link
                        to="/my-appeals"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-[#242C28] transition"
                      >
                        <ShieldAlert className="w-4 h-4 text-stone-500" />
                        Report Appeals
                      </Link>

                      {/* Discussions */}
                      <Link
                        to="/discussions"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-[#242C28] transition"
                      >
                        <MessageSquare className="w-4 h-4 text-stone-500" />
                        Community Discussions
                      </Link>

                      {/* Write Article */}
                      {(isAuthor || isAdmin) && (
                        <Link
                          to="/write"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-[#242C28] transition"
                        >
                          <PenLine className="w-4 h-4 text-[#1A382B]" />
                          Write New Article
                        </Link>
                      )}

                      {/* Admin */}
                      {isAdmin && (
                        <>
                          <Link
                            to="/admin"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-[#242C28] transition"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#1A382B]" />
                            Admin Center
                          </Link>

                          <Link
                            to="/admin?tab=appeals"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-[#242C28] transition"
                          >
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                            Appeals Queue
                          </Link>

                          <Link
                            to="/admin?tab=spam"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-[#242C28] transition"
                          >
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            Spam & Abuse
                          </Link>
                        </>
                      )}

                      <div className="my-1 border-t border-[#EDE8DF] dark:border-[#2D3732]" />

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div
                  className="relative"
                  ref={notifDropdownRef}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setNotifDropdownOpen(
                        !notifDropdownOpen
                      )
                    }
                    className="relative p-2 rounded-full text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-[#EFECE6] dark:hover:bg-[#242C28] transition"
                    title="Notifications"
                  >
                    <Bell className="w-4.5 h-4.5" />

                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D97736] rounded-full ring-2 ring-[#FAF7F2]" />
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1C221F] border border-[#EDE8DF] dark:border-[#2D3732] rounded-2xl shadow-xl overflow-hidden z-50">

                      <div className="px-4 py-3 border-b border-[#EDE8DF] dark:border-[#2D3732] flex items-center justify-between bg-[#FAF7F2] dark:bg-[#121614]">
                        <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                          Notifications
                        </span>

                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] font-semibold text-[#1A382B] dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <CheckCheck className="w-3 h-3" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="divide-y divide-[#EDE8DF] dark:divide-[#2D3732] max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-stone-400">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((n) => {
                            const notificationId =
                              n._id || n.id;

                            const isUnread =
                              !n.isRead || n.unread;

                            return (
                              <div
                                key={notificationId}
                                onClick={() => {
                                  handleMarkSingleRead(
                                    notificationId
                                  );

                                  if (n.link) {
                                    navigate(n.link);
                                  }
                                }}
                                className={`p-3.5 hover:bg-[#FAF7F2] dark:hover:bg-[#242C28] transition text-xs cursor-pointer ${
                                  isUnread
                                    ? 'bg-amber-50/40 dark:bg-amber-950/20'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-stone-900 dark:text-stone-100">
                                    {n.title}
                                  </p>

                                  {isUnread && (
                                    <span className="w-1.5 h-1.5 bg-[#D97736] rounded-full" />
                                  )}
                                </div>

                                <p className="text-stone-600 dark:text-stone-300 mt-0.5">
                                  {n.message}
                                </p>

                                <span className="text-[10px] text-stone-400 mt-1 block">
                                  {n.createdAt
                                    ? new Date(
                                        n.createdAt
                                      ).toLocaleDateString()
                                    : 'Just now'}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <Link
                  to="/profile"
                  title="View Profile"
                  className="w-8 h-8 rounded-full bg-[#1A382B] text-white flex items-center justify-center text-xs font-serif font-bold shadow-xs hover:bg-[#11261D] transition"
                >
                  {getInitials(user?.name)}
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-950 rounded-xl hover:bg-[#EFECE6]/70 dark:hover:bg-[#242C28] transition"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="px-4 py-1.5 text-xs font-bold bg-[#1A382B] hover:bg-[#11261D] text-white rounded-xl shadow-xs transition"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)
              }
              className="md:hidden p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-[#EFECE6] dark:hover:bg-[#242C28]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#EDE8DF] dark:border-[#2D3732] bg-[#FAF7F2] dark:bg-[#121614] px-4 py-3 space-y-1.5">
          {navItems
            .filter(
              ({ show, to }) =>
                show !== false && to !== '/profile'
            )
            .map(
              ({
                to,
                label,
                mobileLabel,
                icon: Icon,
              }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 hover:bg-[#EFECE6] dark:hover:bg-[#242C28]"
                >
                  <Icon className="w-4 h-4" />
                  {mobileLabel || label}
                </Link>
              )
            )}

          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 hover:bg-[#EFECE6] dark:hover:bg-[#242C28]"
              >
                <User className="w-4 h-4" />
                Profile ({user?.role})
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-[#EDE8DF] dark:border-[#2D3732] flex gap-2">
              <Link
                to="/login"
                className="flex-1 text-center py-2 text-xs font-semibold bg-[#EFECE6] dark:bg-[#242C28] text-stone-800 dark:text-stone-200 rounded-xl"
              >
                Sign In
              </Link>

              <Link
                to="/register"
                className="flex-1 text-center py-2 text-xs font-bold bg-[#1A382B] text-white rounded-xl"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;