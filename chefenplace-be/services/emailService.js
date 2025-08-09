// Email service for sending verification emails and notifications
// This is a basic implementation that can be enhanced with services like SendGrid, Mailgun, etc.

const crypto = require('crypto');

// For development, we'll use a simple email service
// In production, replace with your preferred email service (SendGrid, Mailgun, AWS SES, etc.)

const emailService = {
  // Send email verification
  async sendVerificationEmail(email, name, token) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
      
        console.log('Email Verification for:', email);
  console.log('Verification URL:', verificationUrl);
      
      // Email service implementation with development fallback
      // For production, uncomment and configure your preferred email service (SendGrid, AWS SES, etc.)
      /*
      const msg = {
        to: email,
        from: process.env.FROM_EMAIL,
        subject: 'Verify your Chef en Place account',
        html: this.getVerificationEmailTemplate(name, verificationUrl),
      };
      await sgMail.send(msg);
      */
      
      // For now, just log the email (development mode)
      if (process.env.NODE_ENV === 'development') {
        console.log(`
        =====================================
        EMAIL VERIFICATION (DEV MODE)
        =====================================
        To: ${email}
        Subject: Verify your Chef en Place account
        
        Hi ${name}!
        
        Welcome to Chef en Place! Please verify your email address by clicking the link below:
        
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create this account, please ignore this email.
        
        Best regards,
        The Chef en Place Team
        =====================================
        `);
      }
      
      return true;
    } catch (error) {
      console.error('Email verification send error:', error);
      throw error;
    }
  },

  // Send trial expiry notification
  async sendTrialExpiryNotification(email, name, restaurantName, daysRemaining) {
    try {
      console.log('Trial Expiry Notification for:', email);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`
        =====================================
        TRIAL EXPIRY NOTIFICATION (DEV MODE)
        =====================================
        To: ${email}
        Subject: Your Chef en Place trial expires in ${daysRemaining} days
        
        Hi ${name}!
        
        Your Chef en Place trial for ${restaurantName} expires in ${daysRemaining} days.
        
        To continue using Chef en Place without interruption, please upgrade your plan:
        ${process.env.FRONTEND_URL}/billing
        
        Questions? Contact our support team.
        
        Best regards,
        The Chef en Place Team
        =====================================
        `);
      }
      
      return true;
    } catch (error) {
      console.error('Trial expiry notification error:', error);
      throw error;
    }
  },

  // Send payment failure notification
  async sendPaymentFailureNotification(email, name, restaurantName, amount) {
    try {
      console.log('Payment Failure Notification for:', email);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`
        =====================================
        PAYMENT FAILURE NOTIFICATION (DEV MODE)
        =====================================
        To: ${email}
        Subject: Payment failed for ${restaurantName}
        
        Hi ${name}!
        
        We were unable to process your payment of $${(amount / 100).toFixed(2)} for ${restaurantName}.
        
        Please update your payment method to avoid service interruption:
        ${process.env.FRONTEND_URL}/billing
        
        If you have questions, please contact our support team.
        
        Best regards,
        The Chef en Place Team
        =====================================
        `);
      }
      
      return true;
    } catch (error) {
      console.error('Payment failure notification error:', error);
      throw error;
    }
  },

  // Send payment receipt
  async sendPaymentReceipt(email, name, restaurantName, amount, invoiceUrl) {
    try {
      console.log('Payment Receipt for:', email);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`
        =====================================
        PAYMENT RECEIPT (DEV MODE)
        =====================================
        To: ${email}
        Subject: Payment received for ${restaurantName}
        
        Hi ${name}!
        
        Thank you for your payment of $${(amount / 100).toFixed(2)} for ${restaurantName}.
        
        Download your invoice: ${invoiceUrl}
        
        Your service will continue uninterrupted.
        
        Best regards,
        The Chef en Place Team
        =====================================
        `);
      }
      
      return true;
    } catch (error) {
      console.error('Payment receipt error:', error);
      throw error;
    }
  },

  // Get verification email template
  getVerificationEmailTemplate(name, verificationUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email - Chef en Place</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0F1A24; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          background: #D4B896; 
          color: #0F1A24; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 4px; 
          font-weight: bold; 
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧑‍🍳 Chef en Place</h1>
          <p>Kitchen Management Made Simple</p>
        </div>
        <div class="content">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for joining Chef en Place. To get started, please verify your email address by clicking the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Chef en Place. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  },
};

module.exports = emailService;