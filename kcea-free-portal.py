#!/usr/bin/env python3
"""
🚂 KCEA Railway Portal - FREE FOR EVERYONE
Open-source attendance management system for Kshatriya College of Engineering
Developer: Harshavardhan Ramgir
License: MIT (Free for all students, colleges, and developers)
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime, date
import json

app = Flask(__name__)
app.secret_key = 'kcea-free-portal-2024'

# Database setup
def init_db():
    conn = sqlite3.connect('kcea_free.db')
    c = conn.cursor()
    
    # Students table - FREE ACCESS
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
        is_free_user BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    )''')
    
    # Attendance table - FREE ACCESS
    c.execute('''CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        roll_no TEXT NOT NULL,
        subject TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        status TEXT DEFAULT 'Present',
        is_free BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id)
    )''')
    
    # News table - FREE ACCESS
    c.execute('''CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT DEFAULT 'KCEA Admin',
        priority TEXT DEFAULT 'medium',
        is_public BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
    )''')
    
    # Free usage stats
    c.execute('''CREATE TABLE IF NOT EXISTS usage_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_students INTEGER DEFAULT 0,
        total_attendance INTEGER DEFAULT 0,
        total_colleges INTEGER DEFAULT 1,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Insert sample data - ALL FREE
    try:
        # Sample students - FREE ACCOUNTS
        students_data = [
            ('20CS001', 'Arjun Reddy', 'arjun.reddy@kcea.edu', '9876543210', 'CSE', 3, generate_password_hash('free123')),
            ('20CS002', 'Sneha Patel', 'sneha.patel@kcea.edu', '9876543211', 'CSE', 3, generate_password_hash('free123')),
            ('20EC001', 'Vikram Singh', 'vikram.singh@kcea.edu', '9876543212', 'ECE', 2, generate_password_hash('free123')),
            ('20ME001', 'Priya Sharma', 'priya.sharma@kcea.edu', '9876543213', 'MECH', 4, generate_password_hash('free123')),
            ('20CV001', 'Rahul Kumar', 'rahul.kumar@kcea.edu', '9876543214', 'CIVIL', 1, generate_password_hash('free123')),
            ('FREE001', 'Demo Student', 'demo@student.com', '9999999999', 'CSE', 2, generate_password_hash('demo123'))
        ]
        
        c.executemany('''INSERT OR IGNORE INTO students 
                        (roll_no, name, email, phone, branch, year, password_hash) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)''', students_data)
        
        # Sample news - ALL PUBLIC
        news_data = [
            ('🎉 FREE Portal Launch!', 'KCEA Railway Portal is now completely FREE for all students and colleges! No registration fees, no hidden costs.', 'Harshavardhan Ramgir', 'high'),
            ('📚 Open Source Project', 'This portal is open-source and available on GitHub. Feel free to contribute and customize for your college!', 'Developer', 'high'),
            ('🎓 For All Students', 'Whether you are from KCEA or any other college, this portal is free to use. Create your account and start tracking attendance!', 'KCEA Admin', 'high'),
            ('🚂 Railway-Style Design', 'Clean, modern interface inspired by Railway/IRCTC apps. Mobile-first design for the best user experience.', 'Design Team', 'medium'),
            ('💻 No Ads, No Fees', 'This portal will always remain free. No advertisements, no premium features, no hidden costs. Education should be accessible to all!', 'KCEA Admin', 'high')
        ]
        
        c.executemany('''INSERT OR IGNORE INTO news 
                        (title, content, author, priority) 
                        VALUES (?, ?, ?, ?)''', news_data)
        
        # Initialize usage stats
        c.execute('''INSERT OR IGNORE INTO usage_stats (id, total_students, total_attendance, total_colleges) 
                    VALUES (1, 0, 0, 1)''')
        
        conn.commit()
    except Exception as e:
        print(f"Sample data already exists: {e}")
    
    conn.close()

# Initialize database
init_db()

@app.route('/')
def home():
    """🚂 FREE Railway-style homepage"""
    # Get usage stats
    conn = sqlite3.connect('kcea_free.db')
    c = conn.cursor()
    c.execute('SELECT COUNT(*) FROM students')
    total_students = c.fetchone()[0]
    c.execute('SELECT COUNT(*) FROM attendance')
    total_attendance = c.fetchone()[0]
    conn.close()
    
    return render_template('free_home.html', 
                         total_students=total_students, 
                         total_attendance=total_attendance)

@app.route('/api/health')
def health():
    """🚂 FREE Railway health check"""
    return jsonify({
        'status': '🚂 FREE Railway Express Running',
        'service': 'KCEA FREE Attendance Portal',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0 - FREE EDITION',
        'developer': 'Harshavardhan Ramgir',
        'college': 'Kshatriya College of Engineering',
        'license': 'MIT - FREE FOR EVERYONE',
        'cost': '₹0 - Completely FREE',
        'github': 'https://github.com/HARSHAVARDHANRAMGIR/kcea-railway-portal'
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    """🎓 FREE Student registration - No cost, no restrictions"""
    data = request.get_json()
    
    required_fields = ['rollNo', 'name', 'email', 'phone', 'branch', 'year', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate branch - Support ALL branches
    valid_branches = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'CSE(DS)', 'IT', 'AERO', 'CHEM', 'BIOTECH', 'OTHER']
    if data['branch'] not in valid_branches:
        return jsonify({'error': 'Invalid branch'}), 400
    
    # Validate year
    if not (1 <= int(data['year']) <= 4):
        return jsonify({'error': 'Year must be between 1 and 4'}), 400
    
    conn = sqlite3.connect('kcea_free.db')
    c = conn.cursor()
    
    try:
        c.execute('''INSERT INTO students 
                    (roll_no, name, email, phone, branch, year, password_hash, is_free_user) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                 (data['rollNo'].upper(), data['name'], data['email'], 
                  data['phone'], data['branch'], data['year'], 
                  generate_password_hash(data['password']), 1))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': '🎉 FREE Registration successful! Welcome to KCEA Railway Portal - No cost, no restrictions!',
            'benefits': [
                '✅ Completely FREE forever',
                '✅ No hidden costs or premium features', 
                '✅ Full access to all features',
                '✅ Mobile-friendly design',
                '✅ Open-source project'
            ]
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
    """🚂 FREE Railway-style login"""
    data = request.get_json()
    
    if not data.get('rollNo') or not data.get('password'):
        return jsonify({'error': 'Roll number and password are required'}), 400
    
    conn = sqlite3.connect('kcea_free.db')
    c = conn.cursor()
    
    c.execute('SELECT * FROM students WHERE roll_no = ?', (data['rollNo'].upper(),))
    student = c.fetchone()
    
    if student and check_password_hash(student[7], data['password']):
        # Update last login
        c.execute('UPDATE students SET last_login = ? WHERE id = ?', 
                 (datetime.now().isoformat(), student[0]))
        conn.commit()
        
        session['student_id'] = student[0]
        session['roll_no'] = student[1]
        session['name'] = student[2]
        session['branch'] = student[5]
        session['is_free_user'] = True
        
        return jsonify({
            'success': True,
            'message': '🚂 FREE Login successful! Welcome aboard the Railway Express - Enjoy all features for FREE!',
            'student': {
                'id': student[0],
                'rollNo': student[1],
                'name': student[2],
                'email': student[3],
                'branch': student[5],
                'year': student[6],
                'attendancePercentage': student[10],
                'isFreeUser': True
            }
        })
    else:
        return jsonify({'error': 'Invalid roll number or password'}), 401
    
    conn.close()

@app.route('/api/attendance/mark', methods=['POST'])
def mark_attendance():
    """🎯 FREE Attendance marking - No limits"""
    if 'student_id' not in session:
        return jsonify({'error': 'Please login first'}), 401
    
    data = request.get_json()
    subject = data.get('subject', 'General')
    today = date.today().isoformat()
    current_time = datetime.now().strftime('%H:%M:%S')
    
    conn = sqlite3.connect('kcea_free.db')
    c = conn.cursor()
    
    try:
        # Mark attendance - NO RESTRICTIONS for free users
        c.execute('''INSERT OR REPLACE INTO attendance 
                    (student_id, roll_no, subject, date, time, status, is_free) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)''',
                 (session['student_id'], session['roll_no'], subject, 
                  today, current_time, 'Present', 1))
        
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
            'message': '✅ FREE Attendance marked successfully! No limits, no restrictions!',
            'data': {
                'subject': subject,
                'date': today,
                'time': current_time,
                'status': 'Present',
                'isFree': True
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/student/dashboard')
def student_dashboard():
    """📊 FREE Student dashboard - Full access"""
    if 'student_id' not in session:
        return jsonify({'error': 'Please login first'}), 401
    
    conn = sqlite3.connect('kcea_free.db')
    c = conn.cursor()
    
    # Get student info
    c.execute('SELECT * FROM students WHERE id = ?', (session['student_id'],))
    student = c.fetchone()
    
    # Get recent attendance - NO LIMITS
    c.execute('''SELECT subject, date, time, status FROM attendance 
                WHERE student_id = ? ORDER BY date DESC, time DESC LIMIT 50''',
             (session['student_id'],))
    recent_attendance = c.fetchall()
    
    # Get subject-wise stats - FULL ACCESS
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
            'attendancePercentage': round(student[10], 2),
            'isFreeUser': True,
            'accessLevel': 'FULL - FREE FOREVER'
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
    """📢 FREE News - All public"""
    conn = sqlite3.connect('kcea_free.db')
    c = conn.cursor()
    
    c.execute('''SELECT title, content, author, priority, created_at 
                FROM news WHERE is_active = 1 AND is_public = 1
                ORDER BY priority DESC, created_at DESC''')
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
                'date': n[4],
                'isFree': True
            }
            for n in news
        ]
    })

@app.route('/dashboard')
def dashboard():
    """🎓 FREE Student dashboard page"""
    if 'student_id' not in session:
        return redirect(url_for('home'))
    return render_template('free_dashboard.html')

@app.route('/about')
def about():
    """ℹ️ About FREE portal"""
    return render_template('about_free.html')

@app.route('/logout')
def logout():
    """🚪 Logout"""
    session.clear()
    flash('🚂 Logged out successfully! Thank you for using our FREE portal!', 'success')
    return redirect(url_for('home'))

if __name__ == '__main__':
    print("🚂 Starting KCEA FREE Railway Portal...")
    print("💰 Cost: ₹0 - COMPLETELY FREE!")
    print("👨‍💻 Developer: Harshavardhan Ramgir")
    print("🎓 College: Kshatriya College of Engineering")
    print("📜 License: MIT - Free for everyone")
    print("🌐 Server: http://localhost:5003")
    print("🎉 Features: ALL FREE - No restrictions!")
    print("📱 Mobile-friendly: YES")
    print("🔓 Open Source: YES")
    app.run(debug=True, port=5003, host='0.0.0.0')
