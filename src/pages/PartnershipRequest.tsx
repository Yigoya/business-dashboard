import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Building, ArrowRight, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api, { getErrorMessage } from '../lib/axios';
import useAuthStore from '../store/authStore';
import { Business, B2BPartnerType } from '../types';

interface PartnerFormData {
  partnerType: B2BPartnerType;
  creditLimit?: number;
  paymentTerms?: string;
}

export default function PartnershipRequest() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PartnerFormData>();

  // Get target business details
  const { data: targetBusiness } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const response = await api.get(`/businesses/${businessId}/details`);
      return response.data.business;
    },
    enabled: !!businessId
  });

  console.log("User", user);

  // Get user's businesses
  const { data: userBusinesses, isLoading: isLoadingBusinesses, isError, error } = useQuery<Business[]>({
    queryKey: ['user-businesses', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/businesses/owner/${user?.id}`);
        console.log('API Response:', response);
        
        // Check if response has the expected structure
        if (!response.data) {
          console.error('API response missing data property:', response);
          return [];
        }
        
        // Check if content exists in the response
        if (!response.data.content) {
          console.log('Response data structure:', response.data);
          // Try to determine the correct path to the businesses array
          if (Array.isArray(response.data)) {
            return response.data;
          } else if (response.data.businesses) {
            return response.data.businesses;
          } else {
            console.warn('Could not find businesses array in response, returning empty array');
            return [];
          }
        }
        
        return response.data.content;
      } catch (err) {
        console.error('Error fetching businesses:', err);
        throw err;
      }
    },
    enabled: !!user,
    retry: 1
  });

  const partnershipMutation = useMutation({
    mutationFn: async (data: { 
      businessId: number; 
      partnerBusinessId: number;
      partnerType: B2BPartnerType;
      creditLimit?: number;
      paymentTerms?: string;
    }) => {
      return api.post(`/businesses/${data.businessId}/partners`, data);
    },
    onSuccess: () => {
      toast.success('Partnership request sent successfully');
      navigate('/dashboard/b2b/partners');
    },
    onError: (error) => {
      console.error('Error sending partnership request:', error);
      toast.error(getErrorMessage(error));
    }
  });

  useEffect(() => {
    console.log('Current state:', { 
      token: !!token, 
      isLoading: isLoadingBusinesses, 
      isError, 
      userBusinesses,
      userBusinessesLength: userBusinesses?.length
    });
    
    if (!token) {
      // Store the target URL to redirect back after login
      localStorage.setItem('redirectAfterAuth', `/partnership-request/${businessId}`);
      navigate('/auth/login');
      return;
    }

    // Only check for businesses after we've confirmed the data has loaded
    if (token && !isLoadingBusinesses && !isError && userBusinesses?.length === 0) {
      console.log('Redirecting to create-business because no businesses found');
      // Store the target URL to redirect back after business creation
      localStorage.setItem('redirectAfterBusinessCreation', `/partnership-request/${businessId}`);
      navigate('/create-business');
      return;
    }
  }, [token, userBusinesses, isLoadingBusinesses, isError, businessId, navigate]);

  const onSubmit = async (data: PartnerFormData) => {
    if (!selectedBusiness) {
      toast.error('Please select a business');
      return;
    }

    if (selectedBusiness.id === targetBusiness.id) {
      toast.error("You can't partner with your own business");
      return;
    }

    partnershipMutation.mutate({
      businessId: selectedBusiness.id,
      partnerBusinessId: targetBusiness.id,
      partnerType: data.partnerType,
      creditLimit: data.creditLimit,
      paymentTerms: data.paymentTerms
    });
  };

  if (!targetBusiness) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Business not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Partnership Request</h2>

          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">Your Business</h3>
              {userBusinesses?.map((business: Business) => (
                <div
                  key={business.id}
                  className={`mt-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedBusiness?.id === business.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-500'
                  }`}
                  onClick={() => {
                    setSelectedBusiness(business);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="font-medium">{business.name}</div>
                  <div className="text-sm text-gray-500">{business.location.city}, {business.location.state}</div>
                </div>
              ))}
            </div>

            <ArrowRight className="mx-8 text-gray-400" />

            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">Partner Business</h3>
              <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <div className="font-medium">{targetBusiness.name}</div>
                <div className="text-sm text-gray-500">
                  {targetBusiness.location.city}, {targetBusiness.location.state}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>By sending a partnership request, you agree to:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Share business information with the partner</li>
              <li>Comply with partnership terms and conditions</li>
              <li>Maintain professional communication</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Partnership Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Send Partnership Request</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner Type
                </label>
                <select
                  {...register("partnerType", { required: "Partner type is required" })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                >
                  <option value="SUPPLIER">Supplier</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                  <option value="RESELLER">Reseller</option>
                  <option value="MANUFACTURER">Manufacturer</option>
                </select>
                {errors.partnerType && (
                  <p className="mt-1 text-sm text-red-600">{errors.partnerType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Limit
                </label>
                <input
                  {...register("creditLimit", { 
                    valueAsNumber: true,
                    min: { value: 0, message: "Credit limit must be positive" }
                  })}
                  type="number"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
                {errors.creditLimit && (
                  <p className="mt-1 text-sm text-red-600">{errors.creditLimit.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <input
                  {...register("paymentTerms")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="e.g., Net 30"
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedBusiness(null);
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
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}