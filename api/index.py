from flask import Flask, jsonify, render_template_string
import os

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET", "dev-flask-secret")

# Simple HTML template for testing
HOME_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KCEA Attendance Portal</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; }
        .card { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin: 20px 0; }
        .btn { background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px; }
        .btn:hover { background: #059669; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 KCEA Attendance Portal</h1>
        <div class="card">
            <h2>Kshatriya College of Engineering</h2>
            <p>Modern Attendance Management System</p>
            <p><strong>Status:</strong> ✅ Online and Working!</p>
            <a href="/signup" class="btn">Student Registration</a>
            <a href="/login" class="btn">Student Login</a>
        </div>
        <div class="card">
            <h3>🚀 Features</h3>
            <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                <li>✅ OTP-based Authentication</li>
                <li>✅ Real-time Attendance Tracking</li>
                <li>✅ Student Dashboard</li>
                <li>✅ Photo Upload Support</li>
                <li>✅ Mobile Responsive Design</li>
            </ul>
        </div>
    </div>
</body>
</html>
"""

@app.route("/")
def index():
    return render_template_string(HOME_TEMPLATE)

@app.route("/health")
def health_check():
    return jsonify({
        "status": "healthy", 
        "app": "KCEA Attendance Portal",
        "version": "1.0",
        "message": "Flask app running successfully on Vercel!"
    })

@app.route("/signup")
def signup():
    return render_template_string("""
    <h1>Student Registration</h1>
    <p>Registration form will be implemented here.</p>
    <a href="/">← Back to Home</a>
    """)

@app.route("/login")
def login():
    return render_template_string("""
    <h1>Student Login</h1>
    <p>Login form will be implemented here.</p>
    <a href="/">← Back to Home</a>
    """)

# For Vercel
def handler(request):
    return app(request.environ, request.start_response)

if __name__ == "__main__":
    app.run(debug=True)
