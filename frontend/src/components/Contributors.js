import React, { useState, useEffect } from 'react';
import { Button, Typography, LinearProgress, Paper, Grid } from '@material-ui/core';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import { formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns';
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

function Contributors() {
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

  const fetchTotalMRs = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/total-merge-requests`);
      setTotalMRs(response.data.total_merge_requests);
      setEstimatedTime(response.data.estimated_time);
      setRemainingTime(response.data.estimated_time);
    } catch (error) {
      console.error('Error fetching total MRs:', error);
    }
  };

  const fetchContributors = async () => {
    setLoading(true);
    try {
      await fetchTotalMRs();
      const response = await axios.get(`${BACKEND_URL}/api/contributors`);
      setContributors(response.data.contributors);
      prepareChartData(response.data.contributors);
    } catch (error) {
      console.error('Error fetching contributors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (loading && remainingTime > 0) {
      const startTime = Date.now();
      const totalTime = estimatedTime * 1000; // Convert to milliseconds
      timer = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const remaining = Math.max(0, totalTime - elapsedTime);
        setRemainingTime(Math.ceil(remaining / 1000));
        setProgress((elapsedTime / totalTime) * 100);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [loading, estimatedTime]);

  const formatTime = (seconds) => {
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
    return formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] });
  };

  const prepareChartData = (contributorsData, keyOrFunction, label, color) => {
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
    const chartData = prepareChartData(
      contributorsData,
      c => c.opened + c.committed + c.commented + c.reacted,
      'Total Contributions',
      'rgba(75, 192, 192, '
    );
    setTotalContributions(chartData);
  };

  const prepareReactionsChart = (contributorsData) => {
    const chartData = prepareChartData(contributorsData, 'reacted', 'Reactions', 'rgba(255, 206, 86, ');
    setReactionsChart(chartData);
  };

  const prepareCommentsChart = (contributorsData) => {
    const chartData = prepareChartData(contributorsData, 'commented', 'Comments', 'rgba(54, 162, 235, ');
    setCommentsChart(chartData);
  };

  const prepareCommitsChart = (contributorsData) => {
    const chartData = prepareChartData(contributorsData, 'committed', 'Commits', 'rgba(255, 99, 132, ');
    setCommitsChart(chartData);
  };

  const prepareOpenedMRsChart = (contributorsData) => {
    const chartData = prepareChartData(contributorsData, 'opened', 'Opened MRs', 'rgba(153, 102, 255, ');
    setOpenedMRsChart(chartData);
  };

  useEffect(() => {
    fetchContributors();
  }, []);

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
        onClick={fetchContributors}
        disabled={loading}
        style={{ marginBottom: '20px' }}
      >
        {loading ? 'Loading...' : 'Refresh Contributors'}
      </Button>
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
