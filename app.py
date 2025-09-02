from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash, send_from_directory



from werkzeug.utils import secure_filename



import os



import re



import sqlite3



from datetime import datetime, timedelta



import random







APP_NAME = "KCEA-B4 Attendance"



BASE_DIR = os.path.dirname(os.path.abspath(__file__))



DB_PATH = os.path.join(BASE_DIR, "kcea_flask.db")



UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")



os.makedirs(UPLOAD_DIR, exist_ok=True)







app = Flask(__name__)



app.secret_key = os.getenv("FLASK_SECRET", "dev-flask-secret")







BRANCHES = ["CSE", "CSE(DS)", "ECE", "MECH", "CIVIL", "EEE"]



ROLL_REGEX = re.compile(r"^[0-9]{2}[A-Z][0-9]{2}A0[0-9]{3}$", re.IGNORECASE)











def get_db():



    conn = sqlite3.connect(DB_PATH)



    conn.row_factory = sqlite3.Row



    return conn











def init_db():



    conn = get_db()



    cur = conn.cursor()



    cur.execute(



        """



        CREATE TABLE IF NOT EXISTS students (



            id INTEGER PRIMARY KEY AUTOINCREMENT,



            name TEXT NOT NULL,



            roll_no TEXT UNIQUE NOT NULL,



            branch TEXT NOT NULL,



            email TEXT UNIQUE NOT NULL,



            photo_path TEXT,



            created_at TEXT DEFAULT CURRENT_TIMESTAMP



<<<<<<<
        );

=======
# Initialize database on startup

init_db()



if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(host="0.0.0.0", port=port, debug=False)

>>>>>>>


        """



    )



    cur.execute(



        """



        CREATE TABLE IF NOT EXISTS attendance (



            id INTEGER PRIMARY KEY AUTOINCREMENT,



            student_id INTEGER NOT NULL,



            date TEXT NOT NULL,



            time TEXT NOT NULL,



            day TEXT NOT NULL,



            FOREIGN KEY(student_id) REFERENCES students(id)



        );



        """



    )



    cur.execute(



        """



        CREATE TABLE IF NOT EXISTS otps (



            id INTEGER PRIMARY KEY AUTOINCREMENT,



            roll_no TEXT NOT NULL,



            code TEXT NOT NULL,



            purpose TEXT NOT NULL,



            expires_at TEXT NOT NULL



        );



        """



    )



    conn.commit()



    conn.close()











@app.context_processor



def inject_globals():



    return {"APP_NAME": APP_NAME, "BRANCHES": BRANCHES}











@app.route("/")



def index():



    if session.get("student_id"):



        return redirect(url_for("dashboard"))



    return render_template("home.html")







@app.route("/railway-demo")



def railway_demo():



    return render_template("railway-demo.html")











@app.route("/signup", methods=["GET", "POST"])



def signup():



    if request.method == "POST":



        name = request.form.get("name", "").strip()



        roll_no = request.form.get("roll_no", "").strip().upper()



        branch = request.form.get("branch", "").strip()



        email = request.form.get("email", "").strip().lower()



        otp = request.form.get("otp", "").strip()



        photo = request.files.get("photo")







        if not name or not roll_no or not branch or not email:



            flash("All fields are required", "danger")



            return render_template("signup.html")







        if branch not in BRANCHES:



            flash("Invalid branch", "danger")



            return render_template("signup.html")







        if not ROLL_REGEX.match(roll_no):



            flash("Invalid Roll No format (e.g., 22B41A0501)", "danger")



            return render_template("signup.html")







        # Validate OTP



        conn = get_db()



        cur = conn.cursor()



        cur.execute("SELECT * FROM otps WHERE roll_no=? AND purpose='signup' ORDER BY id DESC LIMIT 1", (roll_no,))



        row = cur.fetchone()



        if not row or row[2] != otp or datetime.fromisoformat(row[4]) < datetime.utcnow():



            conn.close()



            flash("Invalid/expired OTP", "danger")



            return render_template("signup.html")







        photo_path = None



        if photo and photo.filename:



            filename = secure_filename(f"{roll_no}_photo_{photo.filename}")



            save_path = os.path.join(UPLOAD_DIR, filename)



            photo.save(save_path)



            photo_path = f"/static/uploads/{filename}"







        try:



            cur.execute(



                "INSERT INTO students(name, roll_no, branch, email, photo_path) VALUES(?,?,?,?,?)",



                (name, roll_no, branch, email, photo_path),



            )



            conn.commit()



        except sqlite3.IntegrityError:



            conn.close()



            flash("Roll No or Email already registered", "danger")



            return render_template("signup.html")







        # Auto-login



        cur.execute("SELECT id FROM students WHERE roll_no=?", (roll_no,))



        sid = cur.fetchone()[0]



        conn.close()



        session["student_id"] = sid



        session["roll_no"] = roll_no



        session["name"] = name



        return redirect(url_for("dashboard"))







    return render_template("signup.html")











