import React from 'react';
import { List, ListItem, ListItemText, Typography } from '@material-ui/core';

function MergeRequestList({ mergeRequests }) {
  return (
    <List>
      {mergeRequests.map((mr) => (
        <ListItem key={mr.id}>
          <ListItemText
            primary={mr.title}
            secondary={
              <>
                <Typography component="span" variant="body2" color="textPrimary">
                  Status: {mr.state}
                </Typography>
                {` — ${mr.description}`}
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}

export default MergeRequestList;
