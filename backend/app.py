import os
from flask import Flask, jsonify
from flask_cors import CORS
from gitlab_scanner import scan_gitlab_repository

app = Flask(__name__)
CORS(app)

@app.route('/api/merge-requests', methods=['GET'])
def get_merge_requests():
    """
    Get all merge requests
    ---
    responses:
      200:
        description: A list of merge requests
      401:
        description: Unauthorized. Please check your GitLab token.
      404:
        description: Project not found. Please check your PROJECT_ID.
      500:
        description: Internal Server Error
    """
    try:
        merge_requests = scan_gitlab_repository()
        return jsonify(merge_requests)
    except Exception as error:
        if 'Unauthorized' in str(error):
            return jsonify({'error': 'Unauthorized. Please check your GitLab token.'}), 401
        elif 'Project not found' in str(error):
            return jsonify({'error': 'Project not found. Please check your PROJECT_ID.'}), 404
        else:
            return jsonify({'error': 'Internal Server Error', 'message': str(error)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
