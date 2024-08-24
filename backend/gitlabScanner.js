const axios = require('axios');

const GITLAB_API_URL = process.env.GITLAB_API_URL || 'https://gitlab.com/api/v4';
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const PROJECT_ID = process.env.PROJECT_ID;

/**
 * Scans the GitLab repository for merge requests
 * @returns {Promise<Array>} Array of merge requests
 * @throws {Error} If there's an error fetching merge requests
 */
async function scanGitlabRepository() {
  if (!GITLAB_TOKEN) {
    throw new Error('GITLAB_TOKEN is not set');
  }
  if (!PROJECT_ID) {
    throw new Error('PROJECT_ID is not set');
  }

  try {
    const openMRs = await fetchMergeRequests('opened');
    const closedMRs = await fetchMergeRequests('closed');
    return [...openMRs, ...closedMRs];
  } catch (error) {
    console.error('Error scanning GitLab repository:', error);
    throw error;
  }
}

/**
 * Fetches merge requests from GitLab API
 * @param {string} state - State of merge requests to fetch ('opened' or 'closed')
 * @returns {Promise<Array>} Array of merge requests
 * @throws {Error} If there's an error fetching merge requests
 */
async function fetchMergeRequests(state) {
  try {
    const response = await axios.get(`${GITLAB_API_URL}/projects/${PROJECT_ID}/merge_requests`, {
      headers: {
        'PRIVATE-TOKEN': GITLAB_TOKEN
      },
      params: {
        state: state,
        per_page: 100
      }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error('Unauthorized. Please check your GitLab token.');
      } else if (error.response.status === 404) {
        throw new Error('Project not found. Please check your PROJECT_ID.');
      }
    }
    throw error;
  }
}

module.exports = { scanGitlabRepository };
