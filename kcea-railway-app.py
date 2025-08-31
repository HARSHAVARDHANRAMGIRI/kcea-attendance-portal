#!/usr/bin/env python3
"""
🚂 KCEA Railway Portal - Flask Application
Railway-style attendance management system for Kshatriya College of Engineering
Developer: Harshavardhan Ramgir
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime, date
import json

app = Flask(__name__)
app.secret_key = 'kcea-railway-secret-2024'

# Database setup
def init_db():
    conn = sqlite3.connect('kcea_railway.db')
    c = conn.cursor()
    
    # Students table
    c.execute('''CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roll_no TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        branch TEXT NOT NULL,
        year INTEGER NOT NULL,
        password_hash TEXT NOT NULL,
        total_classes INTEGER DEFAULT 0,
        attended_classes INTEGER DEFAULT 0,
        attendance_percentage REAL DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    )''')
    
    # Attendance table
    c.execute('''CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        roll_no TEXT NOT NULL,
        subject TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        status TEXT DEFAULT 'Present',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id),
        UNIQUE(student_id, subject, date)
    )''')
    
    # News table
    c.execute('''CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT DEFAULT 'Admin',
        priority TEXT DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
    )''')
    
    # Insert sample data
    try:
        # Sample students
        students_data = [
            ('20CS001', 'Arjun Reddy', 'arjun.reddy@kcea.edu', '9876543210', 'CSE', 3, generate_password_hash('password123')),
            ('20CS002', 'Sneha Patel', 'sneha.patel@kcea.edu', '9876543211', 'CSE', 3, generate_password_hash('password123')),
            ('20EC001', 'Vikram Singh', 'vikram.singh@kcea.edu', '9876543212', 'ECE', 2, generate_password_hash('password123')),
            ('20ME001', 'Priya Sharma', 'priya.sharma@kcea.edu', '9876543213', 'MECH', 4, generate_password_hash('password123')),
            ('20CV001', 'Rahul Kumar', 'rahul.kumar@kcea.edu', '9876543214', 'CIVIL', 1, generate_password_hash('password123'))
        ]
        
        c.executemany('''INSERT OR IGNORE INTO students 
                        (roll_no, name, email, phone, branch, year, password_hash) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)''', students_data)
        
        # Sample news
        news_data = [
            ('🎉 First Alumni Meet 2K25', 'Our First Alumni meet 2K25 was a grand success! Over 200 alumni participated and shared their experiences.', 'Admin', 'high'),
            ('📚 New CSD Department Approved', 'TGCHE has officially allotted COMPUTER SCIENCE & DATA SCIENCE (CSD) with 60 seats intake for the academic year 2024-25!', 'Admin', 'high'),
            ('🎊 Festival Celebrations', 'Ugadi Celebrations 2025 and Sankranti Celebration - 2025 held with great enthusiasm by students and faculty.', 'Admin', 'medium'),
            ('🏆 Placement Drive Success', 'Over 150 students got placed in top companies during the recent placement drive. Congratulations to all!', 'Admin', 'high'),
            ('📖 Digital Library Update', 'New e-books and research papers added to our digital library. Access them through the student portal.', 'Admin', 'low')
        ]
        
        c.executemany('''INSERT OR IGNORE INTO news 
                        (title, content, author, priority) 
                        VALUES (?, ?, ?, ?)''', news_data)
        
        conn.commit()
    except Exception as e:
        print(f"Sample data already exists: {e}")
    
    conn.close()

# Initialize database
init_db()

@app.route('/')
def home():
    """🚂 Railway-style homepage"""
    return render_template('railway_home.html')

@app.route('/api/health')
def health():
    """🚂 Railway health check"""
    return jsonify({
        'status': '🚂 Railway Express Running',
        'service': 'KCEA Attendance Portal API',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'developer': 'Harshavardhan Ramgir',
        'college': 'Kshatriya College of Engineering'
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    """🎓 Student registration"""
    data = request.get_json()
    
    required_fields = ['rollNo', 'name', 'email', 'phone', 'branch', 'year', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate branch
    valid_branches = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'CSE(DS)']
    if data['branch'] not in valid_branches:
        return jsonify({'error': 'Invalid branch'}), 400
    
    # Validate year
    if not (1 <= int(data['year']) <= 4):
        return jsonify({'error': 'Year must be between 1 and 4'}), 400
    
    conn = sqlite3.connect('kcea_railway.db')
    c = conn.cursor()
    
    try:
        c.execute('''INSERT INTO students 
                    (roll_no, name, email, phone, branch, year, password_hash) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)''',
                 (data['rollNo'].upper(), data['name'], data['email'], 
                  data['phone'], data['branch'], data['year'], 
                  generate_password_hash(data['password'])))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': '🎓 Registration successful! Welcome to KCEA Railway Portal'
        })
    except sqlite3.IntegrityError as e:
        if 'roll_no' in str(e):
            return jsonify({'error': 'Roll number already exists'}), 400
        elif 'email' in str(e):
            return jsonify({'error': 'Email already exists'}), 400
        else:
            return jsonify({'error': 'Registration failed'}), 400
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    """🚂 Railway-style login"""
    data = request.get_json()
    
    if not data.get('rollNo') or not data.get('password'):
        return jsonify({'error': 'Roll number and password are required'}), 400
    
    conn = sqlite3.connect('kcea_railway.db')
    c = conn.cursor()
    
    c.execute('SELECT * FROM students WHERE roll_no = ?', (data['rollNo'].upper(),))
    student = c.fetchone()
    
    if student and check_password_hash(student[7], data['password']):  # password_hash is at index 7
        # Update last login
        c.execute('UPDATE students SET last_login = ? WHERE id = ?', 
                 (datetime.now().isoformat(), student[0]))
        conn.commit()
        
        session['student_id'] = student[0]
        session['roll_no'] = student[1]
        session['name'] = student[2]
        session['branch'] = student[5]
        
        return jsonify({
            'success': True,
            'message': '🚂 Login successful! Welcome aboard the Railway Express',
            'student': {
                'id': student[0],
                'rollNo': student[1],
                'name': student[2],
                'email': student[3],
                'branch': student[5],
                'year': student[6],
                'attendancePercentage': student[9]
            }
        })
    else:
        return jsonify({'error': 'Invalid roll number or password'}), 401
    
    conn.close()

@app.route('/api/attendance/mark', methods=['POST'])
def mark_attendance():
    """🎯 Mark attendance - Railway style"""
    if 'student_id' not in session:
        return jsonify({'error': 'Please login first'}), 401
    
    data = request.get_json()
    subject = data.get('subject', 'General')
    today = date.today().isoformat()
    current_time = datetime.now().strftime('%H:%M:%S')
    
    conn = sqlite3.connect('kcea_railway.db')
    c = conn.cursor()
    
    try:
        # Check if already marked today
        c.execute('''SELECT id FROM attendance 
                    WHERE student_id = ? AND subject = ? AND date = ?''',
                 (session['student_id'], subject, today))
        
        if c.fetchone():
            return jsonify({'error': 'Attendance already marked for today'}), 400
        
        # Mark attendance
        c.execute('''INSERT INTO attendance 
                    (student_id, roll_no, subject, date, time, status) 
                    VALUES (?, ?, ?, ?, ?, ?)''',
                 (session['student_id'], session['roll_no'], subject, 
                  today, current_time, 'Present'))
        
        # Update student stats
        c.execute('''UPDATE students 
                    SET total_classes = total_classes + 1,
                        attended_classes = attended_classes + 1
                    WHERE id = ?''', (session['student_id'],))
        
        # Calculate percentage
        c.execute('''UPDATE students 
                    SET attendance_percentage = 
                        CASE 
                            WHEN total_classes > 0 
                            THEN (attended_classes * 100.0 / total_classes)
                            ELSE 0 
                        END
                    WHERE id = ?''', (session['student_id'],))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': '✅ Attendance marked successfully!',
            'data': {
                'subject': subject,
                'date': today,
                'time': current_time,
                'status': 'Present'
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/student/dashboard')
def student_dashboard():
    """📊 Student dashboard data"""
    if 'student_id' not in session:
        return jsonify({'error': 'Please login first'}), 401
    
    conn = sqlite3.connect('kcea_railway.db')
    c = conn.cursor()
    
    # Get student info
    c.execute('SELECT * FROM students WHERE id = ?', (session['student_id'],))
    student = c.fetchone()
    
    # Get recent attendance
    c.execute('''SELECT subject, date, time, status FROM attendance 
                WHERE student_id = ? ORDER BY date DESC, time DESC LIMIT 10''',
             (session['student_id'],))
    recent_attendance = c.fetchall()
    
    # Get subject-wise stats
    c.execute('''SELECT subject, COUNT(*) as total, 
                        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
                FROM attendance WHERE student_id = ? GROUP BY subject''',
             (session['student_id'],))
    subject_stats = c.fetchall()
    
    conn.close()
    
    return jsonify({
        'success': True,
        'student': {
            'id': student[0],
            'rollNo': student[1],
            'name': student[2],
            'email': student[3],
            'branch': student[5],
            'year': student[6],
            'totalClasses': student[8],
            'attendedClasses': student[9],
            'attendancePercentage': round(student[10], 2)
        },
        'recentAttendance': [
            {'subject': r[0], 'date': r[1], 'time': r[2], 'status': r[3]}
            for r in recent_attendance
        ],
        'subjectStats': [
            {
                'subject': s[0], 
                'total': s[1], 
                'present': s[2],
                'percentage': round((s[2] / s[1]) * 100, 2) if s[1] > 0 else 0
            }
            for s in subject_stats
        ]
    })

@app.route('/api/news')
def get_news():
    """📢 Get latest news"""
    conn = sqlite3.connect('kcea_railway.db')
    c = conn.cursor()
    
    c.execute('''SELECT title, content, author, priority, created_at 
                FROM news WHERE is_active = 1 
                ORDER BY priority DESC, created_at DESC LIMIT 10''')
    news = c.fetchall()
    conn.close()
    
    return jsonify({
        'success': True,
        'news': [
            {
                'title': n[0],
                'content': n[1],
                'author': n[2],
                'priority': n[3],
                'date': n[4]
            }
            for n in news
        ]
    })

@app.route('/dashboard')
def dashboard():
    """🎓 Student dashboard page"""
    if 'student_id' not in session:
        return redirect(url_for('home'))
    return render_template('railway_dashboard.html')

@app.route('/logout')
def logout():
    """🚪 Logout"""
    session.clear()
    return redirect(url_for('home'))

if __name__ == '__main__':
    print("🚂 Starting KCEA Railway Portal...")
    print("👨‍💻 Developer: Harshavardhan Ramgir")
    print("🎓 College: Kshatriya College of Engineering")
    print("🌐 Server: http://localhost:5002")
    app.run(debug=True, port=5002, host='0.0.0.0')
