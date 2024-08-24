import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress, Button, TextField, AppBar, Toolbar, IconButton, Box } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import MenuIcon from '@material-ui/icons/Menu';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
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
  const [openMRsCount, setOpenMRsCount] = useState(null);
  const [openMRsError, setOpenMRsError] = useState(null);

  useEffect(() => {
    fetchRepoUrl();
    fetchOpenMRsCount();
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

  const fetchOpenMRsCount = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/open-merge-requests-count`);
      setOpenMRsCount(response.data.open_merge_requests_count);
      setOpenMRsError(null);
    } catch (error) {
      console.error('Error fetching open MRs count:', error);
      setOpenMRsError('Failed to fetch open merge requests count');
    }
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
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>
          <Button color="inherit" component={Link} to="/contributors">
            Contributors
          </Button>
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
            {openMRsError ? (
              <Alert severity="error" style={{ marginBottom: '20px' }}>{openMRsError}</Alert>
            ) : openMRsCount !== null ? (
              <Typography variant="h6" component="h3" gutterBottom>
                Open Merge Requests: {openMRsCount}
              </Typography>
            ) : (
              <CircularProgress size={24} style={{ marginBottom: '20px' }} />
            )}
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
