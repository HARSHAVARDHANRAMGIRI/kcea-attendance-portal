/**
 * Email Service - Gmail SMTP Integration
 * KCEA Real-time Attendance Portal
 * Developed by Harshavardhan Ramgiri - AUTOFLOW AGENCY
 */

const nodemailer = require('nodemailer');

// ================================
// EMAIL TRANSPORTER CONFIGURATION
// ================================

const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS // App Password, not regular password
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// ================================
// EMAIL TEMPLATES
// ================================

const getOTPEmailTemplate = (fullName, otp, type = 'login') => {
  const collegeName = process.env.COLLEGE_NAME || 'Kshatriya College of Engineering';
  const currentYear = new Date().getFullYear();
  
  const subject = type === 'login' ? 
    `🔐 Your KCEA Portal Login OTP: ${otp}` : 
    `✅ Welcome to KCEA Portal - Verify Your Email: ${otp}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KCEA Portal OTP</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .container {
                background: white;
                border-radius: 16px;
                padding: 40px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                border: 1px solid #e5e7eb;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                background: linear-gradient(135deg, #188CFF, #00BFA6);
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 20px;
                margin-bottom: 20px;
            }
            .title {
                color: #1f2937;
                font-size: 28px;
                font-weight: bold;
                margin: 0;
            }
            .subtitle {
                color: #6b7280;
                font-size: 16px;
                margin: 5px 0 0 0;
            }
            .otp-section {
                background: linear-gradient(135deg, #188CFF, #00BFA6);
                color: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                margin: 30px 0;
            }
            .otp-code {
                font-size: 36px;
                font-weight: bold;
                letter-spacing: 8px;
                margin: 10px 0;
                font-family: 'Courier New', monospace;
            }
            .otp-text {
                font-size: 18px;
                margin: 0;
            }
            .info-section {
                background: #f3f4f6;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .info-title {
                font-weight: bold;
                color: #374151;
                margin-bottom: 10px;
            }
            .info-list {
                margin: 0;
                padding-left: 20px;
            }
            .info-list li {
                margin: 5px 0;
                color: #6b7280;
            }
            .warning {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                color: #92400e;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
            .developer-info {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin-top: 20px;
                text-align: center;
            }
            .developer-name {
                font-weight: bold;
                color: #1f2937;
            }
            .company-name {
                color: #188CFF;
                font-weight: bold;
            }
            .contact-email {
                color: #00BFA6;
                text-decoration: none;
            }
            .contact-email:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">KCEA</div>
                <h1 class="title">🎓 ${collegeName}</h1>
                <p class="subtitle">Smart Attendance Portal</p>
            </div>

            <h2>Hello ${fullName}! 👋</h2>
            
            ${type === 'login' ? 
              '<p>You requested to login to your KCEA Portal account. Use the OTP below to complete your login:</p>' :
              '<p>Welcome to KCEA Portal! Please verify your email address using the OTP below to complete your registration:</p>'
            }

            <div class="otp-section">
                <p class="otp-text">Your OTP Code:</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">⏰ Valid for ${process.env.OTP_EXPIRES_IN || 60} seconds</p>
            </div>

            <div class="info-section">
                <div class="info-title">📋 Important Information:</div>
                <ul class="info-list">
                    <li>This OTP is valid for only <strong>${process.env.OTP_EXPIRES_IN || 60} seconds</strong></li>
                    <li>Do not share this OTP with anyone</li>
                    <li>If you didn't request this, please ignore this email</li>
                    <li>You can request a new OTP after ${process.env.OTP_RESEND_COOLDOWN || 30} seconds</li>
                </ul>
            </div>

            <div class="warning">
                <strong>🔒 Security Notice:</strong> KCEA Portal will never ask for your password or OTP via email, phone, or any other method. Keep your credentials secure!
            </div>

            <div class="developer-info">
                <p><strong>Developed and Managed by</strong></p>
                <p class="developer-name">Harshavardhan Ramgiri</p>
                <p class="company-name">AUTOFLOW AGENCY</p>
                <p style="margin: 10px 0 5px 0;">
                    This Smart Attendance Portal was designed and developed by Harshavardhan Ramgiri 
                    (Founder, AUTOFLOW AGENCY), CSE student at Kshatriya College of Engineering. 
                    Passionate about full-stack development, real-time systems, and building innovative educational solutions.
                </p>
                <p>📧 <a href="mailto:r.harsha0541@gmail.com" class="contact-email">r.harsha0541@gmail.com</a></p>
            </div>

            <div class="footer">
                <p><strong>${collegeName}</strong></p>
                <p>NH-16, 30km from Nizamabad, Telangana</p>
                <p>Affiliated to JNTUH | Established 2001 | ISO 9001:2008</p>
                <p style="margin-top: 20px;">
                    © ${currentYear} AUTOFLOW AGENCY. All rights reserved.
                </p>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
                    This is an automated email from KCEA Real-time Attendance Portal. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  return { subject, html };
};

const getWelcomeEmailTemplate = (fullName, rollNumber) => {
  const collegeName = process.env.COLLEGE_NAME || 'Kshatriya College of Engineering';
  const currentYear = new Date().getFullYear();

  const subject = `🎉 Welcome to KCEA Portal - Registration Successful!`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to KCEA Portal</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .container {
                background: white;
                border-radius: 16px;
                padding: 40px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                border: 1px solid #e5e7eb;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                background: linear-gradient(135deg, #188CFF, #00BFA6);
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 20px;
                margin-bottom: 20px;
            }
            .welcome-section {
                background: linear-gradient(135deg, #10B981, #059669);
                color: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                margin: 30px 0;
            }
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            .feature-card {
                background: #f3f4f6;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
            }
            .feature-icon {
                font-size: 24px;
                margin-bottom: 10px;
            }
            .developer-info {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin-top: 20px;
                text-align: center;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">KCEA</div>
                <h1 style="color: #1f2937; font-size: 28px; margin: 0;">🎓 ${collegeName}</h1>
                <p style="color: #6b7280; margin: 5px 0 0 0;">Smart Attendance Portal</p>
            </div>

            <div class="welcome-section">
                <h2 style="margin: 0 0 10px 0; font-size: 24px;">🎉 Welcome to KCEA Portal!</h2>
                <p style="margin: 0; font-size: 18px;">Registration Successful</p>
            </div>

            <h2>Hello ${fullName}! 👋</h2>
            <p>Congratulations! Your account has been successfully created with roll number <strong>${rollNumber}</strong>.</p>

            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h4>Real-time Attendance</h4>
                    <p>Mark and track your attendance with live updates</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📱</div>
                    <h4>Mobile-First Design</h4>
                    <p>Access from any device, anywhere, anytime</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📈</div>
                    <h4>Analytics Dashboard</h4>
                    <p>View detailed attendance statistics and reports</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔔</div>
                    <h4>Smart Notifications</h4>
                    <p>Get notified about attendance and important updates</p>
                </div>
            </div>

            <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0277bd; margin-top: 0;">🚀 Getting Started:</h3>
                <ol style="color: #01579b;">
                    <li>Login to your account using your email and password</li>
                    <li>Complete your profile setup</li>
                    <li>Start marking your daily attendance</li>
                    <li>Explore the dashboard and analytics</li>
                </ol>
            </div>

            <div class="developer-info">
                <p><strong>Developed and Managed by</strong></p>
                <p style="font-weight: bold; color: #1f2937;">Harshavardhan Ramgiri</p>
                <p style="color: #188CFF; font-weight: bold;">AUTOFLOW AGENCY</p>
                <p style="margin: 10px 0 5px 0;">
                    This Smart Attendance Portal was designed and developed by Harshavardhan Ramgiri 
                    (Founder, AUTOFLOW AGENCY), CSE student at Kshatriya College of Engineering. 
                    Passionate about full-stack development, real-time systems, and building innovative educational solutions.
                </p>
                <p>📧 <a href="mailto:r.harsha0541@gmail.com" style="color: #00BFA6; text-decoration: none;">r.harsha0541@gmail.com</a></p>
            </div>

            <div class="footer">
                <p><strong>${collegeName}</strong></p>
                <p>NH-16, 30km from Nizamabad, Telangana</p>
                <p>Affiliated to JNTUH | Established 2001 | ISO 9001:2008</p>
                <p style="margin-top: 20px;">
                    © ${currentYear} AUTOFLOW AGENCY. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  return { subject, html };
};

// ================================
// EMAIL SENDING FUNCTIONS
// ================================

/**
 * Send OTP email to user
 * @param {string} email - Recipient email
 * @param {string} fullName - Recipient name
 * @param {string} otp - OTP code
 * @param {string} type - Email type (login, register, resend)
 */
const sendOTPEmail = async (email, fullName, otp, type = 'login') => {
  try {
    const transporter = createTransporter();
    const { subject, html } = getOTPEmailTemplate(fullName, otp, type);

    const mailOptions = {
      from: {
        name: 'KCEA Portal - AUTOFLOW AGENCY',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject,
      html,
      priority: 'high',
      headers: {
        'X-Mailer': 'KCEA Portal by AUTOFLOW AGENCY',
        'X-Priority': '1'
      }
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ OTP email sent successfully to ${email}`);
    console.log(`📧 Message ID: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId,
      email,
      type
    };

  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Send welcome email to new user
 * @param {string} email - Recipient email
 * @param {string} fullName - Recipient name
 * @param {string} rollNumber - Student roll number
 */
const sendWelcomeEmail = async (email, fullName, rollNumber) => {
  try {
    const transporter = createTransporter();
    const { subject, html } = getWelcomeEmailTemplate(fullName, rollNumber);

    const mailOptions = {
      from: {
        name: 'KCEA Portal - AUTOFLOW AGENCY',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject,
      html,
      headers: {
        'X-Mailer': 'KCEA Portal by AUTOFLOW AGENCY'
      }
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Welcome email sent successfully to ${email}`);
    console.log(`📧 Message ID: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId,
      email
    };

  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw new Error(`Welcome email sending failed: ${error.message}`);
  }
};

/**
 * Test email configuration
 */
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    console.log('✅ Email configuration is valid');
    return { success: true, message: 'Email configuration verified' };
    
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  testEmailConfiguration
};
