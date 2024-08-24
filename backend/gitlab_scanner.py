import os
import requests

GITLAB_API_URL = os.environ.get('GITLAB_API_URL', 'https://gitlab.com/api/v4')
GITLAB_TOKEN = os.environ.get('GITLAB_TOKEN')
PROJECT_ID = os.environ.get('PROJECT_ID')

def scan_gitlab_repository():
    """
    Scans the GitLab repository for merge requests
    :return: List of merge requests
    :raises: Exception if there's an error fetching merge requests
    """
    if not GITLAB_TOKEN:
        raise Exception('GITLAB_TOKEN is not set')
    if not PROJECT_ID:
        raise Exception('PROJECT_ID is not set')

    try:
        open_mrs = fetch_merge_requests('opened')
        closed_mrs = fetch_merge_requests('closed')
        return open_mrs + closed_mrs
    except Exception as error:
        print(f'Error scanning GitLab repository: {error}')
        raise

def fetch_merge_requests(state):
    """
    Fetches merge requests from GitLab API
    :param state: State of merge requests to fetch ('opened' or 'closed')
    :return: List of merge requests
    :raises: Exception if there's an error fetching merge requests
    """
    try:
        response = requests.get(
            f'{GITLAB_API_URL}/projects/{PROJECT_ID}/merge_requests',
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
                raise Exception('Project not found. Please check your PROJECT_ID.')
        raise
