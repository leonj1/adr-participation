# GitLab Merge Request Scanner

## Purpose

The GitLab Merge Request Scanner is a web application designed to help teams analyze and visualize merge request activity in their GitLab repositories. It provides insights into contributor activity, merge request statistics, and overall project health.

Key features include:
- Fetching and displaying merge requests
- Visualizing contributor activity through various charts
- Estimating processing time for large repositories
- Providing a user-friendly interface to interact with GitLab data

## How to Run

### Prerequisites

- Docker and Docker Compose installed on your system
- A GitLab personal access token with API access

### Steps

1. Clone the repository:
   ```
   git clone <repository-url>
   cd gitlab-mr-scanner
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory with the following content:
   ```
   GITLAB_TOKEN=your_gitlab_personal_access_token
   REPOSITORY_URL=https://gitlab.com/your-group/your-project
   BACKEND_PORT=9002
   FRONTEND_PORT=9001
   ```

3. Build and run the application:
   ```
   make build-and-run
   ```

4. Access the application:
   Open your web browser and navigate to `http://localhost:9001`

## How to Build

If you need to build the application without running it:

1. Build the Docker images:
   ```
   make build
   ```

2. To run the application after building:
   ```
   make run
   ```

3. To stop the application:
   ```
   make stop
   ```

## Development

- The backend is built with FastAPI and can be found in the `backend` directory.
- The frontend is built with React and can be found in the `frontend` directory.
- The `docker-compose.yml` file defines the services and their configurations.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
