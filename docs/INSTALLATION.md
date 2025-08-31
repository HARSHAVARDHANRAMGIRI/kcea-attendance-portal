# KCEA Portal - Installation Guide

## 🚀 Quick Start

### Option 1: Use Live Portal (Recommended)
**No installation required!**
- Visit: https://web-production-bdf3f.up.railway.app/
- Register and start using immediately
- Works on all devices and browsers

### Option 2: Local Development Setup
Follow this guide to run the portal on your local machine.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Python**: Version 3.7 or higher
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: 500MB free space
- **Internet**: Required for initial setup and dependencies

### Required Software
1. **Python 3.7+**
   - Download from: https://python.org/downloads/
   - Ensure `pip` is included (usually comes with Python)
   - Verify installation: `python --version`

2. **Git** (Optional but recommended)
   - Download from: https://git-scm.com/downloads
   - Verify installation: `git --version`

3. **Text Editor/IDE** (Optional)
   - VS Code, PyCharm, Sublime Text, or any preferred editor

## 🔧 Installation Steps

### Step 1: Download the Project

**Option A: Using Git (Recommended)**
```bash
git clone https://github.com/HARSHAVARDHANRAMGIRI/kcea-attendance-portal.git
cd kcea-attendance-portal
```

**Option B: Download ZIP**
1. Visit: https://github.com/HARSHAVARDHANRAMGIRI/kcea-attendance-portal
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file
4. Navigate to the extracted folder

### Step 2: Create Virtual Environment (Recommended)

**Why Virtual Environment?**
- Isolates project dependencies
- Prevents conflicts with other Python projects
- Easy to manage and clean up

**Create Virtual Environment:**
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

**Verify Activation:**
- Your terminal prompt should show `(.venv)` at the beginning
- This indicates the virtual environment is active

### Step 3: Install Dependencies

**Install Required Packages:**
```bash
pip install -r requirements.txt
```

**What Gets Installed:**
- Flask 2.3.3 - Web framework
- Werkzeug 2.3.7 - WSGI utilities
- Jinja2 3.1.2 - Template engine
- Other supporting libraries

**Verify Installation:**
```bash
pip list
```
You should see Flask and related packages listed.

### Step 4: Initialize Database

**Automatic Setup:**
The database is automatically created when you first run the application.

**What Happens:**
- SQLite database file (`kcea_flask.db`) is created
- Tables are created (students, attendance, news)
- Sample data is inserted (demo accounts and news)

### Step 5: Run the Application

**Start the Server:**
```bash
python app.py
```

**Expected Output:**
```
Starting KCEA Attendance Portal...
Developer: HARSHAVARDHAN RAMGIRI
College: Kshatriya College of Engineering
Server: http://localhost:5000
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://[your-ip]:5000
```

### Step 6: Access the Portal

**Open in Browser:**
- Visit: http://localhost:5000
- The KCEA portal homepage should load
- You can now register or use demo accounts

## 🎮 Testing the Installation

### Demo Accounts
Test with these pre-created accounts:

| Roll Number | Password | Branch | Year |
|-------------|----------|--------|------|
| 20CS001 | password123 | CSE | 3rd |
| 20CS002 | password123 | CSE | 3rd |
| 20EC001 | password123 | ECE | 2nd |

### Test Checklist
- [ ] Homepage loads correctly
- [ ] Registration form works
- [ ] Login with demo account succeeds
- [ ] Dashboard displays student information
- [ ] Attendance marking functions
- [ ] News section shows sample news
- [ ] Mobile view is responsive

## 🔧 Configuration

### Environment Variables (Optional)

Create a `.env` file in the project root:
```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database Configuration
DATABASE_URL=sqlite:///kcea_flask.db

# College Information
COLLEGE_NAME=Kshatriya College of Engineering
COLLEGE_CODE=KCEA
COLLEGE_LOCATION=NH-16, 30km from Nizamabad
```

### Custom Configuration

