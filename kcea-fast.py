from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from datetime import datetime, date

app = Flask(__name__)
app.secret_key = 'kcea-fast-2024'

def init_db():
    conn = sqlite3.connect('kcea_fast.db')
    c = conn.cursor()
    
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        roll_no TEXT NOT NULL,
        subject TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        status TEXT DEFAULT 'Present',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id)
    )''')
    
    try:
        students_data = [
            ('20CS001', 'Arjun Reddy', 'arjun@kcea.edu', '9876543210', 'CSE', 3, generate_password_hash('password123')),
            ('20CS002', 'Sneha Patel', 'sneha@kcea.edu', '9876543211', 'CSE', 3, generate_password_hash('password123')),
            ('20EC001', 'Vikram Singh', 'vikram@kcea.edu', '9876543212', 'ECE', 2, generate_password_hash('password123'))
        ]
        
        c.executemany('''INSERT OR IGNORE INTO students 
                        (roll_no, name, email, phone, branch, year, password_hash) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)''', students_data)
        conn.commit()
    except:
        pass
    
    conn.close()

init_db()

@app.route('/')
def home():
    return render_template('fast_home.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    required_fields = ['rollNo', 'name', 'email', 'phone', 'branch', 'year', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    valid_branches = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'CSE(DS)']
    if data['branch'] not in valid_branches:
        return jsonify({'error': 'Invalid branch'}), 400
    
    if not (1 <= int(data['year']) <= 4):
        return jsonify({'error': 'Year must be between 1 and 4'}), 400
    
    conn = sqlite3.connect('kcea_fast.db')
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
            'message': 'Registration successful!'
        })
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Roll number or email already exists'}), 400
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data.get('rollNo') or not data.get('password'):
        return jsonify({'error': 'Roll number and password are required'}), 400
    
    conn = sqlite3.connect('kcea_fast.db')
    c = conn.cursor()
    
    c.execute('SELECT * FROM students WHERE roll_no = ?', (data['rollNo'].upper(),))
    student = c.fetchone()
    
    if student and check_password_hash(student[7], data['password']):
        session['student_id'] = student[0]
        session['roll_no'] = student[1]
        session['name'] = student[2]
        session['branch'] = student[5]
        
        return jsonify({
            'success': True,
            'message': 'Login successful!',
            'student': {
                'id': student[0],
                'rollNo': student[1],
                'name': student[2],
                'email': student[3],
                'branch': student[5],
                'year': student[6],
                'attendancePercentage': student[10]
            }
        })
    else:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    conn.close()

@app.route('/api/attendance/mark', methods=['POST'])
def mark_attendance():
    if 'student_id' not in session:
        return jsonify({'error': 'Please login first'}), 401
    
    data = request.get_json()
    subject = data.get('subject', 'General')
    today = date.today().isoformat()
    current_time = datetime.now().strftime('%H:%M:%S')
    
    conn = sqlite3.connect('kcea_fast.db')
    c = conn.cursor()
    
    try:
        c.execute('''SELECT id FROM attendance 
                    WHERE student_id = ? AND subject = ? AND date = ?''',
                 (session['student_id'], subject, today))
        
        if c.fetchone():
            return jsonify({'error': 'Already marked for today'}), 400
        
        c.execute('''INSERT INTO attendance 
                    (student_id, roll_no, subject, date, time, status) 
                    VALUES (?, ?, ?, ?, ?, ?)''',
                 (session['student_id'], session['roll_no'], subject, 
                  today, current_time, 'Present'))
        
        c.execute('''UPDATE students 
                    SET total_classes = total_classes + 1,
                        attended_classes = attended_classes + 1
                    WHERE id = ?''', (session['student_id'],))
        
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
            'message': 'Attendance marked!',
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
    if 'student_id' not in session:
        return jsonify({'error': 'Please login first'}), 401
    
    conn = sqlite3.connect('kcea_fast.db')
    c = conn.cursor()
    
    c.execute('SELECT * FROM students WHERE id = ?', (session['student_id'],))
    student = c.fetchone()
    
    c.execute('''SELECT subject, date, time, status FROM attendance 
                WHERE student_id = ? ORDER BY date DESC, time DESC LIMIT 10''',
             (session['student_id'],))
    recent_attendance = c.fetchall()
    
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

@app.route('/dashboard')
def dashboard():
    if 'student_id' not in session:
        return redirect(url_for('home'))
    return render_template('fast_dashboard.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

if __name__ == '__main__':
    print("KCEA Portal Starting...")
    print("Server: http://localhost:5004")
    app.run(debug=True, port=5004, host='0.0.0.0')
