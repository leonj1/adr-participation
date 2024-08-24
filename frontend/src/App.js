import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress, Button } from '@material-ui/core';
import MergeRequestTable from './components/MergeRequestTable';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [mergeRequests, setMergeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  useEffect(() => {
    const fetchMergeRequests = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/merge-requests`);
        const sortedMergeRequests = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setMergeRequests(sortedMergeRequests);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching merge requests:', error);
        setLoading(false);
      }
    };

    fetchMergeRequests();
  }, []);

  const fetchParticipants = async () => {
    setParticipantsLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/merge-requests-with-participants`);
      const sortedMergeRequests = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setMergeRequests(sortedMergeRequests);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setParticipantsLoading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        GitLab Merge Request Scanner
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={fetchParticipants} 
        disabled={participantsLoading}
        style={{ marginBottom: '20px' }}
      >
        {participantsLoading ? 'Loading Participants...' : 'Load Participants'}
      </Button>
      {loading ? (
        <CircularProgress />
      ) : (
        <MergeRequestTable mergeRequests={mergeRequests} />
      )}
    </Container>
  );
}

export default App;
