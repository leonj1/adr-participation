import os
import requests
from urllib.parse import urlparse

GITLAB_API_URL = os.environ.get('GITLAB_API_URL', 'https://gitlab.com/api/v4')
GITLAB_TOKEN = os.environ.get('GITLAB_TOKEN')
REPOSITORY_URL = os.environ.get('REPOSITORY_URL')

def get_project_id():
    """
    Determines the PROJECT_ID based on the REPOSITORY_URL
    :return: PROJECT_ID
    :raises: Exception if there's an error fetching project details
    """
    if not REPOSITORY_URL:
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
        return response.json()['id']
    except requests.exceptions.RequestException as error:
        if error.response:
            if error.response.status_code == 401:
                raise Exception('Unauthorized. Please check your GitLab token.')
            elif error.response.status_code == 404:
                raise Exception('Project not found. Please check your REPOSITORY_URL.')
        raise

def scan_gitlab_repository():
    """
    Scans the GitLab repository for merge requests
    :return: List of merge requests
    :raises: Exception if there's an error fetching merge requests
    """
    if not GITLAB_TOKEN:
        raise Exception('GITLAB_TOKEN is not set')

    try:
        project_id = get_project_id()
        open_mrs = fetch_merge_requests('opened', project_id)
        closed_mrs = fetch_merge_requests('closed', project_id)
        return open_mrs + closed_mrs
    except Exception as error:
        print(f'Error scanning GitLab repository: {error}')
        raise

def fetch_merge_requests(state, project_id):
    """
    Fetches merge requests from GitLab API
    :param state: State of merge requests to fetch ('opened' or 'closed')
    :param project_id: ID of the GitLab project
    :return: List of merge requests
    :raises: Exception if there's an error fetching merge requests
    """
    try:
        response = requests.get(
            f'{GITLAB_API_URL}/projects/{project_id}/merge_requests',
            headers={'PRIVATE-TOKEN': GITLAB_TOKEN},
            params={'state': state, 'per_page': 100}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as error:
        if error.response:
            if error.response.status_code == 401:
                raise Exception('Unauthorized. Please check your GitLab token.')
            elif error.response.status_code == 404:
                raise Exception('Project not found. Please check your REPOSITORY_URL.')
        raise
