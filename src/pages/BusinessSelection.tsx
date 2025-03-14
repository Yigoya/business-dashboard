import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Store, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/axios';
import { Business } from '../types';
import useAuthStore from '../store/authStore';

export default function BusinessSelection() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await api.get(`/businesses/owner/${user?.id}`);
        setBusinesses(response.data.content);
      } catch (error) {
        console.log(error)
        toast.error('Failed to load businesses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  const handleBusinessSelect = (businessId: number) => {
    localStorage.setItem('selectedBusinessId', businessId.toString());
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Select Your Business</h1>
          <p className="mt-2 text-gray-600">Choose a business to manage or create a new one</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <div
              key={business.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer"
              onClick={() => handleBusinessSelect(business.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <Store className="w-10 h-10 text-blue-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{business.name}</h3>
                    <p className="text-sm text-gray-500">{business.location.city}</p>
                  </div>
                </div>
                {business.isVerified ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-gray-400" />
                )}
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-2">{business.description}</p>
              </div>

              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Store className="w-4 h-4 mr-1" />
                <span>{business.phoneNumber}</span>
              </div>
            </div>
          ))}

          <div
            onClick={() => navigate('/create-business')}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center"
          >
            <div className="bg-blue-50 rounded-full p-3 mb-4">
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Create New Business</h3>
            <p className="mt-2 text-sm text-gray-500">
              Set up and manage a new business
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}