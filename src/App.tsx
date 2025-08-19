import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import BusinessSelection from './pages/BusinessSelection';
import DashboardLayout from './components/layouts/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Services from './pages/dashboard/Services';
import Orders from './pages/dashboard/Orders';
import Promotions from './pages/dashboard/Promotions';
import Enquiries from './pages/dashboard/Enquiries';
import Profile from './pages/dashboard/Profile';
import Reviews from './pages/dashboard/Review';
import useAuthStore from './store/authStore';
import BusinessRegistration from './pages/BusinessRegistration';

const queryClient = new QueryClient();

function App() {
  const { token } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          {/* Root Route */}
          <Route path="/" element={
            token ? <Navigate to="/business-selection" replace /> : <Navigate to="/auth/login" replace />
          } />
          
          {/* Protected Routes */}
          {token ? (
            <>
              <Route path="/business-selection" element={<BusinessSelection />} />
              <Route path="/create-business" element={<BusinessRegistration />} />
              
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Overview />} />
                <Route path="services" element={<Services />} />
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
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          )}
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </QueryClientProvider>
  );
}

export default App;