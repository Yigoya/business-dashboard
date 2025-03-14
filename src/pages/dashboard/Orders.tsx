import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import api from '../../lib/axios';
import { Order, OrderStatus } from '../../types';

const statusColors: Record<OrderStatus, { bg: string; text: string; icon: any }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
  IN_PROGRESS: { bg: 'bg-purple-100', text: 'text-purple-800', icon: ShoppingBag },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
  REFUNDED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle },
};

export default function Orders() {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const queryClient = useQueryClient();
  const selectedBusinessId = localStorage.getItem('selectedBusinessId');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/orders/business/${selectedBusinessId}`);
      return response.data.content as Order[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: OrderStatus }) => {
      return api.put(`/orders/${orderId}/status?status=${status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated successfully');
    },
    onError: (error) => {
      console.log(error)
      toast.error('Failed to update order status');
    },
  });

  const filteredOrders = orders?.filter(
    (order) => selectedStatus === 'ALL' || order.status === selectedStatus
  );

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
        <div className="flex space-x-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as OrderStatus | 'ALL')}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {filteredOrders?.map((order) => {
          const StatusIcon = statusColors[order.status].icon;
          return (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <ShoppingBag className="w-5 h-5 text-gray-400" />
                    <span className="ml-2 text-lg font-semibold text-gray-900">
                      Order #{order.orderNumber}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {format(new Date(order.createdAt), 'PPp')}
                  </div>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      statusColors[order.status].bg
                    } ${statusColors[order.status].text}`}
                  >
                    <StatusIcon className="w-4 h-4 mr-1" />
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Customer Details</h4>
                  <div className="mt-2 text-sm text-gray-500">
                    <p className="flex items-center">
                      <span className="font-medium">{order.customerName}</span>
                    </p>
                    <p className="flex items-center mt-1">
                      <Phone className="w-4 h-4 mr-1" />
                      {order.customerPhone}
                    </p>
                    <p className="flex items-center mt-1">
                      <Mail className="w-4 h-4 mr-1" />
                      {order.customerEmail}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Delivery Location</h4>
                  <div className="mt-2 text-sm text-gray-500">
                    <p className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {order.serviceLocation.street}, {order.serviceLocation.city}
                    </p>
                    <p className="mt-1">
                      {order.serviceLocation.state}, {order.serviceLocation.country}{' '}
                      {order.serviceLocation.postalCode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items</h4>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-t border-gray-100"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.serviceName}</p>
                        <p className="text-sm text-gray-500">{item.serviceDescription}</p>
                        {Object.entries(item.selectedOptions).length > 0 && (
                          <div className="mt-1 text-sm text-gray-500">
                            {Object.entries(item.selectedOptions).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${item.unitPrice.toFixed(2)} x {item.quantity}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900">${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-medium mt-4">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">${order.total.toFixed(2)}</span>
                </div>
              </div>

              {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <div className="flex justify-end space-x-4">
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateStatusMutation.mutate({
                            orderId: order.id,
                            status: 'CONFIRMED'
                          })}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Confirm Order
                        </button>
                        <button
                          onClick={() => updateStatusMutation.mutate({
                            orderId: order.id,
                            status: 'CANCELLED'
                          })}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Cancel Order
                        </button>
                      </>
                    )}
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({
                          orderId: order.id,
                          status: 'IN_PROGRESS'
                        })}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Start Processing
                      </button>
                    )}
                    {order.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({
                          orderId: order.id,
                          status: 'COMPLETED'
                        })}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}