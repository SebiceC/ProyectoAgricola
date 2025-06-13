import Data from './Data';
import dashboard from './dashboard';
import { getAdminPages } from './page';


// ==============================|| MENU ITEMS ||============================== //

const getMenuItems = (user) => {
  return {
    items: [Data, dashboard, ...(user?.role === 'Administrador' ? [getAdminPages()] : [])]
  };
};

export default getMenuItems;
