const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendResetEmail(toEmail, resetLink) {
  await transporter.sendMail({
    from: `"Yoklek App" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset your password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #1a1a1a; color: #fff; border-radius: 12px;">
        <h2 style="color: #fff; margin-bottom: 8px;">Reset Password</h2>
        <p style="color: #aaa; margin-bottom: 24px;">คลิกปุ่มด้านล่างเพื่อรีเซ็ตรหัสผ่านของคุณ ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 32px; background: #c0392b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้</p>
      </div>
    `,
  });
}

async function sendOtpEmail(toEmail, code) {
  await transporter.sendMail({
    from: `"Yoklek App" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `รหัสยืนยันเข้าสู่ระบบ: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #1a1a1a; color: #fff; border-radius: 12px; text-align: center;">
        <h2 style="color: #fff; margin-bottom: 8px;">รหัสยืนยันเข้าสู่ระบบ</h2>
        <p style="color: #aaa; margin-bottom: 8px;">ใช้รหัสนี้เพื่อเข้าสู่ระบบ YOKLEK — รหัสจะหมดอายุใน 10 นาที</p>
        <div style="font-size: 38px; font-weight: bold; letter-spacing: 10px; background: #c0392b; padding: 16px; border-radius: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">หากคุณไม่ได้พยายามเข้าสู่ระบบ กรุณาเปลี่ยนรหัสผ่านทันที</p>
      </div>
    `,
  });
}

module.exports = { sendResetEmail, sendOtpEmail };
