import nodemailer from 'nodemailer';

// 1. Create a transporter using SMTP settings from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 2. Function to send the password reset email
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  // Safely resolve the base URL across environments and sanitize trailing slashes
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || 
    process.env.NEXTAUTH_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ).replace(/\/$/, '');

  // Construct the reset URL using the token
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"AutoShop Manager" <${process.env.SMTP_USER}>`, // Sender address
    to: email, // Receiver address
    subject: 'Password Reset Request - AutoShop Manager', // Subject line
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password for your AutoShop Manager account.</p>
        <p>Click the button below to choose a new password. This link will expire in <strong>1 hour</strong>.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </div>

        <p style="font-size: 14px; color: #666;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">AutoShop Manager Support</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email successfully sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email. Please try again later.');
  }
}
