import { lazy } from 'react';
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from 'routes/ProtectedRoute';
import UsersManagement from 'pages/admin/UsersManagement';
import RolesManagement from 'pages/admin/RolesManagement';

const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));


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
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'admin',
      children: [
        {
          path: 'users',
          element: localStorage.getItem('role') === 'admin' ? (
            <UsersManagement />
          ) : (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h2>No tienes permisos para acceder a esta página.</h2>
            </div>
          )
        },
        {
          path: 'roles',
          element: localStorage.getItem('role') === 'admin' ? (
            <RolesManagement />
          ) : (
            <div>No tienes permisos para acceder a esta página.</div>
          )
        }
      ]
    }
  ]
};

export default MainRoutes;
