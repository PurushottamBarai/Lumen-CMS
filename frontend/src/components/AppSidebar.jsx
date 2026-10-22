import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import TrustBadge from './trust/TrustBadge';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CheckCheck,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  PenLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  ClipboardCheck,
  Sparkles,
  Sun,
  User,
  X,
} from 'lucide-react';

const demoUsers = [
  { name: 'Priya Mehta', email: 'priya.mehta@lumen.com', role: 'Author', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { name: 'Thomas Okeke', email: 'author@lumen.com', role: 'Author', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { name: 'Amara Silva', email: 'admin@lumen.com', role: 'Admin', badge: 'bg-purple-50 text-purple-800 border-purple-200' },
  { name: 'Lena Kaufmann', email: 'reader@lumen.com', role: 'Reader', badge: 'bg-stone-100 text-stone-700 border-stone-200' },
];

export default function AppSidebar() {
  const { user, isAuthenticated, isAuthor, isAdmin, logout, switchDemoUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('lumen_dark_mode') === 'true');
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const mobileSidebarRef = useRef(null);
  const mobileToggleRef = useRef(null);
  const mobileCloseRef = useRef(null);
  const accountRef = useRef(null);
  const notificationRef = useRef(null);
  const personaRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('lumen_dark_mode', String(darkMode));
  }, [darkMode]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      if (response.data?.success && response.data?.notifications) {
        setNotifications(response.data.notifications);
      }
    } catch (_) {
      // Keep navigation available when notifications are temporarily unavailable.
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
  }, [isAuthenticated, location.pathname]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    window.requestAnimationFrame(() => mobileToggleRef.current?.focus());
  };

  useEffect(() => {
    setOpenPanel(null);
    if (mobileMenuOpen) closeMobileMenu();
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (mobileMenuOpen) mobileCloseRef.current?.focus();
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen && !openPanel) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenPanel(null);
        if (mobileMenuOpen) closeMobileMenu();
      }
      if (mobileMenuOpen && event.key === 'Tab' && mobileSidebarRef.current) {
        const focusable = [...mobileSidebarRef.current.querySelectorAll('a[href], button:not([disabled])')]
          .filter((element) => element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, openPanel]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (![accountRef, notificationRef, personaRef].some((ref) => ref.current?.contains(event.target))) {
        setOpenPanel(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    closeMobileMenu();
    navigate('/login');
  };

  const handleSwitchPersona = async (email) => {
    setOpenPanel(null);
    closeMobileMenu();
    await switchDemoUser(email);
    navigate('/');
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((previous) => previous.map((notification) => ({ ...notification, isRead: true, unread: false })));
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((previous) => previous.map((notification) => (
        (notification._id || notification.id) === id
          ? { ...notification, isRead: true, unread: false }
          : notification
      )));
    } catch (error) {
      console.error('Mark single read error:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const navItems = [
    { to: '/', label: 'Home', icon: LayoutGrid, active: location.pathname === '/' },
    { to: '/browse', label: 'Browse', icon: Search, active: location.pathname.startsWith('/browse') },
    { to: '/discussions', label: 'Discussions', icon: MessageSquare, active: location.pathname.startsWith('/discussions') },
    { to: '/chat', label: 'Chat', icon: MessageSquare, active: location.pathname.startsWith('/chat'), show: isAuthenticated },
    { to: '/write', label: 'Write', icon: PenLine, active: location.pathname.startsWith('/write'), show: isAuthor || isAdmin },
    { to: '/quiz-builder', label: 'Quizzes', icon: BookOpen, active: location.pathname.startsWith('/quiz-builder'), show: isAuthor || isAdmin },
    { to: '/admin', label: 'Admin', icon: ShieldCheck, active: location.pathname === '/admin', show: isAdmin, iconClass: 'text-emerald-700' },
    { to: '/admin/verification', label: 'Verification', icon: ClipboardCheck, active: location.pathname === '/admin/verification', show: isAdmin },
    { to: '/profile', label: 'Profile', icon: User, active: location.pathname === '/profile', show: isAuthenticated },
  ];

  const unreadCount = notifications.filter((notification) => !notification.isRead || notification.unread).length;

  const renderSidebar = (mobile = false) => (
    <>
      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#EDE8DF] px-5 dark:border-[#2D3732]">
        <Link to="/" onClick={mobile ? closeMobileMenu : undefined} className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A382B] text-white shadow-sm transition group-hover:bg-[#11261D]"><BookOpen className="h-4 w-4" /></span>
          <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Lumen</span>
        </Link>
        {mobile && <button ref={mobileCloseRef} type="button" onClick={closeMobileMenu} aria-label="Close navigation" className="rounded-xl p-2 text-stone-600 hover:bg-[#EFECE6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1A382B] dark:text-stone-300 dark:hover:bg-[#242C28]"><X className="h-5 w-5" /></button>}
        {!mobile && <span className="rounded-md bg-[#EFECE6] px-2 py-1 text-[10px] font-semibold text-stone-600 dark:bg-[#242C28] dark:text-stone-300">CMS</span>}
      </div>

      <nav aria-label="Main navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.filter(({ show }) => show !== false).map(({ to, label, icon: Icon, active, iconClass }) => (
          <Link
            key={to}
            to={to}
            onClick={mobile ? closeMobileMenu : undefined}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1A382B] ${active ? 'bg-[#1A382B] font-semibold text-white shadow-sm' : 'text-stone-700 hover:bg-[#EFECE6] hover:text-stone-950 dark:text-stone-300 dark:hover:bg-[#242C28] dark:hover:text-white'}`}
          >
            <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? '' : (iconClass || '')}`} />
            <span className="min-w-0 flex-1">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="shrink-0 border-t border-[#EDE8DF] p-3 dark:border-[#2D3732]">
        <div className="mb-2 flex items-center gap-2">
          <button type="button" onClick={() => setDarkMode((mode) => !mode)} title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} className="flex h-10 flex-1 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-stone-600 hover:bg-[#EFECE6] dark:text-stone-300 dark:hover:bg-[#242C28]">
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}{darkMode ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="relative" ref={personaRef}>
            <button type="button" aria-haspopup="true" aria-expanded={openPanel === 'personas'} onClick={() => setOpenPanel((panel) => panel === 'personas' ? null : 'personas')} title="Switch Demo Persona" className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-stone-600 hover:bg-[#EFECE6] dark:text-stone-300 dark:hover:bg-[#242C28]"><Sparkles className="h-4 w-4 text-[#D97736]" /><span className="hidden lg:inline">Demo</span><ChevronDown className="h-3 w-3" /></button>
            {openPanel === 'personas' && <div className="absolute bottom-full left-0 z-[140] mb-2 max-h-[65vh] w-[min(19rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-[#EDE8DF] bg-white py-2 shadow-xl dark:border-[#2D3732] dark:bg-[#1C221F]">
              <div className="border-b border-[#EDE8DF] px-4 py-2 dark:border-[#2D3732]"><p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Demo Persona Switcher</p><p className="text-xs text-stone-500 dark:text-stone-400">Select persona to test role-specific UI</p></div>
              {demoUsers.map((demoUser) => <button key={demoUser.email} type="button" onClick={() => handleSwitchPersona(demoUser.email)} className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-xs transition hover:bg-[#FAF7F2] dark:hover:bg-[#242C28] ${user?.email === demoUser.email ? 'bg-[#FAF7F2] font-bold dark:bg-[#242C28]' : ''}`}><span className="min-w-0"><span className="block truncate font-bold text-stone-900 dark:text-stone-100">{demoUser.name}</span><span className="block truncate font-mono text-[10px] text-stone-400">{demoUser.email}</span></span><span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${demoUser.badge}`}>{demoUser.role}</span></button>)}
            </div>}
          </div>
        </div>

        {isAuthenticated ? <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="relative min-w-0" ref={accountRef}>
            <button type="button" aria-haspopup="true" aria-expanded={openPanel === 'account'} onClick={() => setOpenPanel((panel) => panel === 'account' ? null : 'account')} className="flex min-h-12 w-full min-w-0 items-center gap-2 rounded-xl px-2 text-left hover:bg-[#EFECE6] dark:hover:bg-[#242C28]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1A382B] text-xs font-bold text-white">{getInitials(user?.name)}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-stone-900 dark:text-stone-100">{user?.name}</span><span className="block text-[10px] capitalize text-stone-500">{user?.role}</span></span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-500" />
            </button>
            {openPanel === 'account' && <div className="absolute bottom-full left-0 z-[140] mb-2 max-h-[65vh] w-full min-w-60 overflow-y-auto rounded-2xl border border-[#EDE8DF] bg-white py-2 shadow-xl dark:border-[#2D3732] dark:bg-[#1C221F]">
              <div className="mb-1 border-b border-[#EDE8DF] px-4 py-2.5 dark:border-[#2D3732]"><p className="text-[11px] text-stone-500">Signed in as</p><p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">{user?.name}</p><p className="truncate text-xs text-stone-500">{user?.email}</p>{user && <TrustBadge score={user.trustScore ?? 50} level={user.trustLevel} size="sm" variant="compact" />}</div>
              <Link onClick={mobile ? closeMobileMenu : undefined} to="/profile" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-[#FAF7F2] dark:text-stone-300 dark:hover:bg-[#242C28]"><User className="h-4 w-4 text-stone-500" />My Profile</Link>
              <Link onClick={mobile ? closeMobileMenu : undefined} to="/my-appeals" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-[#FAF7F2] dark:text-stone-300 dark:hover:bg-[#242C28]"><ShieldAlert className="h-4 w-4 text-stone-500" />Report Appeals</Link>
              <Link onClick={mobile ? closeMobileMenu : undefined} to="/discussions" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-[#FAF7F2] dark:text-stone-300 dark:hover:bg-[#242C28]"><MessageSquare className="h-4 w-4 text-stone-500" />Community Discussions</Link>
              {(isAuthor || isAdmin) && <Link onClick={mobile ? closeMobileMenu : undefined} to="/write" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-[#FAF7F2] dark:text-stone-300 dark:hover:bg-[#242C28]"><PenLine className="h-4 w-4 text-[#1A382B]" />Write New Article</Link>}
              {isAdmin && <><Link onClick={mobile ? closeMobileMenu : undefined} to="/admin" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-[#FAF7F2] dark:text-stone-300 dark:hover:bg-[#242C28]"><ShieldCheck className="h-4 w-4 text-[#1A382B]" />Admin Center</Link><Link onClick={mobile ? closeMobileMenu : undefined} to="/admin?tab=appeals" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-[#FAF7F2] dark:text-stone-300 dark:hover:bg-[#242C28]"><ShieldAlert className="h-4 w-4 text-amber-600" />Appeals Queue</Link><Link onClick={mobile ? closeMobileMenu : undefined} to="/admin?tab=spam" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-[#FAF7F2] dark:text-stone-300 dark:hover:bg-[#242C28]"><AlertTriangle className="h-4 w-4 text-rose-600" />Spam &amp; Abuse</Link></>}
              <div className="my-1 border-t border-[#EDE8DF] dark:border-[#2D3732]" /><button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"><LogOut className="h-4 w-4" />Sign Out</button>
            </div>}
          </div>
          <div className="relative" ref={notificationRef}>
            <button type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-haspopup="true" aria-expanded={openPanel === 'notifications'} onClick={() => setOpenPanel((panel) => panel === 'notifications' ? null : 'notifications')} className="relative rounded-xl p-2.5 text-stone-600 hover:bg-[#EFECE6] dark:text-stone-300 dark:hover:bg-[#242C28]"><Bell className="h-4.5 w-4.5" />{unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#D97736] ring-2 ring-[#FAF7F2]" />}</button>
            {openPanel === 'notifications' && <div className="absolute bottom-full right-0 z-[140] mb-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#EDE8DF] bg-white shadow-xl dark:border-[#2D3732] dark:bg-[#1C221F]"><div className="flex items-center justify-between border-b border-[#EDE8DF] bg-[#FAF7F2] px-4 py-3 dark:border-[#2D3732] dark:bg-[#121614]"><span className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100">Notifications</span>{unreadCount > 0 && <button type="button" onClick={handleMarkAllRead} className="flex items-center gap-1 text-[11px] font-semibold text-[#1A382B] hover:underline dark:text-emerald-400"><CheckCheck className="h-3 w-3" />Mark all read</button>}</div><div className="max-h-64 divide-y divide-[#EDE8DF] overflow-y-auto dark:divide-[#2D3732]">{notifications.length === 0 ? <div className="p-4 text-center text-xs text-stone-400">No notifications yet.</div> : notifications.map((notification) => { const id = notification._id || notification.id; const unread = !notification.isRead || notification.unread; return <button type="button" key={id} onClick={() => { handleMarkSingleRead(id); setOpenPanel(null); if (notification.link) navigate(notification.link); }} className={`block w-full p-3.5 text-left text-xs transition hover:bg-[#FAF7F2] dark:hover:bg-[#242C28] ${unread ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}`}><span className="flex items-center justify-between"><span className="font-bold text-stone-900 dark:text-stone-100">{notification.title}</span>{unread && <span className="h-1.5 w-1.5 rounded-full bg-[#D97736]" />}</span><span className="mt-0.5 block text-stone-600 dark:text-stone-300">{notification.message}</span><span className="mt-1 block text-[10px] text-stone-400">{notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'Just now'}</span></button>; })}</div></div>}
          </div>
        </div> : <div className="flex gap-2">
          <Link onClick={mobile ? closeMobileMenu : undefined} to="/login" className="flex-1 rounded-xl bg-[#EFECE6] px-3 py-2 text-center text-xs font-semibold text-stone-800 hover:bg-[#E7E2D9] dark:bg-[#242C28] dark:text-stone-200">Sign In</Link>
          <Link onClick={mobile ? closeMobileMenu : undefined} to="/register" className="flex-1 rounded-xl bg-[#1A382B] px-3 py-2 text-center text-xs font-bold text-white hover:bg-[#11261D]">Get Started</Link>
        </div>}
      </div>
      {!mobile && <p className="shrink-0 px-4 pb-3 text-center text-[10px] text-stone-400">Lumen Content Management System</p>}
    </>
  );

  return <>
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#EDE8DF] bg-[#FAF7F2] backdrop-blur-md transition-colors dark:border-[#2D3732] dark:bg-[#121614] md:flex" aria-label="Application sidebar">
      {renderSidebar()}
    </aside>

    <div className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-[#EDE8DF] bg-[#FAF7F2]/95 px-4 backdrop-blur-md dark:border-[#2D3732] dark:bg-[#121614]/95 md:hidden">
      <Link to="/" className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A382B] text-white"><BookOpen className="h-4 w-4" /></span><span className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">Lumen</span></Link>
      <button ref={mobileToggleRef} type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation" aria-expanded={mobileMenuOpen} aria-controls="lumen-mobile-sidebar" className="rounded-xl p-2 text-stone-700 hover:bg-[#EFECE6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1A382B] dark:text-stone-300 dark:hover:bg-[#242C28]"><Menu className="h-5 w-5" /></button>
    </div>

    {mobileMenuOpen && <div className="fixed inset-0 z-[130] md:hidden">
      <button type="button" aria-label="Close navigation" onClick={closeMobileMenu} className="absolute inset-0 h-full w-full bg-stone-950/40" />
      <aside id="lumen-mobile-sidebar" ref={mobileSidebarRef} role="dialog" aria-modal="true" aria-label="Application navigation" className="relative z-10 flex h-full w-[min(20rem,86vw)] flex-col border-r border-[#EDE8DF] bg-[#FAF7F2] shadow-2xl dark:border-[#2D3732] dark:bg-[#121614]">
        {renderSidebar(true)}
      </aside>
    </div>}
  </>;
}
