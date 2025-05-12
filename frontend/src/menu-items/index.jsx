// project import
import dashboard from './dashboard';
import {pages,  adminPages } from './page';
import utilities from './utilities';
import support from './support';

// ==============================|| MENU ITEMS ||============================== //

const menuItems = {
  items: adminPages ? [dashboard, pages, adminPages, utilities, support] : [dashboard, pages, utilities, support]
};

export default menuItems;
