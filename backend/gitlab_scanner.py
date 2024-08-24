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

from datetime import datetime, timedelta

def scan_gitlab_repository(total, max_age):
    """
    Scans the GitLab repository for merge requests
    :param total: Maximum number of merge requests to fetch
    :param max_age: Maximum age of merge requests in days
    :return: List of merge requests
    :raises: Exception if there's an error fetching merge requests
    """
    logger.info(f"Starting GitLab repository scan for {total} MRs with max age of {max_age} days")
    if not GITLAB_TOKEN:
        logger.error("GITLAB_TOKEN is not set")
        raise Exception('GITLAB_TOKEN is not set')

    try:
        project_id = get_project_id()
        open_mrs = fetch_merge_requests('opened', project_id, total, max_age)
        closed_mrs = fetch_merge_requests('closed', project_id, total, max_age)
        all_mrs = open_mrs + closed_mrs
        all_mrs.sort(key=lambda x: x['created_at'], reverse=True)
        total_mrs = min(len(all_mrs), total)
        logger.info(f"Scan complete. Retrieved {total_mrs} merge requests")
        return all_mrs[:total_mrs]
    except Exception as error:
        logger.error(f'Error scanning GitLab repository: {error}')
        raise

def fetch_merge_requests(state, project_id, limit, max_age):
    """
    Fetches merge requests from GitLab API
    :param state: State of merge requests to fetch ('opened' or 'closed')
    :param project_id: ID of the GitLab project
    :param limit: Maximum number of merge requests to fetch
    :param max_age: Maximum age of merge requests in days
    :return: List of merge requests
    :raises: Exception if there's an error fetching merge requests
    """
    logger.info(f"Fetching {state} merge requests for project ID: {project_id}")
    try:
        oldest_date = datetime.now() - timedelta(days=max_age)
        params = {
            'state': state,
            'per_page': 100,  # Fetch maximum allowed per page
            'created_after': oldest_date.isoformat()
        }
        merge_requests = []
        page = 1

        while len(merge_requests) < limit:
            params['page'] = page
            response = requests.get(
                f'{GITLAB_API_URL}/projects/{project_id}/merge_requests',
                headers={'PRIVATE-TOKEN': GITLAB_TOKEN},
                params=params
            )
            response.raise_for_status()
            page_mrs = response.json()
            if not page_mrs:
                break
            merge_requests.extend(page_mrs)
            page += 1

        logger.info(f"Successfully fetched {len(merge_requests)} {state} merge requests")
        return merge_requests[:limit]
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

def fetch_merge_request_participants(project_id, merge_request_iid):
    """
    Fetches participants for a specific merge request
    :param project_id: ID of the GitLab project
    :param merge_request_iid: IID of the merge request
    :return: Set of unique participants
    """
    logger.info(f"Fetching participants for merge request {merge_request_iid} in project {project_id}")
    participants = set()

    try:
        # Fetch merge request details
        mr_response = requests.get(
            f'{GITLAB_API_URL}/projects/{project_id}/merge_requests/{merge_request_iid}',
            headers={'PRIVATE-TOKEN': GITLAB_TOKEN}
        )
        mr_response.raise_for_status()
        mr_data = mr_response.json()
        
        # Add author
        participants.add(mr_data['author']['username'])

        # Fetch comments
        comments_response = requests.get(
            f'{GITLAB_API_URL}/projects/{project_id}/merge_requests/{merge_request_iid}/notes',
            headers={'PRIVATE-TOKEN': GITLAB_TOKEN}
        )
        comments_response.raise_for_status()
        comments = comments_response.json()

        # Add commenters and reactors
        for comment in comments:
            participants.add(comment['author']['username'])
            if 'award_emoji' in comment:
                for emoji in comment['award_emoji']:
                    participants.add(emoji['user']['username'])

        # Fetch commits
        commits_response = requests.get(
            f'{GITLAB_API_URL}/projects/{project_id}/merge_requests/{merge_request_iid}/commits',
            headers={'PRIVATE-TOKEN': GITLAB_TOKEN}
        )
        commits_response.raise_for_status()
        commits = commits_response.json()

        # Add committers
        for commit in commits:
            participants.add(commit['author_name'])

        logger.info(f"Successfully fetched {len(participants)} participants for merge request {merge_request_iid}")
        return list(participants)
    except requests.exceptions.RequestException as error:
        logger.error(f"Error fetching participants for merge request {merge_request_iid}: {str(error)}")
        raise

def get_merge_requests_with_participants(project_id):
    """
    Fetches all merge requests with their participants
    :param project_id: ID of the GitLab project
    :return: List of merge requests with participants
    """
    logger.info(f"Fetching all merge requests with participants for project ID: {project_id}")
    try:
        open_mrs = fetch_merge_requests('opened', project_id)
        closed_mrs = fetch_merge_requests('closed', project_id)
        all_mrs = open_mrs + closed_mrs

        for mr in all_mrs:
            mr['participants'] = fetch_merge_request_participants(project_id, mr['iid'])

        logger.info(f"Successfully fetched {len(all_mrs)} merge requests with participants")
        return all_mrs
    except Exception as error:
        logger.error(f'Error fetching merge requests with participants: {error}')
        raise
