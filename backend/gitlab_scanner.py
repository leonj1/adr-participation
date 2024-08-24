import os
import requests
import logging
from urllib.parse import urlparse

GITLAB_API_URL = os.environ.get('GITLAB_API_URL', 'https://gitlab.com/api/v4')
GITLAB_TOKEN = os.environ.get('GITLAB_TOKEN')
REPOSITORY_URL = os.environ.get('REPOSITORY_URL')

logger = logging.getLogger(__name__)

def get_project_id():
    """
    Determines the PROJECT_ID based on the REPOSITORY_URL
    :return: PROJECT_ID
    :raises: Exception if there's an error fetching project details
    """
    logger.info(f"Attempting to get project ID for repository: {REPOSITORY_URL}")
    if not REPOSITORY_URL:
        logger.error("REPOSITORY_URL is not set")
        raise Exception('REPOSITORY_URL is not set')

    parsed_url = urlparse(REPOSITORY_URL)
    path = parsed_url.path.strip('/')
    encoded_path = requests.utils.quote(path, safe='')

    try:
        response = requests.get(
            f'{GITLAB_API_URL}/projects/{encoded_path}',
            headers={'PRIVATE-TOKEN': GITLAB_TOKEN}
        )
        response.raise_for_status()
        project_id = response.json()['id']
        logger.info(f"Successfully retrieved project ID: {project_id}")
        return project_id
    except requests.exceptions.RequestException as error:
        if error.response:
            if error.response.status_code == 401:
                logger.error("Unauthorized. Please check your GitLab token.")
                raise Exception('Unauthorized. Please check your GitLab token.')
            elif error.response.status_code == 404:
                logger.error("Project not found. Please check your REPOSITORY_URL.")
                raise Exception('Project not found. Please check your REPOSITORY_URL.')
        logger.error(f"Error getting project ID: {str(error)}")
        raise

def scan_gitlab_repository():
    """
    Scans the GitLab repository for merge requests
    :return: List of merge requests
    :raises: Exception if there's an error fetching merge requests
    """
    logger.info("Starting GitLab repository scan")
    if not GITLAB_TOKEN:
        logger.error("GITLAB_TOKEN is not set")
        raise Exception('GITLAB_TOKEN is not set')

    try:
        project_id = get_project_id()
        open_mrs = fetch_merge_requests('opened', project_id)
        closed_mrs = fetch_merge_requests('closed', project_id)
        total_mrs = len(open_mrs) + len(closed_mrs)
        logger.info(f"Scan complete. Retrieved {total_mrs} merge requests")
        return open_mrs + closed_mrs
    except Exception as error:
        logger.error(f'Error scanning GitLab repository: {error}')
        raise

def fetch_merge_requests(state, project_id):
    """
    Fetches merge requests from GitLab API
    :param state: State of merge requests to fetch ('opened' or 'closed')
    :param project_id: ID of the GitLab project
    :return: List of merge requests
    :raises: Exception if there's an error fetching merge requests
    """
    logger.info(f"Fetching {state} merge requests for project ID: {project_id}")
    try:
        response = requests.get(
            f'{GITLAB_API_URL}/projects/{project_id}/merge_requests',
            headers={'PRIVATE-TOKEN': GITLAB_TOKEN},
            params={'state': state, 'per_page': 100}
        )
        response.raise_for_status()
        merge_requests = response.json()
        logger.info(f"Successfully fetched {len(merge_requests)} {state} merge requests")
        return merge_requests
    except requests.exceptions.RequestException as error:
        if error.response:
            if error.response.status_code == 401:
                logger.error("Unauthorized. Please check your GitLab token.")
                raise Exception('Unauthorized. Please check your GitLab token.')
            elif error.response.status_code == 404:
                logger.error("Project not found. Please check your REPOSITORY_URL.")
                raise Exception('Project not found. Please check your REPOSITORY_URL.')
        logger.error(f"Error fetching merge requests: {str(error)}")
        raise
