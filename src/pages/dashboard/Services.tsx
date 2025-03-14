import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import api, { getErrorMessage } from '../../lib/axios';
import { Service, ServiceOption } from '../../types';

interface ServiceFormData {
  name: string;
  description: string;
  price: number;
  image: FileList;
  serviceOptionsJson: string;
  available: boolean;
}

export default function Services() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const queryClient = useQueryClient();
  const selectedBusinessId = localStorage.getItem('selectedBusinessId');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceFormData>();

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/services/business/${selectedBusinessId}`);
      return response.data.content as Service[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.post('/businesses/services', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
    });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error) => {
      console.log(error)
      toast.error(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      return api.put(`/businesses/services/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service updated successfully');
      setIsModalOpen(false);
      setEditingService(null);
      reset();
    },
    onError: (error) => {
      console.log(error)
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/businesses/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service deleted successfully');
    },
    onError: (error) => {
      console.log(error)
      toast.error(getErrorMessage(error));
    },
  });

  const onSubmit = async (data: ServiceFormData) => {
    console.log(data, selectedBusinessId)
    const formData = new FormData();
    formData.append('businessId', selectedBusinessId!);
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('available', data.available.toString());
    formData.append('serviceOptionsJson', data.serviceOptionsJson || '[]');
    
    if (data.image?.[0]) {
      formData.append('image', data.image[0]);
    }

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Services</h2>
        <button
          onClick={() => {
            setEditingService(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services?.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <Package className="w-10 h-10 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-500">${service.price.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="p-2 text-gray-400 hover:text-blue-600"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="mt-4 text-gray-600 text-sm">{service.description}</p>

            {service.options.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Options</h4>
                <ul className="space-y-2">
                  {service.options.map((option, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      {option.name} - ${option.price.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex items-center">
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  service.available
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {service.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  {...register("name", { required: "Name is required" })}
                  defaultValue={editingService?.name}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register("description", { required: "Description is required" })}
                  defaultValue={editingService?.description}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  rows={3}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  {...register("price", {
                    required: "Price is required",
                    min: { value: 0, message: "Price must be positive" }
                  })}
                  defaultValue={editingService?.price}
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options (JSON)
                </label>
                <textarea
                  {...register("serviceOptionsJson")}
                  defaultValue={editingService?.options ? JSON.stringify(editingService.options) : '[]'}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  rows={3}
                  placeholder='[{"name":"Option 1","price":10.99,"description":"Option description"}]'
                />
              </div>

              <div className="flex items-center">
                <input
                  {...register("available")}
                  type="checkbox"
                  defaultChecked={editingService?.available}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Available
                </label>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingService(null);
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
                  {editingService ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}