import os
import logging
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from gitlab_scanner import REPOSITORY_URL, GITLAB_TOKEN, get_project_id, scan_gitlab_repository, get_merge_requests_with_participants, get_repo_url, set_repo_url, get_all_contributors, get_total_merge_requests, get_open_merge_requests_count

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GitLab Merge Request Scanner",
    description="API for scanning GitLab merge requests",
    version="1.0.0",
)

# Log application startup
logger.info(f"Starting application with REPOSITORY_URL: {REPOSITORY_URL}")
logger.info(f"GitLab token length: {len(GITLAB_TOKEN) if GITLAB_TOKEN else 0}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {"message": "GitLab Merge Request Scanner API is running"}

from fastapi import Query

@app.get("/api/merge-requests")
async def get_merge_requests(total: int = Query(10, ge=1), max_age: int = Query(30, ge=1), repository_url: str = Query(...)):
    """
    Get merge requests
    """
    try:
        merge_requests = scan_gitlab_repository(total, max_age, repository_url)
        return merge_requests
    except Exception as error:
        logger.error(f"Error in get_merge_requests: {str(error)}")
        if 'Unauthorized' in str(error):
            raise HTTPException(status_code=401, detail="Unauthorized. Please check your GitLab token.")
        elif 'Project not found' in str(error):
            raise HTTPException(status_code=404, detail="Project not found. Please check your repository URL.")
        else:
            raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(error)}")

@app.get("/api/merge-requests-with-participants")
async def get_merge_requests_participants(total: int = Query(10, ge=1), max_age: int = Query(30, ge=1), repository_url: str = Query(...)):
    """
    Get merge requests with their participants
    """
    try:
        project_id = get_project_id(repository_url)
        merge_requests = get_merge_requests_with_participants(project_id, total, max_age, repository_url)
        return merge_requests
    except Exception as error:
        logger.error(f"Error in get_merge_requests_participants: {str(error)}")
        if 'Unauthorized' in str(error):
            raise HTTPException(status_code=401, detail="Unauthorized. Please check your GitLab token.")
        elif 'Project not found' in str(error):
            raise HTTPException(status_code=404, detail="Project not found. Please check your repository URL.")
        else:
            raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(error)}")

@app.get("/api/repo-url")
async def get_repository_url():
    """
    Get the repository URL
    """
    try:
        repo_url = get_repo_url()
        return {"repo_url": repo_url}
    except Exception as error:
        logger.error(f"Error in get_repository_url: {str(error)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(error)}")

@app.post("/api/set-repo-url")
async def set_repository_url(repo_url: str = Body(..., embed=True)):
    """
    Set the repository URL
    """
    try:
        set_repo_url(repo_url)
        return {"message": "Repository URL set successfully"}
    except Exception as error:
        logger.error(f"Error in set_repository_url: {str(error)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(error)}")

@app.get("/api/contributors")
async def get_contributors(repository_url: str = Query(...)):
    """
    Get all contributors with participation details
    """
    try:
        project_id = get_project_id(repository_url)
        contributors, total_time = get_all_contributors(project_id, repository_url)
        return {"contributors": contributors, "estimated_time": total_time}
    except Exception as error:
        logger.error(f"Error in get_contributors: {str(error)}")
        if 'Unauthorized' in str(error):
            raise HTTPException(status_code=401, detail="Unauthorized. Please check your GitLab token.")
        elif 'Project not found' in str(error):
            raise HTTPException(status_code=404, detail="Project not found. Please check your repository URL.")
        else:
            raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(error)}")

@app.get("/api/total-merge-requests")
async def get_total_merge_requests_endpoint(repository_url: str = Query(...)):
    """
    Get the total number of merge requests for the repository
    """
    try:
        project_id = get_project_id(repository_url)
        total_mrs = get_total_merge_requests(project_id, repository_url)
        estimated_time = total_mrs * 1.5  # 1.5 seconds per MR
        return {"total_merge_requests": total_mrs, "estimated_time": estimated_time}
    except Exception as error:
        logger.error(f"Error in get_total_merge_requests_endpoint: {str(error)}")
        if 'Unauthorized' in str(error):
            raise HTTPException(status_code=401, detail="Unauthorized. Please check your GitLab token.")
        elif 'Project not found' in str(error):
            raise HTTPException(status_code=404, detail="Project not found. Please check your repository URL.")
        else:
            raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(error)}")

@app.get("/api/open-merge-requests-count")
async def get_open_merge_requests_count_endpoint(repository_url: str = Query(...)):
    """
    Get the count of open merge requests for the repository
    """
    try:
        project_id = get_project_id(repository_url)
        open_mrs_count = get_open_merge_requests_count(project_id, repository_url)
        return {"open_merge_requests_count": open_mrs_count}
    except Exception as error:
        logger.error(f"Error in get_open_merge_requests_count: {str(error)}")
        if 'Unauthorized' in str(error):
            raise HTTPException(status_code=401, detail="Unauthorized. Please check your GitLab token.")
        elif 'Project not found' in str(error):
            raise HTTPException(status_code=404, detail="Project not found. Please check your repository URL.")
        else:
            raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(error)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 9002))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
