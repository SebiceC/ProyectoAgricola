import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute'; // ✅ nueva importación
import Eto from 'pages/ETo/Eto';
import UsersManagement from 'pages/admin/UsersManagement';
import RolesManagement from 'pages/admin/RolesManagement';
import ErrorBoundary from 'components/ErrorBoundary';
import Configuration from 'pages/settings/Configuration'; // Nueva importación

// render - dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - otros
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));


// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      element: <DashboardDefault />
    },
    {
      path: 'admin',
      children: [
        {
          path: 'users',
          element: (
            <AdminRoute>
              <UsersManagement />
            </AdminRoute>
          )
        },
        {
          path: 'roles',
          element: (
            <AdminRoute>
              <RolesManagement />
            </AdminRoute>
          )
        }
      ]
    },
    {
      path: 'eto',
      element: <Eto />
    },
    // Nueva sección de Settings
    {
      path: 'settings',
      children: [
        {
          path: 'configuration',
          element: <Configuration />
        }
      ]
    }
  ]
};

export default MainRoutes;