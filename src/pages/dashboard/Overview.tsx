import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingBag, Users, TrendingUp, DollarSign } from 'lucide-react';
import api from '../../lib/axios';
import { Order } from '../../types';

export default function Overview() {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
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
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">{stat.name}</h3>
                <div className="mt-1">
                  <p className="text-2xl font-semibold text-gray-900">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className={`text-sm ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </div>
              <div className="text-sm text-gray-500">from last month</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Revenue Overview</h3>
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
    </div>
  );
}