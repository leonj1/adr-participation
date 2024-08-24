import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from gitlab_scanner import scan_gitlab_repository, REPOSITORY_URL, GITLAB_TOKEN, get_project_id, get_merge_requests_with_participants

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

@app.get("/api/merge-requests")
async def get_merge_requests():
    """
    Get all merge requests
    """
    try:
        merge_requests = scan_gitlab_repository()
        return merge_requests
    except Exception as error:
        if 'Unauthorized' in str(error):
            raise HTTPException(status_code=401, detail="Unauthorized. Please check your GitLab token.")
        elif 'Project not found' in str(error):
            raise HTTPException(status_code=404, detail="Project not found. Please check your REPOSITORY_URL.")
        else:
            raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(error)}")

@app.get("/api/merge-requests-with-participants")
async def get_merge_requests_participants():
    """
    Get all merge requests with their participants
    """
    try:
        project_id = get_project_id()
        merge_requests = get_merge_requests_with_participants(project_id)
        return merge_requests
    except Exception as error:
        if 'Unauthorized' in str(error):
            raise HTTPException(status_code=401, detail="Unauthorized. Please check your GitLab token.")
        elif 'Project not found' in str(error):
            raise HTTPException(status_code=404, detail="Project not found. Please check your REPOSITORY_URL.")
        else:
            raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(error)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 9002))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
