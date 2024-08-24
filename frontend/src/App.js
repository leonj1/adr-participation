import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress, Button, TextField, AppBar, Toolbar, IconButton } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import MergeRequestTable from './components/MergeRequestTable';
import Contributors from './components/Contributors';
import LeftPane from './components/LeftPane';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [mergeRequests, setMergeRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [totalMRs, setTotalMRs] = useState(10);
  const [maxAge, setMaxAge] = useState(30);
  const [repoUrl, setRepoUrl] = useState('');
  const [isLeftPaneOpen, setIsLeftPaneOpen] = useState(true);

  useEffect(() => {
    fetchRepoUrl();
  }, []);

  const fetchRepoUrl = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/repo-url`);
      setRepoUrl(response.data.repo_url);
    } catch (error) {
      console.error('Error fetching repository URL:', error);
    }
  };

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

  const toggleLeftPane = () => {
    setIsLeftPaneOpen(!isLeftPaneOpen);
  };

  return (
    <Router>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleLeftPane}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            GitLab Merge Request Scanner
          </Typography>
        </Toolbar>
      </AppBar>
      <LeftPane isOpen={isLeftPaneOpen} toggleDrawer={toggleLeftPane} />
      <Container style={{ marginTop: '80px', marginLeft: isLeftPaneOpen ? '240px' : '0', transition: 'margin-left 0.3s' }}>
        <Switch>
          <Route exact path="/">
            <Typography variant="h4" component="h1" gutterBottom>
              GitLab Merge Request Scanner
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
              REPO: {repoUrl}
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
          </Route>
          <Route path="/contributors">
            <Contributors />
          </Route>
        </Switch>
      </Container>
    </Router>
  );
}

export default App;
