import React, { useState } from 'react';
import { Button, Typography, LinearProgress, Paper, Grid, CircularProgress } from '@material-ui/core';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import { formatDuration, intervalToDuration } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Contributors({ repoUrl }) {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalContributions, setTotalContributions] = useState({ labels: [], datasets: [] });
  const [reactionsChart, setReactionsChart] = useState({ labels: [], datasets: [] });
  const [commentsChart, setCommentsChart] = useState({ labels: [], datasets: [] });
  const [commitsChart, setCommitsChart] = useState({ labels: [], datasets: [] });
  const [openedMRsChart, setOpenedMRsChart] = useState({ labels: [], datasets: [] });
  const [totalMRs, setTotalMRs] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fetchingMRs, setFetchingMRs] = useState(false);

  const fetchTotalMRs = async () => {
    setFetchingMRs(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/total-merge-requests`, {
        params: { repository_url: repoUrl }
      });
      setTotalMRs(response.data.total_merge_requests);
      const estimatedSeconds = response.data.total_merge_requests * 1.5;
      setEstimatedTime(estimatedSeconds);
      setRemainingTime(estimatedSeconds);
    } catch (error) {
      console.error('Error fetching total MRs:', error);
    } finally {
      setFetchingMRs(false);
    }
  };

  const fetchContributors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/contributors`, {
        params: { repository_url: repoUrl }
      });
      setContributors(response.data.contributors);
      prepareChartData(response.data.contributors);
    } catch (error) {
      console.error('Error fetching contributors:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
    return formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] });
  };

  const prepareChartData = (contributorsData) => {
    prepareTotalContributions(contributorsData);
    prepareReactionsChart(contributorsData);
    prepareCommentsChart(contributorsData);
    prepareCommitsChart(contributorsData);
    prepareOpenedMRsChart(contributorsData);
  };

  const prepareDataset = (contributorsData, keyOrFunction, label, color) => {
    const getValue = typeof keyOrFunction === 'function' ? keyOrFunction : c => c[keyOrFunction];
    const filteredData = contributorsData.filter(c => getValue(c) > 0);
    const sortedData = [...filteredData].sort((a, b) => getValue(b) - getValue(a));
    const labels = sortedData.map(c => c.username);
    const data = sortedData.map(getValue);
    const maxValue = Math.max(...data);

    return {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: data.map(value => `${color}${value / maxValue})`),
      }]
    };
  };

  const prepareTotalContributions = (contributorsData) => {
    const chartData = prepareDataset(
      contributorsData,
      c => c.opened + c.committed + c.commented + c.reacted,
      'Total Contributions',
      'rgba(75, 192, 192, '
    );
    setTotalContributions(chartData);
  };

  const prepareReactionsChart = (contributorsData) => {
    const chartData = prepareDataset(contributorsData, 'reacted', 'Reactions', 'rgba(255, 206, 86, ');
    setReactionsChart(chartData);
  };

  const prepareCommentsChart = (contributorsData) => {
    const chartData = prepareDataset(contributorsData, 'commented', 'Comments', 'rgba(54, 162, 235, ');
    setCommentsChart(chartData);
  };

  const prepareCommitsChart = (contributorsData) => {
    const chartData = prepareDataset(contributorsData, 'committed', 'Commits', 'rgba(255, 99, 132, ');
    setCommitsChart(chartData);
  };

  const prepareOpenedMRsChart = (contributorsData) => {
    const chartData = prepareDataset(contributorsData, 'opened', 'Opened MRs', 'rgba(153, 102, 255, ');
    setOpenedMRsChart(chartData);
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      <Typography variant="h4" component="h2" gutterBottom>
        Contributors
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={fetchTotalMRs}
        disabled={fetchingMRs || loading}
        style={{ marginBottom: '20px' }}
      >
        {fetchingMRs ? 'Fetching MRs...' : 'Fetch Total MRs'}
      </Button>
      {totalMRs > 0 && (
        <>
          <Typography variant="body1" gutterBottom>
            Total Merge Requests: {totalMRs}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Estimated processing time: {formatTime(estimatedTime)}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={fetchContributors}
            disabled={loading}
            style={{ marginBottom: '20px', marginLeft: '10px' }}
          >
            {loading ? 'Loading...' : 'Fetch Contributors'}
          </Button>
        </>
      )}
      {loading && (
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <Typography variant="body1" style={{ marginBottom: '10px' }}>
            Processing {totalMRs} merge requests...
          </Typography>
          <LinearProgress variant="determinate" value={progress} style={{ height: '10px', borderRadius: '5px' }} />
          <Typography variant="body1" style={{ marginTop: '10px' }}>
            Estimated time remaining: {formatTime(remainingTime)}
          </Typography>
        </div>
      )}
      {totalContributions.labels.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper style={{ padding: '20px', marginTop: '20px' }}>
              <Bar options={{...options, plugins: {...options.plugins, title: {...options.plugins.title, text: 'Total Contributions'}}}} data={totalContributions} />
            </Paper>
          </Grid>
          {reactionsChart.labels.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper style={{ padding: '20px', marginTop: '20px' }}>
                <Bar options={{...options, plugins: {...options.plugins, title: {...options.plugins.title, text: 'Reactions'}}}} data={reactionsChart} />
              </Paper>
            </Grid>
          )}
          {commentsChart.labels.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper style={{ padding: '20px', marginTop: '20px' }}>
                <Bar options={{...options, plugins: {...options.plugins, title: {...options.plugins.title, text: 'Comments'}}}} data={commentsChart} />
              </Paper>
            </Grid>
          )}
          {commitsChart.labels.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper style={{ padding: '20px', marginTop: '20px' }}>
                <Bar options={{...options, plugins: {...options.plugins, title: {...options.plugins.title, text: 'Commits'}}}} data={commitsChart} />
              </Paper>
            </Grid>
          )}
          {openedMRsChart.labels.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper style={{ padding: '20px', marginTop: '20px' }}>
                <Bar options={{...options, plugins: {...options.plugins, title: {...options.plugins.title, text: 'Opened MRs'}}}} data={openedMRsChart} />
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </div>
  );
}

export default Contributors;
