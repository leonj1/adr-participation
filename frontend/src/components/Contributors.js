import React, { useState, useEffect } from 'react';
import { Button, Typography, CircularProgress, Paper } from '@material-ui/core';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
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
  const [chartData, setChartData] = useState(null);

  const fetchContributors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/contributors`);
      setContributors(response.data.contributors);
      prepareChartData(response.data.contributors);
    } catch (error) {
      console.error('Error fetching contributors:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (contributorsData) => {
    const labels = contributorsData.map(c => c.username);
    const datasets = [
      {
        label: 'Opened MRs',
        data: contributorsData.map(c => c.opened),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Commits',
        data: contributorsData.map(c => c.committed),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
      {
        label: 'Comments',
        data: contributorsData.map(c => c.commented),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Reactions',
        data: contributorsData.map(c => c.reacted),
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
      },
    ];

    setChartData({ labels, datasets });
  };

  useEffect(() => {
    fetchContributors();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Contributor Participation',
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
      {loading && <CircularProgress />}
      {chartData && (
        <Paper style={{ padding: '20px', marginTop: '20px' }}>
          <Bar options={options} data={chartData} />
        </Paper>
      )}
    </div>
  );
}

export default Contributors;
