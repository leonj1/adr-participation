import React from 'react';
import { Drawer, List, ListItem, ListItemText } from '@material-ui/core';

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
        <ListItem button onClick={toggleDrawer}>
          <ListItemText primary="Merge Requests" />
        </ListItem>
      </List>
    </Drawer>
  );
}

export default LeftPane;
