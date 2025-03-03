import { User } from '../../user/schemas/user.schema';

export function getOtpVerificationTemplate(
  user: User,
  otpCode: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Verify Your Email - Eventify</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f4f8; color: #333333;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #4361EE, #EF1262); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600;">Eventify</h1>
          </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
          <td style="padding: 35px 30px; color: #333333;">
            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 22px; text-align: center; font-weight: 600;">Email Verification Code</h2>
            
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #555555;">
              Hello ${user.username},
            </p>
            
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #555555;">
              Please use the code below to verify your email address and complete your registration:
            </p>
            
            <!-- Verification Code Box -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
              <tr>
                <td align="center" style="background-color: #f7f7f9; padding: 25px; border-radius: 8px; border: 1px solid #e8e8e8;">
                  <p style="margin: 0; font-size: 32px; letter-spacing: 8px; font-weight: 600; color: #333333;">${otpCode}</p>
                </td>
              </tr>
            </table>
            
            <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.6; color: #777777; text-align: center;">
              This code will expire in 15 minutes.
            </p>
            
            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #777777;">
              If you didn't create an Eventify account, please ignore this email.
            </p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #f7f7f9; padding: 20px 30px; text-align: center; color: #777777; font-size: 12px; border-top: 1px solid #e8e8e8;">
            <p style="margin: 0;">
              &copy; ${new Date().getFullYear()} Eventify Inc. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
