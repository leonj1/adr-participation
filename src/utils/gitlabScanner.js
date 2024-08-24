import axios from 'axios';

const GITLAB_API_URL = 'https://gitlab.com/api/v4';
const GITLAB_TOKEN = 'YOUR_GITLAB_TOKEN';
const PROJECT_ID = 'YOUR_PROJECT_ID';

export async function scanGitlabRepository() {
  try {
    const openMRs = await fetchMergeRequests('opened');
    const closedMRs = await fetchMergeRequests('closed');
    return [...openMRs, ...closedMRs];
  } catch (error) {
    console.error('Error scanning GitLab repository:', error);
    throw error;
  }
}

async function fetchMergeRequests(state) {
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
}
