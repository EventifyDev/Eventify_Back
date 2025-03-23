// src/auth/templates/device-verification.template.ts
import { User } from '../../user/schemas/user.schema';

export function getDeviceVerificationTemplate(
  user: User,
  otpCode: string,
  deviceInfo: { browser: string; os: string; ip: string },
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Verify Your Device - Eventify</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f4f8;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td>
            <div style="background: linear-gradient(135deg, #4361EE, #EF1262); padding: 25px 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Eventify Security</h1>
              <p style="margin: 5px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">New Device Verification</p>
            </div>
          </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
          <td style="padding: 40px 30px; color: #333333;">
            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 22px; text-align: center;">Verify Your Device</h2>
            
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #555555;">
              Hello ${user.username || user.email.split('@')[0]},
            </p>
            
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #555555;">
              We noticed a login attempt from a new device. For your security, please use the verification code below:
            </p>
            
            <!-- Verification Code Box -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
              <tr>
                <td align="center" style="background-color: #f5f7ff; padding: 25px; border-radius: 8px; border: 1px solid #e0e6ff;">
                  <p style="margin: 0; font-size: 32px; letter-spacing: 8px; font-weight: 600; color: #4361EE;">${otpCode}</p>
                </td>
              </tr>
            </table>
            
            <!-- Device Info Box -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #f5f7ff; border-radius: 8px; border: 1px solid #e0e6ff;">
              <tr>
                <td style="padding: 20px;">
                  <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 500; color: #333333;">Login attempt details:</p>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding-bottom: 8px; color: #666666; font-size: 14px;">Browser:</td>
                      <td style="padding-bottom: 8px; color: #4361EE; font-size: 14px; text-align: right;">${deviceInfo.browser}</td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 8px; color: #666666; font-size: 14px;">Operating System:</td>
                      <td style="padding-bottom: 8px; color: #4361EE; font-size: 14px; text-align: right;">${deviceInfo.os}</td>
                    </tr>
                    <tr>
                      <td style="color: #666666; font-size: 14px;">IP Address:</td>
                      <td style="color: #4361EE; font-size: 14px; text-align: right;">${deviceInfo.ip}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.6; color: #777777; text-align: center;">
              This code will expire in 10 minutes.
            </p>
            
            <div style="padding: 20px; background-color: rgba(255, 244, 229, 0.5); border-left: 4px solid #ff9800; border-radius: 4px; margin: 25px 0;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #555555;">
                If you didn't attempt to log in, please secure your account by changing your password immediately.
              </p>
            </div>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #f7f9fc; padding: 20px 30px; text-align: center; color: #777777; font-size: 12px; border-top: 1px solid #e6e9ef;">
            <p style="margin: 0 0 10px 0;">
              This is an automated security alert from Eventify.
              If you need assistance, please contact our security team.
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
