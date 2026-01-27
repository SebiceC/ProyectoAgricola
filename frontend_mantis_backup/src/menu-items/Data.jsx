// assets
import { CloudOutlined } from '@ant-design/icons';

// icons
const icons = {
  CloudOutlined
};

// ==============================|| MENU ITEMS - SAMPLE PAGE & DOCUMENTATION ||============================== //

const data = {
  id: 'data',
  title: 'Data',
  type: 'group',
  children: [
    {
      id: 'eto',
      title: 'Eto',
      type: 'item',
      url: '/eto',
      icon: icons.CloudOutlined
    }
  ]
};

export default data;
