import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress } from '@material-ui/core';
import MergeRequestList from './components/MergeRequestList';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

function App() {
  const [mergeRequests, setMergeRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
      {loading ? (
        <CircularProgress />
      ) : (
        <MergeRequestList mergeRequests={mergeRequests} />
      )}
    </Container>
  );
}

export default App;
