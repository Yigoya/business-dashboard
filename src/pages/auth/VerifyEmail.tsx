import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MailCheck, Coffee, RefreshCcw } from 'lucide-react';
import api, { getErrorMessage } from '../../lib/axios';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function VerifyEmail() {
  const { user } = useAuthStore();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string } | null)?.email;
  const email = useMemo(() => emailFromState || user?.email || '', [emailFromState, user]);
  const [isSending, setIsSending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    try {
      setIsSending(true);
      await api.post(`/auth/resend-verification`, null, { params: { email } });
      toast.success('Verification email sent');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="inline-block p-3 bg-blue-50 rounded-full mb-4">
          <Coffee className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Verify your email</h2>
        <p className="text-gray-600 mt-2">
          We sent a verification link to your inbox. Please open the email and click the link to activate your account.
        </p>

        <div className="mt-6">
          <a
            href="https://mail.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <MailCheck className="w-5 h-5" />
            Open Gmail
          </a>
        </div>

        <div className="mt-6 text-left">
          <p className="text-gray-700">
            Sending to: <span className="font-medium">{email || 'unknown'}</span>
          </p>
          <button
            onClick={handleResend}
            disabled={isSending || !email}
            className="mt-3 inline-flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <RefreshCcw className="w-4 h-4" />
            {isSending ? 'Resending…' : 'Resend verification email'}
          </button>
          {!email && (
            <p className="mt-2 text-sm text-red-600">Email not found. Please login to continue.</p>
          )}
        </div>

        <p className="mt-6 text-gray-600">
          Already verified?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