@app.route("/request-otp", methods=["POST"])



def request_otp():



    roll_no = request.form.get("roll_no", "").strip().upper()



    purpose = request.form.get("purpose", "signup")



    if not ROLL_REGEX.match(roll_no):



        return jsonify({"ok": False, "message": "Invalid Roll No format"}), 400



    code = f"{random.randint(100000, 999999)}"



    expires = (datetime.utcnow() + timedelta(minutes=5)).isoformat()



    conn = get_db()



    cur = conn.cursor()



    cur.execute("INSERT INTO otps(roll_no, code, purpose, expires_at) VALUES(?,?,?,?)", (roll_no, code, purpose, expires))



    conn.commit()



    conn.close()



    # For demo: return OTP in response; in production send via email/SMS



    return jsonify({"ok": True, "otp": code, "expires_in": 300})











@app.route("/login", methods=["GET", "POST"])



def login():



    if request.method == "POST":



        roll_no = request.form.get("roll_no", "").strip().upper()



        otp = request.form.get("otp", "").strip()



        conn = get_db()



        cur = conn.cursor()



        cur.execute("SELECT * FROM students WHERE roll_no=?", (roll_no,))



        student = cur.fetchone()



        if not student:



            conn.close()



            flash("Student not found. Please sign up.", "danger")



            return render_template("login.html")







        cur.execute("SELECT * FROM otps WHERE roll_no=? AND purpose='login' ORDER BY id DESC LIMIT 1", (roll_no,))



        row = cur.fetchone()



        if not row or row[2] != otp or datetime.fromisoformat(row[4]) < datetime.utcnow():



            conn.close()



            flash("Invalid/expired OTP", "danger")



            return render_template("login.html")







        # Session login



        session["student_id"] = student[0]



        session["roll_no"] = student[2]



        session["name"] = student[1]



        conn.close()



        return redirect(url_for("dashboard"))



    return render_template("login.html")











@app.route("/logout")



def logout():



    session.clear()



    return redirect(url_for("login"))











def mark_attendance_for(student_id: int):



    now = datetime.now()



    date_str = now.strftime("%Y-%m-%d")



    time_str = now.strftime("%H:%M:%S")



    day_str = now.strftime("%A")



    conn = get_db()



    cur = conn.cursor()



    cur.execute(



        "INSERT INTO attendance(student_id, date, time, day) VALUES(?,?,?,?)",



        (student_id, date_str, time_str, day_str),



    )



    conn.commit()



    conn.close()











@app.route("/api/attendance/mark", methods=["POST"])



def api_mark_attendance():



    if not session.get("student_id"):



        return jsonify({"ok": False, "message": "Unauthorized"}), 401



    mark_attendance_for(session["student_id"])



    return jsonify({"ok": True})











@app.route("/dashboard")



def dashboard():



    if not session.get("student_id"):



        return redirect(url_for("login"))



    sid = session["student_id"]



    conn = get_db()



    cur = conn.cursor()



    cur.execute("SELECT name, roll_no, branch, email, photo_path FROM students WHERE id=?", (sid,))



    s = cur.fetchone()



    cur.execute("SELECT date, time, day FROM attendance WHERE student_id=? ORDER BY id DESC", (sid,))



    records = cur.fetchall()



    # Compute simple percentage: present days / total distinct days (assuming login marks present)



    cur.execute("SELECT COUNT(DISTINCT date) FROM attendance WHERE student_id=?", (sid,))



    present_days = cur.fetchone()[0] or 0



    total_days = max(present_days, 1)



    percent = round((present_days / total_days) * 100, 2)



    conn.close()



    return render_template("dashboard.html", student=s, records=records, percent=percent)











@app.route('/static/uploads/<path:filename>')



def uploaded_file(filename):



    return send_from_directory(UPLOAD_DIR, filename)











if __name__ == "__main__":



    init_db()



    port = int(os.environ.get("PORT", 5000))



    app.run(host="0.0.0.0", port=port, debug=False)











