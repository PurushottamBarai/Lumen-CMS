import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { articleAPI } from '../../services/api';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, BookOpen, Bot,
  CheckCircle2, ChevronDown, ChevronRight, CreditCard, FileText, Flag,
  Gavel, LayoutDashboard, LoaderCircle, LogOut, Menu, MessageSquare,
  RefreshCw, Search, ShieldAlert, ShieldCheck, SlidersHorizontal, Users, X,
} from 'lucide-react';

const navigation = [
  { heading: 'MAIN', items: [
    { id: 'overview', label: 'Admin Overview', icon: LayoutDashboard },
    { id: 'articles', label: 'Articles', icon: FileText },
    { id: 'quizbuilder', label: 'Quiz Builder', icon: FileText },
    { id: 'quizzes', label: 'Quizzes', icon: BookOpen },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
  ] },
  { heading: 'MODERATION & TRUST', items: [
    { id: 'topic-trends', label: 'Topic & Trends', icon: Bot, active: true },
    { id: 'moderation', label: 'AI Moderation', icon: Bot },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'verification', label: 'Content Verification', icon: ShieldCheck },
    { id: 'appeals', label: 'Appeals', icon: Gavel },
    { id: 'spam', label: 'Spam & Abuse', icon: ShieldAlert },
  ] },
  { heading: 'AUDIENCE & SETTINGS', items: [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  ] },
];

const trendStyle = {
  Rising: 'bg-emerald-50 text-emerald-800',
  Steady: 'bg-blue-50 text-blue-800',
  Cooling: 'bg-amber-50 text-amber-800',
  'Insufficient data': 'bg-slate-100 text-slate-600',
};

const formatMetric = (value) => Number(value || 0).toLocaleString();

