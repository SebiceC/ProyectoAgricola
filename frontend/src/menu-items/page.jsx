import { LoginOutlined, ProfileOutlined, UserOutlined, KeyOutlined } from '@ant-design/icons';

const icons = {
  LoginOutlined,
  ProfileOutlined,
  UserOutlined,
  KeyOutlined
};

const getAdminPages = () => ({
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
});

export { getAdminPages };
