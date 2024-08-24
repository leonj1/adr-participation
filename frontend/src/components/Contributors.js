import React, { useState } from 'react';
import { Button, Typography, List, ListItem, ListItemText, CircularProgress } from '@material-ui/core';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Contributors() {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchContributors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/contributors`);
      setContributors(response.data.contributors);
    } catch (error) {
      console.error('Error fetching contributors:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Typography variant="h4" component="h2" gutterBottom>
        Contributors
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={fetchContributors}
        disabled={loading}
        style={{ marginBottom: '20px' }}
      >
        {loading ? 'Loading...' : 'Scan Contributors'}
      </Button>
      {loading && <CircularProgress />}
      {contributors.length > 0 && (
        <List>
          {contributors.map((contributor, index) => (
            <ListItem key={index}>
              <ListItemText primary={contributor} />
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
}

export default Contributors;
