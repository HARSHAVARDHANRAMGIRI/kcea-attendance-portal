from flask import Flask, jsonify
import os

# Create Flask app
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET", "kcea-default-secret")

# Simple routes for testing
@app.route("/")
def home():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>KCEA Attendance Portal</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; text-align: center; }
            .card { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; margin: 20px auto; max-width: 600px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>🎓 KCEA Attendance Portal</h1>
            <h2>Kshatriya College of Engineering</h2>
            <p><strong>Status:</strong> ✅ Successfully Deployed on Vercel!</p>
            <p>Modern Attendance Management System</p>
        </div>
    </body>
    </html>
    """

@app.route("/health")
def health():
    return jsonify({
        "status": "healthy",
        "app": "KCEA Attendance Portal",
        "message": "Running on Vercel!"
    })

@app.route("/api/test")
def test():
    return jsonify({"message": "API working!", "status": "success"})

# This is required for Vercel
if __name__ == "__main__":
    app.run(debug=True)