export default function TopicTrendsDashboard({ user, onNavigate }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [topics, setTopics] = useState([]);
  const [methodology, setMethodology] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [trend, setTrend] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await articleAPI.getTopicTrends();
        const data = response.data;
        if (!data?.success) throw new Error(data?.message || 'Could not load topic trends.');
        if (!cancelled) {
          setTopics(Array.isArray(data.topics) ? data.topics : []);
          setMethodology(data.trendBasis || '');
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Could not load topic trends.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [retry]);

  const categories = useMemo(() => [...new Set(topics.flatMap((topic) => topic.categories || []))].sort(), [topics]);
  const filteredTopics = useMemo(() => topics.filter((topic) => {
    const searchText = [topic.name, ...(topic.keywords || []), ...(topic.articles || []).map((article) => article.title)].join(' ').toLowerCase();
    return (!query.trim() || searchText.includes(query.trim().toLowerCase()))
      && (category === 'all' || (topic.categories || []).includes(category))
      && (trend === 'all' || topic.trend === trend);
  }), [topics, query, category, trend]);

  const counts = useMemo(() => ({
    rising: topics.filter((topic) => topic.trend === 'Rising').length,
    steady: topics.filter((topic) => topic.trend === 'Steady').length,
    cooling: topics.filter((topic) => topic.trend === 'Cooling').length,
    popular: topics.filter((topic) => topic.popular).length,
  }), [topics]);

  const handleNavigate = (id) => {
    setMobileMenuOpen(false);
    if (id === 'verification') {
      navigate('/admin/verification');
      return;
    }
    if (id === 'quizbuilder') {
      navigate('/quiz-builder');
      return;
    }
    onNavigate(id);
  };

  const sidebar = (
    <aside className="flex h-full w-[280px] shrink-0 flex-col bg-[#203247] text-slate-200 xl:w-[325px]">
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white"><BookOpen className="h-4 w-4" /></span>
          <span className="text-lg font-bold tracking-tight text-white">Lumen</span>
        </div>
        <span className="rounded-md bg-slate-500/50 px-2 py-1 text-xs font-semibold text-white">CMS</span>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5" aria-label="Admin navigation">
        {navigation.map((group) => (
          <section key={group.heading}>
            <h2 className="mb-2 px-2 text-xs font-bold tracking-wide text-slate-300">{group.heading}</h2>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return <button key={item.id} type="button" onClick={() => handleNavigate(item.id)} aria-current={item.active ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${item.active ? 'bg-[#2863eb] text-white shadow-sm' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}>
                  <Icon className="h-[18px] w-[18px] shrink-0" /><span className="min-w-0 flex-1">{item.label}</span>{item.active && <span className="rounded bg-blue-500/60 px-1.5 py-0.5 text-[10px] font-semibold">Live</span>}
                </button>;
              })}
            </div>
          </section>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4 text-xs text-slate-400">Lumen Content Management System</div>
    </aside>
  );

  const statCards = [
    { title: 'Rising Topics', count: counts.rising, description: 'Topics with more published articles in the latest 7-day period.', color: 'emerald', icon: ArrowUpRight },
    { title: 'Steady Topics', count: counts.steady, description: 'Topics with similar publication frequency across both periods.', color: 'amber', icon: CheckCircle2 },
    { title: 'Cooling Topics', count: counts.cooling, description: 'Topics with fewer published articles in the latest 7-day period.', color: 'rose', icon: ArrowDownRight },
  ];

  return <div className="fixed inset-0 z-[100] flex min-h-screen overflow-hidden bg-[#f5f7fd] font-sans text-[#10213b]">
    <div className="hidden h-full md:flex">{sidebar}</div>
    {mobileMenuOpen && <div className="fixed inset-0 z-[120] flex md:hidden"><button className="absolute inset-0 bg-slate-950/40" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />{sidebar}<button onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" className="absolute right-3 top-3 rounded-md bg-white p-2 text-slate-700"><X className="h-5 w-5" /></button></div>}
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-[#e4e9f2] bg-white px-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-2 text-sm"><button className="mr-1 rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button><span className="text-slate-600">Admin</span><ChevronRight className="h-4 w-4 text-blue-700" /><span className="truncate font-semibold text-[#0e1c32]">Topic &amp; Trend Detection</span></div>
        <div className="flex items-center gap-3 sm:gap-5">
          <label className="relative hidden w-64 items-center lg:flex xl:w-80"><Search className="absolute left-3 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics, keywords" className="w-full rounded-lg border border-[#ced8eb] bg-[#f4f7ff] py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-slate-500 focus:border-blue-500" /></label>
          <span className="hidden h-7 w-px bg-slate-200 sm:block" />
          <div className="relative"><button type="button" onClick={() => setProfileMenuOpen((open) => !open)} className="flex items-center gap-3 rounded-lg p-1.5 text-left hover:bg-slate-50"><span className="grid h-10 w-10 place-items-center rounded-full bg-blue-700 text-white"><Users className="h-5 w-5" /></span><span className="hidden leading-tight sm:block"><span className="block max-w-40 truncate text-sm font-semibold text-[#0e1c32]">{user?.name || 'Administrator'}</span><span className="block text-xs capitalize text-slate-600">{user?.role || 'Admin'}</span></span><ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" /></button>{profileMenuOpen && <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"><button onClick={async () => { await logout(); navigate('/login'); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"><LogOut className="h-4 w-4" />Sign out</button></div>}</div>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-[1600px] space-y-6 lg:space-y-7">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div><h1 className="text-3xl font-bold tracking-tight text-[#101c30] sm:text-4xl">Topic &amp; Trend Detection</h1><p className="mt-1.5 text-sm text-slate-600 sm:text-base">Understand which subjects are gaining attention across published articles.</p></div>
            <button type="button" onClick={() => setRetry((value) => value + 1)} disabled={loading} className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#2863eb] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh trends</button>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-4 xl:gap-5">
            {statCards.map((card) => { const Icon = card.icon; return <article key={card.title} className="min-h-[148px] rounded-2xl border border-[#edf0f6] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6"><div className="flex items-start justify-between"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${card.color === 'emerald' ? 'bg-emerald-50 text-emerald-800' : card.color === 'amber' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'}`}><span className={`h-2 w-2 rounded-full ${card.color === 'emerald' ? 'bg-emerald-500' : card.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`} />{card.title}</span><Icon className={`h-5 w-5 ${card.color === 'emerald' ? 'text-emerald-600' : card.color === 'amber' ? 'text-amber-600' : 'text-rose-600'}`} /></div><p className="mt-3 text-2xl font-semibold text-[#10213b]">{loading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-slate-100" /> : card.count.toLocaleString()}</p><p className="mt-1 text-sm leading-5 text-slate-600">{card.description}</p></article>; })}
          </div>
          <section className="overflow-hidden rounded-2xl border border-[#e9edf5] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 border-b border-[#edf0f6] px-5 py-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3"><h2 className="text-lg font-semibold text-[#101c30] sm:text-xl">Detected Topics</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{loading ? 'Loading' : `${filteredTopics.length} topics`}</span></div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="relative flex min-w-0 items-center sm:w-64 lg:hidden"><Search className="absolute left-3 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics" className="w-full rounded-lg border border-[#dce4f1] bg-[#f4f7ff] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></label>
                <label className="flex items-center gap-2 rounded-lg border border-[#dce4f1] bg-[#f4f7ff] px-3 py-2.5 text-sm text-slate-600"><SlidersHorizontal className="h-4 w-4" /><span className="sr-only">Filter category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="min-w-0 bg-transparent text-sm outline-none"><option value="all">All categories</option>{categories.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
                <label className="flex items-center gap-2 rounded-lg border border-[#dce4f1] bg-[#f4f7ff] px-3 py-2.5 text-sm text-slate-600"><span className="sr-only">Filter trend</span><select value={trend} onChange={(event) => setTrend(event.target.value)} className="min-w-0 bg-transparent text-sm outline-none"><option value="all">All trends</option><option>Rising</option><option>Steady</option><option>Cooling</option><option>Insufficient data</option></select><ChevronDown className="h-4 w-4" /></label>
              </div>
            </div>
            {loading ? <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-600"><LoaderCircle className="h-5 w-5 animate-spin" />Analyzing published topics…</div> : error ? <div className="px-6 py-14 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-amber-600" /><p className="mt-3 text-sm font-medium text-slate-800">{error}</p><button onClick={() => setRetry((value) => value + 1)} className="mt-4 rounded-lg bg-[#2863eb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Retry</button></div> : filteredTopics.length === 0 ? <div className="px-6 py-14 text-center"><Search className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-800">{topics.length ? 'No topics match these filters' : 'No published topics found'}</p><p className="mt-1 text-sm text-slate-600">{topics.length ? 'Try another search or category.' : 'Topics will appear when published articles are available.'}</p></div> : <>
              <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[950px] border-collapse text-left"><thead className="bg-[#eef3ff] text-[13px] uppercase tracking-wide text-[#314660]"><tr><th className="px-7 py-3 font-semibold">Topic / keywords</th><th className="px-5 py-3 font-semibold">Frequency</th><th className="px-5 py-3 font-semibold">Trend</th><th className="px-5 py-3 font-semibold">Engagement</th><th className="px-5 py-3 font-semibold">Related articles</th></tr></thead><tbody className="divide-y divide-[#edf0f6]">{filteredTopics.map((item) => <tr key={item.name} className="align-middle hover:bg-[#fbfcff]"><td className="max-w-[320px] px-7 py-4"><div className="flex items-center gap-2"><p className="font-medium text-[#10213b]">{item.name}</p><span title={item.aiEnhanced ? "Gemini semantic analysis" : "Rule-based topic extraction"} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.aiEnhanced ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"}`}><Bot className="h-3 w-3" />{item.aiEnhanced ? "Gemini" : "Rule-based"}</span></div><div className="mt-1.5 flex flex-wrap gap-1.5">{(item.keywords || []).slice(0, 4).map((keyword) => <span key={keyword} className="rounded bg-[#e6edff] px-2 py-0.5 text-xs text-blue-800">{keyword}</span>)}</div>{item.summary && <p className="mt-2 text-xs leading-5 text-slate-600">{item.summary}</p>}{item.aiExplanation && <p className="mt-1 text-xs leading-5 text-slate-500">{item.aiExplanation}</p>}{item.popular && <span className="mt-1 inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-800">Popular</span>}</td><td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700"><span className="font-medium">{item.recentArticles}</span><span className="text-slate-500"> recent</span><br /><span className="text-xs text-slate-500">{item.previousArticles} previous · {item.articleCount} total</span>{item.growthPercent !== null && <p className="mt-1 text-xs text-slate-500">{item.growthPercent > 0 ? '+' : ''}{item.growthPercent}% change</p>}</td><td className="px-5 py-4"><span className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${trendStyle[item.trend] || trendStyle['Insufficient data']}`}><span className="h-2 w-2 rounded-full bg-current opacity-70" />{item.trend}</span>{item.undatedArticles > 0 && <p className="mt-1 text-xs text-slate-500">{item.undatedArticles} undated</p>}</td><td className="px-5 py-4 text-sm text-slate-700">{Object.keys(item.engagement || {}).length ? Object.entries(item.engagement).map(([key, value]) => <span key={key} className="mr-2 whitespace-nowrap">{formatMetric(value)} {key}</span>) : <span className="text-slate-500">No metrics</span>}</td><td className="max-w-[260px] px-5 py-4">{item.articles?.length ? <div className="space-y-1.5">{item.articles.slice(0, 2).map((article) => <Link key={article._id} to={`/browse/${article._id}`} className="block truncate text-sm text-blue-700 hover:underline">{article.title}</Link>)}{item.articles.length > 2 && <span className="text-xs text-slate-500">+{item.articles.length - 2} more articles</span>}</div> : <span className="text-sm text-slate-500">No related articles</span>}</td></tr>)}</tbody></table></div>
              <div className="divide-y divide-[#edf0f6] md:hidden">{filteredTopics.map((item) => <article key={item.name} className="space-y-3 px-5 py-4"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-[#10213b]">{item.name}</h3><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.aiEnhanced ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"}`}><Bot className="h-3 w-3" />{item.aiEnhanced ? "Gemini" : "Rule-based"}</span></div><div className="mt-1 flex flex-wrap gap-1">{(item.keywords || []).slice(0, 3).map((keyword) => <span key={keyword} className="rounded bg-[#e6edff] px-2 py-0.5 text-xs text-blue-800">{keyword}</span>)}</div>{item.summary && <p className="mt-2 text-xs leading-5 text-slate-600">{item.summary}</p>}{item.aiExplanation && <p className="mt-1 text-xs leading-5 text-slate-500">{item.aiExplanation}</p>}</div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${trendStyle[item.trend] || trendStyle['Insufficient data']}`}>{item.trend}</span></div><p className="text-sm text-slate-600">{item.recentArticles} recent · {item.previousArticles} previous · {item.articleCount} total</p>{Object.keys(item.engagement || {}).length > 0 && <p className="text-xs text-slate-600">{Object.entries(item.engagement).map(([key, value]) => `${formatMetric(value)} ${key}`).join(' · ')}</p>}{item.popular && <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-800">Popular</span>}{item.articles?.slice(0, 3).map((article) => <Link key={article._id} to={`/browse/${article._id}`} className="block truncate text-sm text-blue-700 hover:underline">{article.title}</Link>)}</article>)}</div>
            </>}
          </section>
          {!loading && !error && methodology && <p className="flex items-start gap-2 px-1 text-xs leading-5 text-slate-500"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{methodology}</p>}
        </div>
      </main>
    </div>
  </div>;
}
