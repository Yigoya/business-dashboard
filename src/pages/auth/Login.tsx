import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Mail, Lock, Coffee } from 'lucide-react';
import api, { getErrorMessage } from '../../lib/axios';
import useAuthStore from '../../store/authStore';
import { Business } from '../../types';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/login', {
        ...data,
        FCMToken: "dKB-Qr1oRlKZmcpB5bM7Ng:APA91bEDkEgF_hC8y6NgIFWBQ-Tq6w5dSp3ALhleFaPRQ2MDV_cwmP-YVQU2NHZ5y38H76kZrXfhVBRuquK7JLK8XgViuhQvaSpb3UkalYLo-TzsvceQpvg",
        deviceType: "Web",
        deviceModel: "Browser",
        operatingSystem: "WEB"
      });

      const user = response.data.user;
      const token = response.data.token;
      setAuth(user, token);
      toast.success('Login successful!');

      // If user account not verified, send to verify-email page
      if (user?.status && String(user.status).toLowerCase() !== 'active') {
        navigate('/auth/verify-email');
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
        navigate(redirectPath);
      } else {
        if (user?.role === 'BUSINESS_MARKET' && autoBusinessSelected) {
          navigate('/dashboard');
        } else {
          navigate('/business-selection');
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoginAttempted) return;

    const params = new URLSearchParams(location.search);
    const email = params.get('email');
    const password = params.get('password');

    if (email && password) {
      setAutoLoginAttempted(true);
      setValue('email', email);
      setValue('password', password);
      handleSubmit(onSubmit)();
    }
  }, [autoLoginAttempted, handleSubmit, location.search, onSubmit, setValue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-blue-50 rounded-full mb-4">
            <Coffee className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-gray-600 mt-2">Sign in to manage your business</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
                type="email"
                className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters"
                  }
                })}
                type="password"
                className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}