import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress } from '@material-ui/core';
import MergeRequestTable from './components/MergeRequestTable';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [mergeRequests, setMergeRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/merge-requests-with-participants`);
        const sortedMergeRequests = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setMergeRequests(sortedMergeRequests);
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
        <MergeRequestTable mergeRequests={mergeRequests} />
      )}
    </Container>
  );
}

export default App;
