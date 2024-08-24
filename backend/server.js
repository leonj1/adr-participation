const express = require('express');
const cors = require('cors');
const { scanGitlabRepository } = require('./gitlabScanner');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.get('/api/merge-requests', async (req, res) => {
  try {
    const mergeRequests = await scanGitlabRepository();
    res.json(mergeRequests);
  } catch (error) {
    console.error('Error fetching merge requests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
