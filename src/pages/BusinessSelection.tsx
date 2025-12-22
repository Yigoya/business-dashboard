import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Store, CheckCircle, XCircle, Search, Star, MapPin, Phone, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/axios';
import { Business } from '../types';
import useAuthStore from '../store/authStore';

export default function BusinessSelection() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'city'>('name');
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const lastSelectedId = typeof window !== 'undefined' ? localStorage.getItem('selectedBusinessId') : null;

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await api.get(`/businesses/owner/${user?.id}`);
        const items = response?.data?.content ?? [];
        setBusinesses(items);
      } catch (error) {
        console.log(error)
        toast.error('Failed to load businesses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinesses();
  }, [user?.id]);

  const handleBusinessSelect = (businessId: number) => {
    localStorage.setItem('selectedBusinessId', businessId.toString());
    navigate('/dashboard');
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = businesses.filter((b) => {
      if (!q) return true;
      const inName = b.name.toLowerCase().includes(q);
      const city = b.location?.city?.toLowerCase() ?? '';
      const state = b.location?.state?.toLowerCase() ?? '';
      return inName || city.includes(q) || state.includes(q);
    });
    if (onlyVerified) list = list.filter((b) => b.isVerified);
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      const cityA = a.location?.city ?? '';
      const cityB = b.location?.city ?? '';
      return cityA.localeCompare(cityB);
    });
    return list;
  }, [businesses, search, onlyVerified, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="h-32 rounded-2xl bg-gradient-to-r from-blue-100 to-indigo-100 animate-pulse" />
          {/* Cards skeleton */}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="h-6 w-2/3 bg-gray-200 rounded mb-3 animate-pulse" />
                <div className="h-4 w-1/3 bg-gray-200 rounded mb-6 animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 w-2/5 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-white">
              <h1 className="text-2xl sm:text-3xl font-bold">Welcome back</h1>
              <p className="text-white/80 mt-1">Select a business to manage, or create a new one.</p>
              {lastSelectedId && businesses.some(b => String(b.id) === String(lastSelectedId)) && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm ring-1 ring-white/20">
                  <Store className="h-4 w-4" />
                  <span>
                    Continue with {
                      businesses.find(b => String(b.id) === String(lastSelectedId))?.name
                    }
                  </span>
                  <button
                    className="ml-2 rounded bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
                    onClick={() => handleBusinessSelect(Number(lastSelectedId))}
                  >
                    Open
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 h-5 w-5" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or city..."
                  className="w-full rounded-lg border-0 bg-white/10 pl-11 pr-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="rounded-lg border-0 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option className="text-gray-900" value="name">Sort: Name</option>
                  <option className="text-gray-900" value="city">Sort: City</option>
                </select>
                <label className="inline-flex items-center gap-2 text-white/90 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/30 bg-white/20"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                  />
                  Verified only
                </label>
                <button
                  onClick={() => navigate('/create-business')}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" /> New Business
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/50 hover:bg-white/20"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((business) => {
            const locationLabel = [business.location?.city, business.location?.state]
              .filter(Boolean)
              .join(', ') || 'Location not set';

            return (
              <div
                key={business.id}
                className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleBusinessSelect(business.id)}
              >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Store className="w-7 h-7" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700">{business.name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="h-3.5 w-3.5" /> {locationLabel}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {business.isFeatured && (
                    <span title="Featured" className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-[10px] font-medium text-yellow-700 ring-1 ring-yellow-200">
                      <Star className="h-3 w-3 mr-1" />Featured
                    </span>
                  )}
                  {business.isVerified ? (
                    <span title="Verified" className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700 ring-1 ring-green-200">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />Verified
                    </span>
                  ) : (
                    <span title="Not verified" className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200">
                      <XCircle className="h-3.5 w-3.5 mr-1" />Unverified
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-3">{business.description}</p>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Phone className="w-4 h-4 mr-1" />
                  <span>{business.phoneNumber}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleBusinessSelect(business.id); }}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
                >
                  Manage
                </button>
              </div>
            </div>
            );
          })}

          {/* Removed extra create card to avoid duplicate entry points */}
        </div>

        {/* Empty state with guidance only to reduce duplicate buttons */}
        {filtered.length === 0 && (
          <div className="mt-8 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center">
              <Store className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No businesses found</h3>
            <p className="mt-1 text-sm text-gray-500">Use the "New Business" button above to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}