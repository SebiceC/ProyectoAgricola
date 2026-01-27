import { useUser } from '../../../../../contexts/UserContext';
import PropTypes from 'prop-types';

import { List, ListItemButton, ListItemIcon, ListItemText, Divider, Typography, Box } from '@mui/material';

import EditOutlined from '@ant-design/icons/EditOutlined';
import ProfileOutlined from '@ant-design/icons/ProfileOutlined';
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import WalletOutlined from '@ant-design/icons/WalletOutlined';

export default function ProfileTab({ handleLogout }) {
  const { user } = useUser();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1">
        {user?.first_name} {user?.last_name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {user?.email}
      </Typography>
      <Divider sx={{ my: 1 }} />
      <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
        <ListItemButton>
          <ListItemIcon>
            <EditOutlined />
          </ListItemIcon>
          <ListItemText primary="Edit Profile" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon>
            <UserOutlined />
          </ListItemIcon>
          <ListItemText primary="View Profile" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon>
            <ProfileOutlined />
          </ListItemIcon>
          <ListItemText primary="Social Profile" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon>
            <WalletOutlined />
          </ListItemIcon>
          <ListItemText primary="Billing" />
        </ListItemButton>
        <ListItemButton onClick={handleLogout}>
          <ListItemIcon>
            <LogoutOutlined />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Box>
  );
}

ProfileTab.propTypes = { handleLogout: PropTypes.func };
