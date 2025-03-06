import { User } from '../../user/schemas/user.schema';

export function getPasswordChangeConfirmationTemplate(user: User): string {
  const currentDate = new Date().toLocaleString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Password Changed - Eventify</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f4f8;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <!-- Header with Title -->
        <tr>
          <td>
            <div style="background: linear-gradient(135deg, #4361EE, #EF1262); padding: 25px 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Eventify Security</h1>
              <p style="margin: 5px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Password Changed</p>
            </div>
          </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
          <td style="padding: 40px 30px; color: #333333;">
            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 22px; text-align: center;">Password Changed Successfully</h2>
            
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #555555;">
              Hello ${user.username || user.email.split('@')[0]},
            </p>
            
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #555555;">
              The password for your Eventify account was changed on <strong>${currentDate}</strong>.
            </p>
            
            <!-- Activity Info -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f7ff; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e6ff;">
              <tr>
                <td style="padding: 20px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="color: #666666; font-size: 14px;">Account:</td>
                      <td style="color: #4361EE; font-size: 14px; font-weight: 500;">${user.email}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <div style="padding: 20px; background-color: rgba(255, 244, 229, 0.5); border-left: 4px solid #ff9800; border-radius: 4px; margin: 25px 0;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #555555;">
                If you didn't make this change, please secure your account immediately by contacting our support team.
              </p>
            </div>
            
            <p style="margin: 30px 0 0 0; font-size: 16px; line-height: 1.6; color: #777777;">
              If this was you, you can safely ignore this email.
            </p>
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
