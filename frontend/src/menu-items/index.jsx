import Data from './Data';
import dashboard from './dashboard';
import { getAdminPages } from './page';
import settings from './Settings';

// ==============================|| MENU ITEMS ||============================== //

const getMenuItems = (user) => {
  return {
    items: [Data, dashboard, settings, ...(user?.role === 'Administrador' ? [getAdminPages()] : [])]
  };
};

export default getMenuItems;
