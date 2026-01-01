import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingBag, Users, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, MapPin, Package, Megaphone, MessageSquare } from 'lucide-react';
import api from '../../lib/axios';
import { Order, Business } from '../../types';

export default function Overview() {
  const [selectedBusinessId] = useState<string | null>(
    localStorage.getItem('selectedBusinessId')
  );

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/orders/business/${selectedBusinessId}`);
      return response.data.content as Order[];
    },
    enabled: !!selectedBusinessId,
  });

  const { data: business } = useQuery({
    queryKey: ['business', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/${selectedBusinessId}/details`);
      return response.data.business as Business;
    },
    enabled: !!selectedBusinessId,
  });

  const locationLabel = business
    ? [business.location?.city, business.location?.state].filter(Boolean).join(', ') || 'Location not set'
    : null;

  const stats = [
    {
      name: 'Total Orders',
      value: orders?.length || 0,
      icon: ShoppingBag,
      change: '+4.75%',
      changeType: 'positive',
    },
    {
      name: 'Total Revenue',
      value: orders?.reduce((acc, order) => acc + order.total, 0).toFixed(2) || '0.00',
      icon: DollarSign,
      change: '+10.18%',
      changeType: 'positive',
    },
    {
      name: 'Active Customers',
      value: new Set(orders?.map(order => order.customerId)).size || 0,
      icon: Users,
      change: '+2.30%',
      changeType: 'positive',
    },
    {
      name: 'Average Order Value',
      value: orders?.length
        ? (orders.reduce((acc, order) => acc + order.total, 0) / orders.length).toFixed(2)
        : '0.00',
      icon: TrendingUp,
      change: '+1.25%',
      changeType: 'positive',
    },
  ];

  const chartData = orders
    ? orders.reduce((acc: any[], order) => {
        const date = new Date(order.createdAt).toLocaleDateString();
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.total += order.total;
          existing.orders += 1;
        } else {
          acc.push({ date, total: order.total, orders: 1 });
        }
        return acc;
      }, [])
    : [];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 rounded-2xl"></div>
          <div className="h-80 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#2b78ac] p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-white">
            <h2 className="text-2xl sm:text-3xl font-bold">Overview</h2>
            {business && (
              <p className="mt-1 text-sm text-white/90 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {business.name} • {locationLabel}
              </p>
            )}
          </div>
          <div className="mt-3 sm:mt-0 flex flex-wrap gap-2">
            <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = '#'; }} className="hidden" />
            <a href="/dashboard/orders" className="inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/20">Orders</a>
            <a href="/dashboard/services" className="inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/20">Services</a>
            <a href="/dashboard/promotions" className="inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/20">Promotions</a>
            <a href="/dashboard/enquiries" className="inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/20">Enquiries</a>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">{stat.name}</h3>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${stat.changeType === 'positive' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                {stat.changeType === 'positive' ? <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> : <ArrowDownRight className="h-3.5 w-3.5 mr-1" />} {stat.change}
              </span>
              <span className="text-xs text-gray-500">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Orders Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/dashboard/orders" className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">View orders</span>
          </a>
          <a href="/dashboard/services" className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50">
            <Package className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Manage services</span>
          </a>
          <a href="/dashboard/promotions" className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50">
            <Megaphone className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Create promotion</span>
          </a>
          <a href="/dashboard/enquiries" className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Check enquiries</span>
          </a>
        </div>
      </div>
    </div>
  );
}