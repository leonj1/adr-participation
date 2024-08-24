import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress, Button } from '@material-ui/core';
import MergeRequestList from './components/MergeRequestList';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:9001';

function App() {
  const [mergeRequests, setMergeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHello, setShowHello] = useState(false);

  const toggleHello = () => {
    setShowHello(!showHello);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/merge-requests`);
        setMergeRequests(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching merge requests:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        GitLab Merge Request Scanner
      </Typography>
      <Button variant="contained" color="primary" onClick={toggleHello} style={{ marginBottom: '20px' }}>
        Toggle Hello World
      </Button>
      {showHello && (
        <Typography variant="h6" gutterBottom>
          Hello World!
        </Typography>
      )}
      {loading ? (
        <CircularProgress />
      ) : (
        <MergeRequestList mergeRequests={mergeRequests} />
      )}
    </Container>
  );
}

export default App;
