import React from 'react';
import { Drawer, List, ListItem, ListItemText, ListItemIcon } from '@material-ui/core';
import { Link } from 'react-router-dom';
import MergeTypeIcon from '@material-ui/icons/MergeType';
import PeopleIcon from '@material-ui/icons/People';

function LeftPane({ isOpen, toggleDrawer, width = 240 }) {
  return (
    <Drawer 
      anchor="left" 
      open={isOpen} 
      onClose={toggleDrawer}
      variant="persistent"
      PaperProps={{
        style: { width: `${width}px`, marginTop: '64px' }
      }}
    >
      <List>
        <ListItem button component={Link} to="/" onClick={toggleDrawer}>
          <ListItemIcon><MergeTypeIcon /></ListItemIcon>
          <ListItemText primary="Merge Requests" />
        </ListItem>
        <ListItem button component={Link} to="/contributors" onClick={toggleDrawer}>
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Contributors" />
        </ListItem>
      </List>
    </Drawer>
  );
}

export default LeftPane;
