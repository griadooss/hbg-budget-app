import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // For development, use a test account or configure your email provider
    this.transporter = nodemailer.createTransporter({
      service: 'gmail', // You can change this to your email provider
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
    
    // Log email configuration (without sensitive data)
    console.log('📧 Email service initialized');
    console.log('📧 Email user:', process.env.EMAIL_USER ? 'Configured' : 'Not configured');
    console.log('📧 Admin email:', process.env.ADMIN_EMAIL || 'admin@homesbeforegrowth.org');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@homesbeforegrowth.org',
        to: options.to,
        subject: options.subject,
        html: options.html
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  async sendNewMemberNotification(member: any): Promise<boolean> {
    const subject = 'New Member Signup - Homes Before Growth';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">🎉 New Member Joined!</h2>
        <p><strong>Name:</strong> ${member.firstName} ${member.lastName}</p>
        <p><strong>Email:</strong> ${member.email}</p>
        <p><strong>Postcode:</strong> ${member.postcode}</p>
        <p><strong>Newsletter Opt-in:</strong> ${member.newsletterOptIn ? 'Yes' : 'No'}</p>
        <p><strong>Signup Date:</strong> ${new Date(member.signupDate).toLocaleString()}</p>
        <hr>
        <p style="color: #7f8c8d; font-size: 12px;">
          This is an automated notification from the Homes Before Growth member signup system.
        </p>
      </div>
    `;

    // Send to admin email (you can configure this)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@homesbeforegrowth.org';
    return this.sendEmail({
      to: adminEmail,
      subject,
      html
    });
  }

  async sendWelcomeEmail(member: any): Promise<boolean> {
    const subject = 'Welcome to Homes Before Growth!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to Homes Before Growth!</h2>
        <p>Hi ${member.firstName},</p>
        <p>Thank you for joining our movement to solve Australia's housing crisis!</p>
        <p>We're building a future where every Australian can afford a home through:</p>
        <ul>
          <li>Affordable housing initiatives</li>
          <li>Balanced population planning</li>
          <li>New regional cities</li>
        </ul>
        <p>We'll keep you updated on our progress and how you can get involved.</p>
        <p>Together, we can build a better Australia.</p>
        <br>
        <p>Best regards,</p>
        <p>The Homes Before Growth Team</p>
        <hr>
        <p style="color: #7f8c8d; font-size: 12px;">
          You can unsubscribe from emails at any time by replying with "UNSUBSCRIBE"
        </p>
      </div>
    `;

    return this.sendEmail({
      to: member.email,
      subject,
      html
    });
  }
}

export default new EmailService(); 