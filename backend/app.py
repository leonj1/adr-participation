import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from gitlab_scanner import scan_gitlab_repository

app = FastAPI(
    title="GitLab Merge Request Scanner",
    description="API for scanning GitLab merge requests",
    version="1.0.0",
)

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

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
