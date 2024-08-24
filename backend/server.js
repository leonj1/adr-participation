const express = require('express');
const cors = require('cors');
const { scanGitlabRepository } = require('./gitlabScanner');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

/**
 * @api {get} /api/merge-requests Get all merge requests
 * @apiName GetMergeRequests
 * @apiGroup MergeRequests
 *
 * @apiSuccess {Object[]} mergeRequests List of merge requests
 * @apiError {Object} error Error object with message
 */
app.get('/api/merge-requests', async (req, res) => {
  try {
    const mergeRequests = await scanGitlabRepository();
    res.json(mergeRequests);
  } catch (error) {
    console.error('Error fetching merge requests:', error);
    if (error.response && error.response.status === 401) {
      res.status(401).json({ error: 'Unauthorized. Please check your GitLab token.' });
    } else if (error.response && error.response.status === 404) {
      res.status(404).json({ error: 'Project not found. Please check your PROJECT_ID.' });
    } else {
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
