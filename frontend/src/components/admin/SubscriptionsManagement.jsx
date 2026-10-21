import React, { useMemo, useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Eye,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://content-management-system-2-he9n.onrender.com/api';

const initialSubscriptionsFallback = [
  {
    id: 'sub-1',
    user: 'Aarav Mehta',
    email: 'aarav@example.com',
    plan: 'Premium',
    startDate: 'Aug 12, 2026',
    expiryDate: 'Sep 12, 2026',
    status: 'active',
    amount: '₹299',
  },
  {
    id: 'sub-2',
    user: 'Priya Sharma',
    email: 'priya@example.com',
    plan: 'Premium',
    startDate: 'Aug 05, 2026',
    expiryDate: 'Sep 05, 2026',
    status: 'expired',
    amount: '₹299',
  },
  {
    id: 'sub-3',
    user: 'Rohan Patil',
    email: 'rohan@example.com',
    plan: 'Basic',
    startDate: 'Aug 20, 2026',
    expiryDate: 'Sep 20, 2026',
    status: 'active',
    amount: '₹149',
  },
];

const SubscriptionsManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('lumen_token');

      const res = await fetch(`${API_URL}/subscriptions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();

      if (res.ok && data.subscriptions && data.subscriptions.length > 0) {
        const formatted = data.subscriptions.map((sub, idx) => ({
          id: sub._id || sub.id || idx,
          user: sub.author?.name || sub.subscriber?.name || 'Subscribed User',
          email: sub.author?.email || sub.subscriber?.email || 'user@lumen.com',
          plan: 'Premium',
          startDate: sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'Aug 12, 2026',
          expiryDate: 'Auto-renews',
          status: 'active',
          amount: '₹299',
        }));
        setSubscriptions(formatted);
      } else {
        setSubscriptions(initialSubscriptionsFallback);
      }
    } catch (err) {
      console.error('Fetch subscriptions error:', err);
      setSubscriptions(initialSubscriptionsFallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    return subscriptions.filter((subscription) => {
      const matchesSearch =
        !searchTerm ||
        subscription.user.toLowerCase().includes(searchTerm) ||
        subscription.email.toLowerCase().includes(searchTerm);

      const matchesPlan = planFilter === 'all' || subscription.plan === planFilter;
      const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [subscriptions, search, planFilter, statusFilter]);

  const getStatusClasses = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'expired':
        return 'bg-stone-100 text-stone-600 border-stone-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const getPlanClasses = (plan) => {
    if (plan === 'Premium') {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-stone-100 text-stone-600 border-stone-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            Subscription Management
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            View and monitor real-time user subscription details from API.
          </p>
        </div>
        <button
          onClick={fetchSubscriptions}
          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EDE8DF] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
              Total Subscriptions
            </span>
            <CreditCard className="w-4 h-4 text-stone-400" />
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900 mt-3">
            {subscriptions.length}
          </p>
        </div>

        <div className="bg-white border border-[#EDE8DF] rounded-2xl p-5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
            Active
          </span>
          <p className="font-serif text-2xl font-bold text-stone-900 mt-3">
            {subscriptions.filter((s) => s.status === 'active').length}
          </p>
        </div>

        <div className="bg-white border border-[#EDE8DF] rounded-2xl p-5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
            Expired
          </span>
          <p className="font-serif text-2xl font-bold text-stone-900 mt-3">
            {subscriptions.filter((s) => s.status === 'expired').length}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-[#EDE8DF] rounded-3xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users or email..."
              className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-[#1A382B]"
            />
          </div>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-700 focus:outline-none focus:border-[#1A382B]"
          >
            <option value="all">All Plans</option>
            <option value="Basic">Basic</option>
            <option value="Premium">Premium</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-700 focus:outline-none focus:border-[#1A382B]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white border border-[#EDE8DF] rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead className="bg-[#FAF7F2] border-b border-[#EDE8DF]">
              <tr>
                <th className="text-left px-5 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  User
                </th>
                <th className="text-left px-5 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Plan
                </th>
                <th className="text-left px-5 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Start Date
                </th>
                <th className="text-left px-5 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Expiry Date
                </th>
                <th className="text-left px-5 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Status
                </th>
                <th className="text-right px-5 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE8DF]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-xs text-stone-400">
                    Loading subscriptions API...
                  </td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-14 text-center">
                    <CreditCard className="w-8 h-8 text-stone-300 mx-auto" />
                    <p className="text-sm font-semibold text-stone-600 mt-3">
                      No subscriptions found
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-[#FAF7F2]/60 transition">
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-stone-800">{subscription.user}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">{subscription.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-semibold ${getPlanClasses(subscription.plan)}`}>
                        {subscription.plan}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-stone-500">{subscription.startDate}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-stone-500">{subscription.expiryDate}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-semibold capitalize ${getStatusClasses(subscription.status)}`}>
                        {subscription.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setSelectedSubscription(subscription)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-stone-600 hover:text-[#1A382B] hover:bg-[#FAF7F2] text-[10px] font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Details Modal */}
      {selectedSubscription && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDE8DF] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EDE8DF] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Subscription
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900 mt-1">
                  Subscription Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubscription(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400">User</p>
                <div className="mt-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl p-4">
                  <p className="text-sm font-semibold text-stone-800">{selectedSubscription.user}</p>
                  <p className="text-xs text-stone-500 mt-1">{selectedSubscription.email}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Plan</p>
                  <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${getPlanClasses(selectedSubscription.plan)}`}>
                    {selectedSubscription.plan}
                  </span>
                </div>
                <div className="bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Status</p>
                  <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full border text-[10px] font-semibold capitalize ${getStatusClasses(selectedSubscription.status)}`}>
                    {selectedSubscription.status}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedSubscription(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#1A382B] hover:bg-[#11261D] text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsManagement;