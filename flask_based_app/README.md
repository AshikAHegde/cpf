# CPF - Contest Pulse Feed

CPF is a Flask-based web application that helps you track competitive programming contests from various platforms like LeetCode, Codeforces, CodeChef, and AtCoder. It provides a centralized dashboard to view upcoming, live, and past contests, so you never miss an opportunity to compete.

## Features

- **Contest Aggregator:** Fetches and displays contests from multiple platforms in one place.
- **User Authentication:** Secure registration and login system.
- **Personalized Dashboard:** View a list of contests with filters for status (upcoming, live, done) and platform.
- **Profile Page:**
    - View your statistics (rating, problems solved) from different coding platforms.
    - Visualize your contest participation with a doughnut chart.
    - Update your profile information and platform handles.
- **Modern UI:** A clean and responsive user interface built with HTML, CSS, and JavaScript.

## Tech Stack

- **Backend:** Flask (Python)
- **Database:** MySQL
- **Frontend:** HTML, CSS, JavaScript, Chart.js
- **Dependencies:** See `requirements.txt`

## Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

- Python 3.x
- MySQL Server
- A virtual environment tool (like `venv`)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/cpf.git
    cd cpf
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate
    ```

3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up the database:**
    - Make sure your MySQL server is running.
    - Create a new database for the application.
    - Create a `.env` file in the root of the project and add your database credentials:
      ```
      DB_HOST=localhost
      DB_PORT=3306
      DB_USER=your_db_user
      DB_PASS=your_db_password
      DB_NAME=your_db_name
      JWT_SECRET=a_super_secret_key
      ```

### Running the Application

Once you have completed the installation steps, you can run the application using the provided script:

```bash
chmod +x run.sh
./run.sh
```

This will start the Flask development server, and you can access the application at `http://127.0.0.1:5000` in your web browser.

## Project Structure

```
.
├── app.py                  # Main Flask application file
├── requirements.txt        # Python dependencies
├── run.sh                  # Script to run the application
├── services/               # Business logic for fetching data
│   ├── contest_service.py
│   └── platform_service.py
├── static/                 # CSS and other static assets
│   └── css/
│       └── style.css
├── templates/              # HTML templates
│   ├── base.html
│   ├── index.html
│   ├── login.html
│   ├── profile.html
│   └── register.html
└── .env.example            # Example environment file
```
