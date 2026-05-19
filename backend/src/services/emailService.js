const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOTPEmail(toEmail, otpCode) {
  const html = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 32px;">
      <div style="max-width: 600px; margin: 0 auto; background: #111827; border-radius: 24px; overflow: hidden; border: 1px solid #1f2937;">
        <div style="background: #111827; padding: 24px 28px; border-bottom: 1px solid #273449; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #f8fafc;">🔐 ZeroTrust</h1>
          <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Security verification required</p>
        </div>
        <div style="padding: 32px 28px; background: #0f172a;">
          <p style="margin: 0 0 20px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
            A login attempt was detected from an unusual location or device.
          </p>
          <div style="margin: 24px 0; padding: 24px; border-radius: 20px; background: #111827; text-align: center;">
            <p style="margin: 0 0 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
              Your one-time passcode
            </p>
            <p style="margin: 0; font-size: 42px; letter-spacing: 0.22em; font-weight: 700; color: #ffffff;">${otpCode}</p>
          </div>
          <p style="margin: 0 0 16px; color: #cbd5e1; font-size: 15px; line-height: 1.7;">
            This code expires in 10 minutes.
          </p>
          <p style="margin: 0; color: #fda4af; font-size: 14px; line-height: 1.7;">
            If you didn't request this, your account may be compromised.
          </p>
        </div>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `ZeroTrust <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'ZeroTrust Security Verification',
    html,
  });
}

module.exports = {
  sendOTPEmail,
};
