import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Megaphone, 
  MessageSquare, 
  User,
  LogOut,
  Star
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import type { LucideIcon } from 'lucide-react';

type NavChild = { name: string; path: string; icon: LucideIcon };
type NavItem = { name: string; path: string; icon: LucideIcon; children?: NavChild[] };

const navigation: NavItem[] = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', path: '/dashboard/products', icon: Package },
  { name: 'Services', path: '/dashboard/services', icon: Package },
  { name: 'Orders', path: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Promotions', path: '/dashboard/promotions', icon: Megaphone },
  { name: 'Reviews', path: '/dashboard/reviews', icon: Star },
  { name: 'Enquiries', path: '/dashboard/enquiries', icon: MessageSquare },
  { name: 'Profile', path: '/dashboard/profile', icon: User },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const filteredNavigation = useMemo(() => {
    if (user?.role === 'BUSINESS') {
      return navigation.filter((item) => item.path === '/dashboard/profile');
    }
    if (user?.role !== 'BUSINESS_MARKET') {
      return navigation.filter((item) => item.path !== '/dashboard/products');
    }
    return navigation;
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === 'BUSINESS' && location.pathname === '/dashboard') {
      navigate('/dashboard/profile', { replace: true });
    }
  }, [location.pathname, navigate, user?.role]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="h-16 flex items-center px-6 border-b">
            <h1 className="text-xl font-bold text-gray-800">Business Dashboard</h1>
          </div>
          <nav className="mt-6 px-3">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.children && item.children.some(child => location.pathname === child.path));

              if (item.children) {
                return (
                  <div key={item.name} className="mb-4">
                    <div className={`flex items-center px-3 py-2 rounded-lg mb-2 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </div>
                    <div className="ml-6 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.name}
                            to={child.path}
                            className={`flex items-center px-3 py-2 rounded-lg ${
                              isChildActive
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <child.icon className="w-4 h-4 mr-3" />
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg mb-2 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="flex items-center px-3 py-2 rounded-lg mb-2 text-red-600 hover:bg-red-50 w-full"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}