**Modify College Information:**
Edit `app.py` to customize:
```python
# College details
COLLEGE_NAME = "Your College Name"
COLLEGE_CODE = "YCN"
COLLEGE_LOCATION = "Your Location"
```

**Change Port:**
```python
# At the bottom of app.py
app.run(debug=True, port=8000, host='0.0.0.0')  # Change port to 8000
```

## 🐛 Troubleshooting

### Common Issues

**1. Python Not Found**
```
'python' is not recognized as an internal or external command
```
**Solution:**
- Ensure Python is installed and added to PATH
- Try `python3` instead of `python`
- Reinstall Python with "Add to PATH" option checked

**2. Permission Denied**
```
Permission denied: Cannot create virtual environment
```
**Solution:**
- Run terminal as administrator (Windows)
- Use `sudo` for commands (macOS/Linux)
- Check folder permissions

**3. Module Not Found**
```
ModuleNotFoundError: No module named 'flask'
```
**Solution:**
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again
- Check if you're in the correct directory

**4. Port Already in Use**
```
Address already in use: Port 5000
```
**Solution:**
- Kill process using port 5000
- Change port in `app.py`
- Use different port: `python app.py --port 8000`

**5. Database Issues**
```
Database is locked or corrupted
```
**Solution:**
- Delete `kcea_flask.db` file
- Restart the application (database will be recreated)
- Check file permissions

### Platform-Specific Issues

**Windows:**
- Use `python` instead of `python3`
- Use backslashes in paths: `.venv\Scripts\activate`
- May need to enable script execution: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

**macOS:**
- Use `python3` instead of `python`
- May need to install Xcode command line tools: `xcode-select --install`
- Use forward slashes in paths: `.venv/bin/activate`

**Linux:**
- Use `python3` and `pip3`
- May need to install python3-venv: `sudo apt install python3-venv`
- Check Python version: `python3 --version`

## 🔄 Updating the Portal

### Get Latest Updates
```bash
# If using Git
git pull origin main

# Reinstall dependencies (if requirements changed)
pip install -r requirements.txt --upgrade

# Restart the application
python app.py
```

### Manual Update
1. Download latest ZIP from GitHub
2. Replace old files with new ones
3. Keep your database file (`kcea_flask.db`)
4. Reinstall dependencies if needed

## 🗂️ Project Structure

```
kcea-attendance-portal/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # Project overview
├── .gitignore           # Git ignore rules
├── kcea_flask.db        # SQLite database (created automatically)
├── templates/           # HTML templates
│   ├── home.html        # Homepage
│   ├── dashboard.html   # Student dashboard
│   └── ...             # Other templates
├── static/             # Static files (CSS, JS, images)
│   ├── css/
│   ├── js/
│   └── images/
└── docs/               # Documentation
    ├── README.md       # Main documentation
    ├── USER_GUIDE.md   # User guide
    └── ...            # Other guides
```

## 🚀 Production Deployment

### For Production Use
- Set `FLASK_ENV=production`
- Use a production WSGI server (Gunicorn, uWSGI)
- Use PostgreSQL instead of SQLite
- Set up proper logging
- Configure SSL/HTTPS
- Set up monitoring

### Recommended Production Setup
```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📞 Getting Help

### Support Channels
- **GitHub Issues**: https://github.com/HARSHAVARDHANRAMGIRI/kcea-attendance-portal/issues
- **Documentation**: Check other files in `docs/` folder
- **Community**: Engage with other users on GitHub

### Before Asking for Help
1. Check this installation guide
2. Review error messages carefully
3. Search existing GitHub issues
4. Try the troubleshooting steps above
5. Provide detailed error information when reporting issues

---

**Installation Complete! 🎉**

You now have the KCEA Attendance Portal running locally. Start by testing with demo accounts, then create your own student accounts to explore all features.

*Developed by HARSHAVARDHAN RAMGIRI for educational institutions worldwide*
