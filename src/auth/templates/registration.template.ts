import { User } from '../../user/schemas/user.schema';

export function getRegistrationTemplate(
  user: User,
  frontendUrl: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Welcome to Eventify</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f4f8;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #4361EE, #EF1262); padding: 25px 0; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Eventify</h1>
          </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
          <td style="padding: 40px 30px; color: #333333;">
            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 22px; text-align: center;">Welcome to Eventify, <span style="color: #EF1262;">${user.username}</span>!</h2>
            
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #555555;">
              Thank you for creating an account with us. We're excited to have you on board!
            </p>
            
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #555555;">
              With your new Eventify account, you can:
            </p>
            
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px;">
              <tr>
                <td width="30" style="vertical-align: top; padding-top: 5px;">
                  <div style="width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg, #4361EE, #EF1262);"></div>
                </td>
                <td style="color: #555555; font-size: 16px; padding-bottom: 10px;">Create and manage your events</td>
              </tr>
              <tr>
                <td width="30" style="vertical-align: top; padding-top: 5px;">
                  <div style="width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg, #4361EE, #EF1262);"></div>
                </td>
                <td style="color: #555555; font-size: 16px; padding-bottom: 10px;">Discover events that match your interests</td>
              </tr>
              <tr>
                <td width="30" style="vertical-align: top; padding-top: 5px;">
                  <div style="width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg, #4361EE, #EF1262);"></div>
                </td>
                <td style="color: #555555; font-size: 16px;">Connect with other attendees</td>
              </tr>
            </table>
            
            <!-- CTA Button -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
              <tr>
                <td align="center">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #4361EE, #EF1262); border-radius: 8px;">
                        <a href="${frontendUrl}/login" style="display: inline-block; padding: 14px 36px; font-family: 'Poppins', Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500;">Get Started</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #f5f5f8; padding: 20px 30px; text-align: center; color: #777777; font-size: 12px; border-top: 1px solid #eaeaea;">
            <p style="margin: 0 0 10px 0;">
              You received this email because you signed up for an Eventify account.<br>
              If this wasn't you, please contact our support team.
            </p>
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
