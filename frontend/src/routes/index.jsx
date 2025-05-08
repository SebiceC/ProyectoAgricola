import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const AuthLayout = lazy(() => import('layout/AuthLayout'));
const MainLayout = lazy(() => import('layout/MainLayout'));

const Login = lazy(() => import('views/pages/authentication/Login'));
const Register = lazy(() => import('views/pages/authentication/Register'));




// project imports
import MainRoutes from './MainRoutes';
import LoginRoutes from './LoginRoutes';

// ==============================|| ROUTING RENDER ||============================== //

const router = createBrowserRouter([MainRoutes, LoginRoutes], { basename: import.meta.env.VITE_APP_BASE_NAME });

export default router;
