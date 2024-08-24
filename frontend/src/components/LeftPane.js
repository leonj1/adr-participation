import React from 'react';
import { Drawer, List, ListItem, ListItemText, IconButton } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';

function LeftPane({ isOpen, toggleDrawer }) {
  return (
    <>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={toggleDrawer}
        style={{ position: 'absolute', left: 10, top: 10, zIndex: 1300 }}
      >
        <MenuIcon />
      </IconButton>
      <Drawer anchor="left" open={isOpen} onClose={toggleDrawer}>
        <List>
          <ListItem button onClick={toggleDrawer}>
            <ListItemText primary="Merge Requests" />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}

export default LeftPane;
