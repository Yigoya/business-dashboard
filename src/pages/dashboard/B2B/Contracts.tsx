import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';
import api, { getErrorMessage } from '../../../lib/axios';
import { Contract, ContractStatus, B2BPartner, Business } from '../../../types';

interface ContractFormData {
  partnerId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  terms: string;
  documents: FileList;
}

interface PartnerResponse {
  partners: {
    content: B2BPartner[];
    pageable: {
      pageNumber: number;
      pageSize: number;
    };
    totalElements: number;
    totalPages: number;
  };
  partnerRequests: {
    content: B2BPartner[];
    pageable: {
      pageNumber: number;
      pageSize: number;
    };
    totalElements: number;
    totalPages: number;
  };
}

export default function Contracts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const queryClient = useQueryClient();
  const selectedBusinessId = localStorage.getItem('selectedBusinessId');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContractFormData>();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/${selectedBusinessId}/contracts`);
      return response.data.content as Contract[];
    },
  });

  // Fetch partners and partner requests for dropdown selection
  const { data: partnerData } = useQuery({
    queryKey: ['b2b-partners', selectedBusinessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/${selectedBusinessId}/partners`);
      return response.data as PartnerResponse;
    },
  });

  // Combine partners and active partner requests
  const allPartners = [
    ...(partnerData?.partners.content || []),
    ...(partnerData?.partnerRequests.content || []).filter(request => request.status === 'ACTIVE')
  ];

  // Fetch partner business details
  const { data: partnerBusinesses } = useQuery({
    queryKey: ['partner-businesses', allPartners],
    queryFn: async () => {
      if (!allPartners || allPartners.length === 0) return [];
      
      const partnerIds = allPartners.map(p => 
        p.requestingBusinessId || p.partnerBusinessId
      );
      const businesses: Record<number, Business> = {};
      
      await Promise.all(partnerIds.map(async (id) => {
        if (!id) return;
        try {
          const response = await api.get(`/businesses/${id}/details`);
          businesses[id] = response.data.business;
        } catch (error) {
          console.error(`Failed to fetch business ${id}`, error);
        }
      }));
      
      return businesses;
    },
    enabled: !!allPartners && allPartners.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.post(`/businesses/${selectedBusinessId}/contracts`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contract created successfully');
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
      return api.put(`/businesses/contracts/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contract updated successfully');
      setIsModalOpen(false);
      setEditingContract(null);
      reset();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/businesses/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contract deleted successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onSubmit = async (data: ContractFormData) => {
    const formData = new FormData();
    formData.append('partnerId', data.partnerId.toString());
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('startDate', new Date(data.startDate).toISOString());
    formData.append('endDate', new Date(data.endDate).toISOString());
    formData.append('terms', data.terms);
    
    if (data.documents) {
      Array.from(data.documents).forEach((file) => {
        formData.append('documents', file);
      });
    }

    if (editingContract) {
      updateMutation.mutate({ id: editingContract.id, data: formData });
    } else {
      createMutation.mutate(formData);
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

  // Helper function to get partner business name
  const getPartnerName = (partnerId: number) => {
    if (!partnerBusinesses) return `Partner #${partnerId}`;
    return partnerBusinesses[partnerId]?.name || `Partner #${partnerId}`;
  };

  // Helper function to get partner ID for the dropdown
  const getPartnerIdForDropdown = (partner: B2BPartner) => {
    return partner.requestingBusinessId || partner.partnerBusinessId;
  };

  // Helper function to get partner display name for the dropdown
  const getPartnerDisplayName = (partner: B2BPartner) => {
    const partnerId = getPartnerIdForDropdown(partner);
    const partnerName = getPartnerName(partnerId);
    const partnerType = partner.partnerType;
    const isRequest = !!partner.requestingBusinessId;
    
    return `${partnerName} (${partnerType})${isRequest ? ' - Incoming Request' : ''}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Contracts</h2>
        <button
          onClick={() => {
            setEditingContract(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Contract
        </button>
      </div>

      {contracts && contracts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <FileText className="w-10 h-10 text-blue-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{contract.title}</h3>
                    <p className="text-sm text-gray-500">{getPartnerName(contract.partnerId)}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingContract(contract);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this contract?')) {
                        deleteMutation.mutate(contract.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-600">{contract.description}</p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {format(new Date(contract.startDate), 'PP')} - {format(new Date(contract.endDate), 'PP')}
                  </span>
                </div>
              </div>

              {contract.documents.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Documents</h4>
                  <div className="space-y-2">
                    {contract.documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Document {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    contract.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    contract.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    contract.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {contract.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            You don't have any contracts yet. Click "New Contract" to create your first contract with a partner.
          </p>
        </div>
      )}

      {/* Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingContract ? 'Edit Contract' : 'New Contract'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner
                </label>
                <select
                  {...register("partnerId", { required: "Partner is required", valueAsNumber: true })}
                  defaultValue={editingContract?.partnerId}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                >
                  <option value="">Select a partner</option>
                  {allPartners?.map((partner) => (
                    <option key={partner.id} value={getPartnerIdForDropdown(partner)}>
                      {getPartnerDisplayName(partner)}
                    </option>
                  ))}
                </select>
                {errors.partnerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.partnerId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  {...register("title", { required: "Title is required" })}
                  defaultValue={editingContract?.title}
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
                  defaultValue={editingContract?.description}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
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
                    type="date"
                    defaultValue={editingContract?.startDate.split('T')[0]}
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
                    type="date"
                    defaultValue={editingContract?.endDate.split('T')[0]}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms
                </label>
                <textarea
                  {...register("terms", { required: "Terms are required" })}
                  defaultValue={editingContract?.terms}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
                {errors.terms && (
                  <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Documents
                </label>
                <input
                  {...register("documents")}
                  type="file"
                  multiple
                  className="w-full"
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingContract(null);
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
                  {editingContract ? 'Update' : 'Create'} Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}