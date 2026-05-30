import os
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import pymysql
import bcrypt
import json
from datetime import datetime
from dotenv import load_dotenv
from collections import Counter
from services.contest_service import fetch_contests
from services.platform_service import fetch_stats

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('JWT_SECRET', 'super_secret_fallback_key')

@app.context_processor
def inject_globals():
    return {'current_year': datetime.now().year}

# MySQL Connection
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'ashik'),
    'password': os.getenv('DB_PASS', 'ashik'),
    'database': os.getenv('DB_NAME', 'test'),
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db():
    return pymysql.connect(**DB_CONFIG)

def init_db():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                platform_handles JSON,
                channels JSON,
                reminders JSON,
                notification_history JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()
        print("✅ Connected to MySQL and initialized tables!")
        return True
    except Exception as e:
        print(f"⚠️  MySQL connection failed: {e}")
        print("⚠️  App will start but database features won't work.")
        return False

db_available = init_db()

def normalize_platform_handles(raw_handles):
    if isinstance(raw_handles, dict):
        return raw_handles
    if isinstance(raw_handles, list):
        return {
            item.get('platform'): item.get('handle', '')
            for item in raw_handles
            if isinstance(item, dict) and item.get('platform')
        }
    return {}

def handles_for_stats(platform_handles):
    return [
        {'platform': platform, 'handle': handle}
        for platform, handle in platform_handles.items()
        if handle
    ]

def stats_by_platform(stats):
    return {
        item.get('platform'): {
            'color': item.get('color', '#8b5cf6'),
            'username': item.get('handle', ''),
            'rating': item.get('rating') or item.get('maxRating') or 'N/A',
            'problems_solved': item.get('solved', 0),
            'error': item.get('error')
        }
        for item in stats
        if item.get('platform')
    }

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    # We will fetch and pass contests here
    contests = fetch_contests()
    platforms = sorted(set(c['platform'] for c in contests))
    return render_template('index.html', user=session.get('user'), contests=contests, platforms=platforms)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if not db_available:
            flash('Database is currently unavailable. Please try again later.', 'error')
            return render_template('login.html')
        email = request.form.get('email')
        password = request.form.get('password')
        
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
            user = cursor.fetchone()
            conn.close()
            
            if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                session['user_id'] = str(user['id'])
                handles = json.loads(user['platform_handles']) if user['platform_handles'] else []
                session['user'] = {
                    'email': user['email'],
                    'name': user.get('name', ''),
                    'platformHandles': handles
                }
                return redirect(url_for('index'))
            else:
                flash('Invalid email or password', 'error')
        except Exception as e:
            flash(f'Login error: {e}', 'error')
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        if not db_available:
            flash('Database is currently unavailable. Please try again later.', 'error')
            return render_template('register.html')
        email = request.form.get('email')
        password = request.form.get('password')
        name = request.form.get('name')
        
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
            if cursor.fetchone():
                flash('Email already registered', 'error')
                conn.close()
                return redirect(url_for('register'))
                
            hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            default_handles = [
                {'platform': 'LeetCode', 'handle': ''},
                {'platform': 'Codeforces', 'handle': ''},
                {'platform': 'CodeChef', 'handle': ''},
                {'platform': 'AtCoder', 'handle': ''},
                {'platform': 'GFG', 'handle': ''}
            ]
            default_channels = {'email': True}
            default_reminders = {'oneDay': False, 'twoDays': False}
            
            cursor.execute(
                '''INSERT INTO users (email, password, name, platform_handles, channels, reminders, notification_history) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s)''',
                (email, hashed_pw, name, json.dumps(default_handles), json.dumps(default_channels),
                 json.dumps(default_reminders), json.dumps([]))
            )
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()
            
            session['user_id'] = str(user_id)
            session['user'] = {
                'email': email,
                'name': name,
                'platformHandles': default_handles
            }
            
            return redirect(url_for('index'))
        except Exception as e:
            flash(f'Registration error: {e}', 'error')
        
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    if not db_available:
        flash('Database is currently unavailable.', 'error')
        return render_template(
            'profile.html',
            user=session.get('user'),
            platform_handles={},
            platform_stats={},
            chart_data=json.dumps({'labels': [], 'datasets': []})
        )

    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        
        # Platform handles
        handles = {}
        for key, value in request.form.items():
            if key.startswith('handle-') and value:
                platform = key.replace('handle-', '')
                handles[platform] = value
        
        cursor.execute(
            'UPDATE users SET name = %s, email = %s, platform_handles = %s WHERE id = %s',
            (name, email, json.dumps(handles), user_id)
        )
        conn.commit()
        
        # Update session
        session['user']['name'] = name
        session['user']['email'] = email
        session['user']['platformHandles'] = handles
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('profile'))

    cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
    user = cursor.fetchone()
    conn.close()

    raw_platform_handles = json.loads(user.get('platform_handles') or '{}')
    platform_handles = normalize_platform_handles(raw_platform_handles)
    platform_stats = stats_by_platform(fetch_stats(handles_for_stats(platform_handles)))

    # Chart data
    contests = fetch_contests()
    done_contests = [c for c in contests if c.get('status') == 'done']
    platform_counts = Counter(c['platform'] for c in done_contests)
    
    chart_data = {
        'labels': list(platform_counts.keys()),
        'datasets': [{
            'label': 'Contests Attended',
            'data': list(platform_counts.values()),
            'backgroundColor': [
                '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#64748b'
            ],
            'borderColor': '#1e1e2d',
            'borderWidth': 2
        }]
    }

    return render_template(
        'profile.html', 
        user=session.get('user'), 
        platform_handles=platform_handles,
        platform_stats=platform_stats,
        chart_data=json.dumps(chart_data)
    )

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
