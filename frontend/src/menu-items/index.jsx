import Data from './Data';
import dashboard from './dashboard';
import settings from './Settings';
import Prec from './Prec';
import { getAdminPages } from './page';

// ==============================|| MENU ITEMS ||============================== //

const getMenuItems = (user) => {
  return {
    items: [Data, dashboard, settings, Prec, ...(user?.role?.includes('Administrador') ? [getAdminPages()] : [])]
  };
};

export default getMenuItems;
