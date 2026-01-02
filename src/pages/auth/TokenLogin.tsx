import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api, { getErrorMessage } from '../../lib/axios';
import useAuthStore from '../../store/authStore';
import { Business } from '../../types';

export default function TokenLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');

    if (!tokenParam) {
      toast.error('Missing login token.');
      navigate('/login', { replace: true });
      return;
    }
    const signIn = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/auth/token-login', {
          params: { token: tokenParam },
        });

        const user = response.data.user;
        const token = response.data.token;
        setAuth(user, token);
        toast.success('Login successful!');

        // If user account not verified, send to verify-email page
        if (user?.status && String(user.status).toLowerCase() !== 'active') {
          navigate('/auth/verify-email', { replace: true });
          return;
        }

        let autoBusinessSelected = false;
        if (user && user.role === 'BUSINESS_MARKET') {
          try {
            const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

            const fetchBusinesses = async (): Promise<Business[]> => {
              const businessResponse = await api.get(`/businesses/owner/${user.id}`, {
                headers: authHeader,
                skipAuthRedirect: true,
              } as any);
              if (!businessResponse) return [];
              const { data } = businessResponse;
              if (Array.isArray(data?.content)) return data.content;
              if (Array.isArray(data)) return data;
              if (Array.isArray((data as any)?.items)) return (data as any).items;
              return [];
            };

            const createDefaultMarketplaceBusiness = async (): Promise<number | null> => {
              try {
                const defaultOpeningHours = {
                  mondayOpen: '09:00',
                  mondayClose: '17:00',
                  tuesdayOpen: '09:00',
                  tuesdayClose: '17:00',
                  wednesdayOpen: '09:00',
                  wednesdayClose: '17:00',
                  thursdayOpen: '09:00',
                  thursdayClose: '17:00',
                  fridayOpen: '09:00',
                  fridayClose: '17:00',
                  saturdayOpen: '09:00',
                  saturdayClose: '17:00',
                  sundayOpen: '09:00',
                  sundayClose: '17:00',
                };

                const defaultLocation = {
                  name: '',
                  latitude: 0,
                  longitude: 0,
                  street: '',
                  city: '',
                  country: '',
                };

                const defaultSocial = {
                  facebook: '',
                  telegram: '',
                  whatsapp: '',
                  linkedin: null,
                };

                const safeName = (user.name || '').trim();
                const businessName = `${safeName || 'Marketplace'} Store`;
                const description = 'Automatically created marketplace business profile.';

                const formData = new FormData();
                formData.append('name', businessName);
                formData.append('description', description);
                formData.append('ownerId', String(user.id));
                formData.append('locationJson', JSON.stringify(defaultLocation));
                formData.append('phoneNumber', user.phoneNumber || '');
                formData.append('email', user.email || '');
                formData.append('website', '');
                formData.append('openingHoursJson', JSON.stringify(defaultOpeningHours));
                formData.append('socialMediaJson', JSON.stringify(defaultSocial));
                formData.append('serviceIdsJson', JSON.stringify([]));

                const responseCreate = await api.post('/businesses', formData, {
                  headers: token
                    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                    : { 'Content-Type': 'multipart/form-data' },
                  skipAuthRedirect: true,
                } as any);

                const created = responseCreate?.data;
                if (created) {
                  if (typeof created.id === 'number') return created.id;
                  if (typeof created.businessId === 'number') return created.businessId;
                  if (created.business && typeof created.business.id === 'number') {
                    return created.business.id;
                  }
                }
              } catch (creationError) {
                console.error('Failed to auto-create marketplace business', creationError);
              }
              return null;
            };

            let businesses = await fetchBusinesses();

            if (businesses.length === 0) {
              const createdBusinessId = await createDefaultMarketplaceBusiness();
              if (createdBusinessId) {
                localStorage.setItem('selectedBusinessId', String(createdBusinessId));
                autoBusinessSelected = true;
              }
              businesses = await fetchBusinesses();
            }

            if (!autoBusinessSelected && businesses.length > 0) {
              localStorage.setItem('selectedBusinessId', String(businesses[0].id));
              autoBusinessSelected = true;
            }
          } catch (fetchError) {
            console.error('Failed to auto-select business for marketplace user', fetchError);
          }
        }

        // Check for redirect after auth
        const redirectPath = localStorage.getItem('redirectAfterAuth');
        if (redirectPath) {
          localStorage.removeItem('redirectAfterAuth');
          navigate(redirectPath, { replace: true });
        } else {
          if (user?.role === 'BUSINESS_MARKET' && autoBusinessSelected) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/business-selection', { replace: true });
          }
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    signIn();
  }, [location.search, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-gray-700">
        <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" aria-label="Signing you in" />
        <p className="text-base font-medium">{isLoading ? 'Signing you in...' : 'Preparing login...'}</p>
      </div>
    </div>
  );
}
