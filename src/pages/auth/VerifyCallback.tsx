import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api, { getErrorMessage } from '../../lib/axios';
import useAuthStore from '../../store/authStore';

export default function VerifyCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      toast.error('Missing verification token');
      return;
    }

    const run = async () => {
      try {
        setStatus('verifying');
        const res = await api.get(`/auth/verify`, { params: { token } });
        const { user, token: authToken } = res.data || {};
        if (user && authToken) {
          setAuth(user, authToken);
          setStatus('success');
          toast.success('Email verified!');
          navigate('/business-selection', { replace: true });
        } else if (user) {
          // In case backend returns only user like register
          setAuth(user, localStorage.getItem('token') || '');
          setStatus('success');
          toast.success('Email verified!');
          navigate('/business-selection', { replace: true });
        } else {
          throw new Error('Invalid verify response');
        }
      } catch (err) {
        setStatus('error');
        toast.error(getErrorMessage(err));
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        {status === 'verifying' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900">Verifying your email…</h2>
            <p className="text-gray-600 mt-2">Please wait while we confirm your account.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900">Verification failed</h2>
            <p className="text-gray-600 mt-2">The verification link is invalid or expired.</p>
            <p className="text-gray-600 mt-2">
              Try logging in again or request a new link.
            </p>
            <div className="mt-6">
              <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">Go to Login</Link>
            </div>
          </>
        )}
        {status === 'idle' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900">Preparing verification…</h2>
          </>
        )}
      </div>
    </div>
  );
}
