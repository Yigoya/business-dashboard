import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import VerifyCallback from './pages/auth/VerifyCallback';
import TokenLogin from './pages/auth/TokenLogin';
import BusinessSelection from './pages/BusinessSelection';
import DashboardLayout from './components/layouts/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Services from './pages/dashboard/Services';
import Products from './pages/dashboard/Products';
import Orders from './pages/dashboard/Orders';
import Promotions from './pages/dashboard/Promotions';
import Enquiries from './pages/dashboard/Enquiries';
import Profile from './pages/dashboard/Profile';
import Reviews from './pages/dashboard/Review';
import useAuthStore from './store/authStore';
import BusinessRegistration from './pages/BusinessRegistration';

const queryClient = new QueryClient();

function App() {
  const { token, user } = useAuthStore();
  const defaultProtectedPath = user?.role === 'BUSINESS_MARKET'
    ? '/dashboard'
    : user?.role === 'BUSINESS'
      ? '/dashboard/profile'
      : '/business-selection';

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/token-login" element={<TokenLogin />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/verify" element={<VerifyCallback />} />
          {/* Root Route */}
          <Route path="/" element={
            token ? <Navigate to={defaultProtectedPath} replace /> : <Navigate to="/login" replace />
          } />
          
          {/* Protected Routes */}
          {token ? (
            <>
              <Route path="/business-selection" element={<BusinessSelection />} />
              <Route path="/create-business" element={<BusinessRegistration />} />
              
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Overview />} />
                <Route path="services" element={<Services />} />
                <Route path="products" element={<Products />} />
                <Route path="orders" element={<Orders />} />
                <Route path="promotions" element={<Promotions />} />
                <Route path="enquiries" element={<Enquiries />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Catch all route for authenticated users */}
              <Route path="*" element={<Navigate to="/business-selection" replace />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </QueryClientProvider>
  );
}

export default App;