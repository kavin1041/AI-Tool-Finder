# AI Tool Finder

AI Tool Finder is a web application that helps users discover and explore useful AI tools based on their needs. It provides categorized AI tools, descriptions, ratings, and easy access links to improve productivity and learning.

## Features

- **Tool Discovery**: Browse and search AI tools by category, pricing, and rating.
- **User Reviews**: Submit reviews for tools (moderated by admins).
- **Admin Panel**: Manage tools and moderate reviews.
- **Responsive Frontend**: User-friendly web interface built with HTML, CSS, and JavaScript.
- **RESTful API**: Backend API built with FastAPI for scalability.

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, Pydantic
- **Database**: SQLite (configurable)
- **Authentication**: JWT-based admin authentication
- **Frontend**: HTML, CSS, JavaScript
- **Testing**: Pytest

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-tool-finder.git
   cd ai-tool-finder
   ```

2. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirement.txt
   ```

4. Run the application:
   ```bash
   uvicorn main:app --reload
   ```

5. Open your browser and go to `http://localhost:8000` for the API docs, or access the frontend at the appropriate URL.

## Usage

### API Endpoints

#### User Endpoints
- `GET /tools`: Fetch tools with optional filters (category, pricing, min_rating)
- `POST /review`: Submit a review for a tool

#### Admin Endpoints (Require Authentication)
- `POST /admin/login`: Login as admin (username: admin, password: admin123)
- `POST /admin/tool`: Add a new tool
- `PUT /admin/tool/{tool_id}`: Update a tool
- `DELETE /admin/tool/{tool_id}`: Delete a tool
- `PUT /admin/review/{review_id}/{status}`: Approve or reject a review
- `GET /admin/reviews`: View all reviews

### Frontend
The frontend provides a web interface to interact with the API. Key pages:
- `index.html`: Home page with tool listings
- `tool-detail.html`: Detailed view of a tool
- `admin.html`: Admin panel for managing tools and reviews

## Testing

Run tests with:
```bash
pytest
```

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run tests.
5. Submit a pull request.

## License

This project is licensed under the MIT License.
