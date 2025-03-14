import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Megaphone, Edit2, Trash2, Plus } from 'lucide-react';
import api from '../../lib/axios';
import { Promotion } from '../../types';

interface PromotionFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: string;
  discountPercentage: number;
  image?: FileList;
}

export default function Promotions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const queryClient = useQueryClient();
  const selectedBusinessId = localStorage.getItem('selectedBusinessId');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PromotionFormData>();

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/promotions/business/${selectedBusinessId}`);
      return response.data.content as Promotion[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.post('/businesses/promotions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: () => {
      toast.error('Failed to create promotion');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      return api.put(`/businesses/promotions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion updated successfully');
      setIsModalOpen(false);
      setEditingPromotion(null);
      reset();
    },
    onError: () => {
      toast.error('Failed to update promotion');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/businesses/promotions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete promotion');
    },
  });

  const onSubmit = async (data: PromotionFormData) => {
    const formData = new FormData();
    formData.append('businessId', selectedBusinessId!);
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('startDate', new Date(data.startDate).toISOString());
    formData.append('endDate', new Date(data.endDate).toISOString());
    formData.append('type', data.type);
    formData.append('discountPercentage', data.discountPercentage.toString());
    
    if (data.image?.[0]) {
      formData.append('image', data.image[0]);
    }

    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion.id!, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      deleteMutation.mutate(id);
    }
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Promotions</h2>
        <button
          onClick={() => {
            setEditingPromotion(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Promotion
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {promotions?.map((promotion) => (
          <div
            key={promotion.id}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <Megaphone className="w-10 h-10 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{promotion.title}</h3>
                  <p className="text-sm text-gray-500">{promotion.discountPercentage}% OFF</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(promotion)}
                  className="p-2 text-gray-400 hover:text-blue-600"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(promotion.id!)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="mt-4 text-gray-600 text-sm">{promotion.description}</p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium">Start:</span>
                <span className="ml-2">
                  {format(new Date(promotion.startDate), 'PPp')}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium">End:</span>
                <span className="ml-2">
                  {format(new Date(promotion.endDate), 'PPp')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Promotion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingPromotion ? 'Edit Promotion' : 'Add New Promotion'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  {...register("title", { required: "Title is required" })}
                  defaultValue={editingPromotion?.title}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register("description", { required: "Description is required" })}
                  defaultValue={editingPromotion?.description}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  rows={3}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    {...register("startDate", { required: "Start date is required" })}
                    defaultValue={editingPromotion?.startDate?.split('T')[0]}
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    {...register("endDate", { required: "End date is required" })}
                    defaultValue={editingPromotion?.endDate?.split('T')[0]}
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  {...register("type", { required: "Type is required" })}
                  defaultValue={editingPromotion?.type}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                >
                  <option value="DISCOUNT">Discount</option>
                  <option value="SPECIAL">Special Offer</option>
                  <option value="SEASONAL">Seasonal</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage
                </label>
                <input
                  {...register("discountPercentage", {
                    required: "Discount percentage is required",
                    min: { value: 0, message: "Discount must be positive" },
                    max: { value: 100, message: "Discount cannot exceed 100%" }
                  })}
                  defaultValue={editingPromotion?.discountPercentage}
                  type="number"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
                {errors.discountPercentage && (
                  <p className="mt-1 text-sm text-red-600">{errors.discountPercentage.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                <input
                  {...register("image")}
                  type="file"
                  accept="image/*"
                  className="w-full"
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPromotion(null);
                    reset();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPromotion ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}