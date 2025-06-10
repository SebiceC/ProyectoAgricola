// project import
import Data from './Data';
import dashboard from './dashboard';
import pages from './page';
import utilities from './utilities';
import support from './support';
import settings from './Settings'; // Nueva importación

// ==============================|| MENU ITEMS ||============================== //

const menuItems = {
  items: [Data, dashboard, pages, utilities, settings, support] // Agregamos settings
};

export default menuItems;