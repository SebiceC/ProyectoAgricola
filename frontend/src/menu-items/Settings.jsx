// assets
import { SettingOutlined } from '@ant-design/icons';

// icons
const icons = {
  SettingOutlined
};

// ==============================|| MENU ITEMS - SETTINGS ||============================== //

const settings = {
  id: 'settings',
  title: 'Settings',
  type: 'group',
  children: [
    {
      id: 'configuration',
      title: 'Configuration',
      type: 'item',
      url: '/settings/configuration',
      icon: icons.SettingOutlined
    }
  ]
};

export default settings;