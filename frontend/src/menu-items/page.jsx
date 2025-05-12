// assets
import { LoginOutlined, ProfileOutlined, UserOutlined, KeyOutlined  } from '@ant-design/icons';

// icons
const icons = {
  LoginOutlined,
  ProfileOutlined,
  UserOutlined,
  KeyOutlined 
};

const role = localStorage.getItem('role'); // Traemos el rol del localStorage

// ==============================|| MENU ITEMS - EXTRA PAGES ||============================== //
const adminPages = role === 'admin' ? {
  id: 'admin',
  title: 'Admin',
  type: 'group',
  children: [
    {
      id: 'users-management',
      title: 'User Management',
      type: 'item',
      url: '/admin/users',
      icon: icons.UserOutlined
    },
    {
      id: 'roles-management',
      title: 'Role Management',
      type: 'item',
      url: '/admin/roles',
      icon: icons.KeyOutlined
    }
  ]
}: null;

const pages = {
  id: 'authentication',
  title: 'Authentication',
  type: 'group',
  children: [
    {
      id: 'login1',
      title: 'Login',
      type: 'item',
      url: '/login',
      icon: icons.LoginOutlined,
      target: true
    },
    {
      id: 'register1',
      title: 'Register',
      type: 'item',
      url: '/register',
      icon: icons.ProfileOutlined,
      target: true
    }
  ]
};

export  { pages, adminPages } ;
