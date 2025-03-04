import { User } from '../../user/schemas/user.schema';

export function getPasswordResetTemplate(user: User, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Reset Your Eventify Password</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f4f8;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td>
            <div style="background: linear-gradient(135deg, #4361EE, #EF1262); padding: 25px 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Eventify</h1>
              <p style="margin: 5px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Password Reset</p>
            </div>
          </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
          <td style="padding: 40px 30px; color: #333333;">
            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 22px; text-align: center;">Reset Your Password</h2>
            
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #555555;">
              Hello ${user.username || user.email.split('@')[0]},
            </p>
            
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #555555;">
              We received a request to reset the password for your Eventify account. Click the button below to set a new password:
            </p>
            
            <!-- CTA Button -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
              <tr>
                <td align="center">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #4361EE, #EF1262); border-radius: 8px; box-shadow: 0 4px 10px rgba(67, 97, 238, 0.3);">
                        <a href="${resetUrl}" style="display: inline-block; padding: 14px 36px; font-family: 'Poppins', Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500;">Reset Password</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <p style="margin: 30px 0 15px 0; font-size: 16px; line-height: 1.6; color: #555555;">
              If the button doesn't work, copy and paste this URL into your browser:
            </p>
            
            <p style="margin: 0 0 30px 0; background-color: #f5f7ff; padding: 12px; border-radius: 4px; font-size: 14px; word-break: break-all; color: #4361EE; border: 1px solid #e0e6ff;">
              ${resetUrl}
            </p>
            
            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #555555;">
              This password reset link will expire in 2 hours for security reasons.
            </p>
            
            <div style="padding: 20px; background-color: rgba(255, 244, 229, 0.5); border-left: 4px solid #ff9800; border-radius: 4px; margin: 25px 0;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #555555;">
                If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
              </p>
            </div>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #f7f9fc; padding: 20px 30px; text-align: center; color: #777777; font-size: 12px; border-top: 1px solid #e6e9ef;">
            <p style="margin: 0 0 10px 0;">
              For security reasons, this email was sent to the email address associated with your Eventify account.
            </p>
            <p style="margin: 0; color: #999999;">
              &copy; ${new Date().getFullYear()} Eventify Inc. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
