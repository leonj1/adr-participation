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
    return _get_project_details()['id']

def get_repo_url():
    """
    Returns the REPOSITORY_URL
    :return: Repository URL
    """
    logger.info(f"Returning repository URL: {REPOSITORY_URL}")
    return REPOSITORY_URL

def _get_project_details():
    """
    Fetches project details from GitLab API
    :return: Project details dictionary
    :raises: Exception if there's an error fetching project details
    """
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
        project_details = response.json()
        logger.info(f"Successfully retrieved project details for: {project_details['name']}")
        return project_details
    except requests.exceptions.RequestException as error:
        if error.response:
            if error.response.status_code == 401:
                logger.error("Unauthorized. Please check your GitLab token.")
                raise Exception('Unauthorized. Please check your GitLab token.')
            elif error.response.status_code == 404:
                logger.error("Project not found. Please check your REPOSITORY_URL.")
                raise Exception('Project not found. Please check your REPOSITORY_URL.')
        logger.error(f"Error getting project details: {str(error)}")
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

def get_merge_requests_with_participants(project_id, total, max_age):
    """
    Fetches merge requests with their participants
    :param project_id: ID of the GitLab project
    :param total: Maximum number of merge requests to fetch
    :param max_age: Maximum age of merge requests in days
    :return: List of merge requests with participants
    """
    logger.info(f"Fetching merge requests with participants for project ID: {project_id}")
    try:
        all_mrs = scan_gitlab_repository(total, max_age)

        for mr in all_mrs:
            mr['participants'] = fetch_merge_request_participants(project_id, mr['iid'])

        logger.info(f"Successfully fetched {len(all_mrs)} merge requests with participants")
        return all_mrs
    except Exception as error:
        logger.error(f'Error fetching merge requests with participants: {error}')
        raise

import time

def get_all_contributors(project_id):
    """
    Fetches all contributors from merge requests with their participation details
    :param project_id: ID of the GitLab project
    :return: Tuple of (List of contributors with participation details, Estimated total time in seconds)
    """
    logger.info(f"Fetching all contributors with participation details for project ID: {project_id}")
    try:
        contributors = {}
        page = 1
        total_mrs = 0
        total_time = 0
        start_time = time.time()

        # First, get the total number of merge requests
        response = requests.get(
            f'{GITLAB_API_URL}/projects/{project_id}/merge_requests',
            headers={'PRIVATE-TOKEN': GITLAB_TOKEN},
            params={'state': 'all', 'per_page': 1}
        )
        response.raise_for_status()
        total_mrs = int(response.headers.get('X-Total', 0))
        
        while True:
            response = requests.get(
                f'{GITLAB_API_URL}/projects/{project_id}/merge_requests',
                headers={'PRIVATE-TOKEN': GITLAB_TOKEN},
                params={'page': page, 'per_page': 100, 'state': 'all'}
            )
            response.raise_for_status()
            merge_requests = response.json()
            if not merge_requests:
                break

            for mr in merge_requests:
                if page == 1 and merge_requests.index(mr) == 0:
                    # Measure time for processing one MR
                    mr_start_time = time.time()
                created_at = datetime.fromisoformat(mr['created_at'].replace('Z', '+00:00'))
                author = mr['author']['username']
                if author not in contributors:
                    contributors[author] = {'opened': 0, 'committed': 0, 'commented': 0, 'reacted': 0, 'timeline': []}
                contributors[author]['opened'] += 1
                contributors[author]['timeline'].append({'date': created_at, 'action': 'opened'})

                participants = fetch_merge_request_participants(project_id, mr['iid'])
                for participant in participants:
                    if participant not in contributors:
                        contributors[participant] = {'opened': 0, 'committed': 0, 'commented': 0, 'reacted': 0, 'timeline': []}
                    if participant != author:
                        contributors[participant]['committed'] += 1
                        contributors[participant]['timeline'].append({'date': created_at, 'action': 'committed'})

                comments_response = requests.get(
                    f'{GITLAB_API_URL}/projects/{project_id}/merge_requests/{mr["iid"]}/notes',
                    headers={'PRIVATE-TOKEN': GITLAB_TOKEN}
                )
                comments_response.raise_for_status()
                comments = comments_response.json()
                for comment in comments:
                    commenter = comment['author']['username']
                    comment_date = datetime.fromisoformat(comment['created_at'].replace('Z', '+00:00'))
                    if commenter not in contributors:
                        contributors[commenter] = {'opened': 0, 'committed': 0, 'commented': 0, 'reacted': 0, 'timeline': []}
                    contributors[commenter]['commented'] += 1
                    contributors[commenter]['timeline'].append({'date': comment_date, 'action': 'commented'})
                    if 'award_emoji' in comment:
                        for emoji in comment['award_emoji']:
                            reactor = emoji['user']['username']
                            if reactor not in contributors:
                                contributors[reactor] = {'opened': 0, 'committed': 0, 'commented': 0, 'reacted': 0, 'timeline': []}
                            contributors[reactor]['reacted'] += 1
                            contributors[reactor]['timeline'].append({'date': comment_date, 'action': 'reacted'})

                if page == 1 and merge_requests.index(mr) == 0:
                    # Calculate time taken for one MR
                    time_per_mr = time.time() - mr_start_time
                    # Estimate total time
                    total_time = time_per_mr * total_mrs

            page += 1

        logger.info(f"Successfully fetched participation details for {len(contributors)} contributors")
        return [{'username': username, **data} for username, data in contributors.items()], total_time
    except Exception as error:
        logger.error(f'Error fetching contributors with participation details: {error}')
        raise
