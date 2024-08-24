import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress } from '@material-ui/core';
import MergeRequestList from './components/MergeRequestList';
import { scanGitlabRepository } from './utils/gitlabScanner';

function App() {
  const [mergeRequests, setMergeRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await scanGitlabRepository();
        setMergeRequests(data);
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
