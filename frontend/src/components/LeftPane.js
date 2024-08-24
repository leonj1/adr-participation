import React from 'react';
import { Drawer, List, ListItem, ListItemText } from '@material-ui/core';
import { Link } from 'react-router-dom';

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
          <ListItemText primary="Merge Requests" />
        </ListItem>
        <ListItem button component={Link} to="/contributors" onClick={toggleDrawer}>
          <ListItemText primary="Contributors" />
        </ListItem>
      </List>
    </Drawer>
  );
}

export default LeftPane;
