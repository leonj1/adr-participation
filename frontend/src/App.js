import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress, Button, TextField } from '@material-ui/core';
import MergeRequestTable from './components/MergeRequestTable';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [mergeRequests, setMergeRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [totalMRs, setTotalMRs] = useState(10);
  const [maxAge, setMaxAge] = useState(30);

  const fetchMergeRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/merge-requests`, {
        params: { total: totalMRs, max_age: maxAge }
      });
      const sortedMergeRequests = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setMergeRequests(sortedMergeRequests);
    } catch (error) {
      console.error('Error fetching merge requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    setParticipantsLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/merge-requests-with-participants`, {
        params: { total: totalMRs, max_age: maxAge }
      });
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
      <TextField
        type="number"
        label="Total MRs"
        value={totalMRs}
        onChange={(e) => setTotalMRs(Math.max(1, parseInt(e.target.value) || 1))}
        style={{ marginRight: '20px' }}
      />
      <TextField
        type="number"
        label="Max Age (days)"
        value={maxAge}
        onChange={(e) => setMaxAge(Math.max(1, parseInt(e.target.value) || 1))}
        style={{ marginRight: '20px' }}
      />
      <Button 
        variant="contained" 
        color="primary" 
        onClick={fetchMergeRequests}
        disabled={loading}
        style={{ marginRight: '20px' }}
      >
        {loading ? 'Loading...' : 'Fetch MRs'}
      </Button>
      <Button 
        variant="contained" 
        color="secondary" 
        onClick={fetchParticipants} 
        disabled={participantsLoading}
      >
        {participantsLoading ? 'Loading Participants...' : 'Load Participants'}
      </Button>
      {mergeRequests.length > 0 && (
        <MergeRequestTable mergeRequests={mergeRequests} />
      )}
    </Container>
  );
}

export default App;
