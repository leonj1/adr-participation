import React, { useState, useEffect } from 'react';
import { Button, Typography, LinearProgress, Paper, Grid } from '@material-ui/core';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
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
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [progress, setProgress] = useState(0);

  const fetchContributors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/contributors`);
      setContributors(response.data.contributors);
      prepareChartData(response.data.contributors);
      setEstimatedTime(response.data.estimated_time);
      setRemainingTime(response.data.estimated_time);
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
      const totalTime = remainingTime * 1000; // Convert to milliseconds
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
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const prepareChartData = (contributorsData) => {
    prepareTotalContributions(contributorsData);
    prepareReactionsChart(contributorsData);
    prepareCommentsChart(contributorsData);
    prepareCommitsChart(contributorsData);
    prepareOpenedMRsChart(contributorsData);
  };

  const prepareTotalContributions = (contributorsData) => {
    const sortedData = contributorsData.map(c => ({
      username: c.username,
      total: c.opened + c.committed + c.commented + c.reacted
    })).sort((a, b) => b.total - a.total);

    const labels = sortedData.map(c => c.username);
    const data = sortedData.map(c => c.total);
    const maxValue = Math.max(...data);

    setTotalContributions({
      labels,
      datasets: [{
        label: 'Total Contributions',
        data,
        backgroundColor: data.map(value => `rgba(75, 192, 192, ${value / maxValue})`),
      }]
    });
  };

  const prepareReactionsChart = (contributorsData) => {
    const sortedData = [...contributorsData].sort((a, b) => b.reacted - a.reacted);
    const labels = sortedData.map(c => c.username);
    const data = sortedData.map(c => c.reacted);
    const maxValue = Math.max(...data);

    setReactionsChart({
      labels,
      datasets: [{
        label: 'Reactions',
        data,
        backgroundColor: data.map(value => `rgba(255, 206, 86, ${value / maxValue})`),
      }]
    });
  };

  const prepareCommentsChart = (contributorsData) => {
    const sortedData = [...contributorsData].sort((a, b) => b.commented - a.commented);
    const labels = sortedData.map(c => c.username);
    const data = sortedData.map(c => c.commented);
    const maxValue = Math.max(...data);

    setCommentsChart({
      labels,
      datasets: [{
        label: 'Comments',
        data,
        backgroundColor: data.map(value => `rgba(54, 162, 235, ${value / maxValue})`),
      }]
    });
  };

  const prepareCommitsChart = (contributorsData) => {
    const sortedData = [...contributorsData].sort((a, b) => b.committed - a.committed);
    const labels = sortedData.map(c => c.username);
    const data = sortedData.map(c => c.committed);
    const maxValue = Math.max(...data);

    setCommitsChart({
      labels,
      datasets: [{
        label: 'Commits',
        data,
        backgroundColor: data.map(value => `rgba(255, 99, 132, ${value / maxValue})`),
      }]
    });
  };

  const prepareOpenedMRsChart = (contributorsData) => {
    const sortedData = [...contributorsData].sort((a, b) => b.opened - a.opened);
    const labels = sortedData.map(c => c.username);
    const data = sortedData.map(c => c.opened);
    const maxValue = Math.max(...data);

    setOpenedMRsChart({
      labels,
      datasets: [{
        label: 'Opened MRs',
        data,
        backgroundColor: data.map(value => `rgba(153, 102, 255, ${value / maxValue})`),
      }]
    });
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
