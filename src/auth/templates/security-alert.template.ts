import { User } from '../../user/schemas/user.schema';

/**
 * Generates an HTML email template for security alerts
 *
 * @param user - The user object
 * @param activity - Description of the security activity
 * @param location - Location where the activity occurred
 * @param deviceInfo - Information about the device used
 * @param ipAddress - The IP address of the activity
 * @returns HTML string for the email
 */
export function getSecurityAlertTemplate(
  user: User,
  activity: string,
  location: string,
  deviceInfo: string = 'Unknown device',
  ipAddress: string = 'Unknown',
): string {
  const currentDate = new Date().toLocaleString();
  const secureAccountUrl = process.env.FRONTEND_URL + '/account/security';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Security Alert - Eventify</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f4f8;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #121219; border-radius: 12px; overflow: hidden; margin-top: 20px;">
        <!-- Header with Logo -->
        <tr>
          <td>
            <div style="background: linear-gradient(135deg, #4361EE, #EF1262); padding: 25px 0; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: rgba(18, 18, 25, 0.7); border-radius: 12px; padding: 12px;">
                    <!-- Logo SVG as Base64 image or replace with hosted image URL -->
                    <svg width="40" height="40" viewBox="0 0 24 24" style="display: block;">
                      <rect x="4" y="4" width="16" height="16" rx="2" fill="rgba(255,255,255,0.1)" stroke="white" stroke-width="1.5"></rect>
                      <line x1="8" y1="2" x2="8" y2="5" stroke="white" stroke-width="2" stroke-linecap="round"></line>
                      <line x1="16" y1="2" x2="16" y2="5" stroke="white" stroke-width="2" stroke-linecap="round"></line>
                      <line x1="9" y1="9" x2="15" y2="9" stroke="white" stroke-width="2" stroke-linecap="round"></line>
                      <line x1="9" y1="12" x2="14" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"></line>
                      <line x1="9" y1="15" x2="13" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"></line>
                      <circle cx="15" cy="15" r="1" fill="#EF1262"></circle>
                    </svg>
                  </td>
                  <td width="15"></td>
                  <td style="text-align: left;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Eventify</h1>
                    <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 14px;">Security Alert</p>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
        
        <!-- Alert Icon -->
        <tr>
          <td align="center" style="padding: 30px 30px 0 30px;">
            <div style="width: 60px; height: 60px; background: rgba(239, 18, 98, 0.15); border-radius: 50%; display: table-cell; vertical-align: middle; text-align: center;">
              <span style="font-size: 36px; color: #EF1262; font-weight: bold;">!</span>
            </div>
          </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
          <td style="padding: 20px 30px 40px 30px; color: #ffffff;">
            <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px; text-align: center;">Security Alert</h2>
            
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.9);">
              Hello ${user.username},
            </p>

            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.9);">
              We detected unusual activity on your Eventify account: <strong>${activity}</strong>
            </p>
            
            <!-- Details Box -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 25px 0; background-color: rgba(255,255,255,0.05); border-radius: 8px;">
              <tr>
                <td style="padding: 20px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding-bottom: 12px; color: rgba(255,255,255,0.7); font-size: 14px;">Date & Time:</td>
                      <td style="padding-bottom: 12px; color: #ffffff; font-size: 14px; text-align: right;">${currentDate}</td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 12px; color: rgba(255,255,255,0.7); font-size: 14px;">Location:</td>
                      <td style="padding-bottom: 12px; color: #ffffff; font-size: 14px; text-align: right;">${location}</td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 12px; color: rgba(255,255,255,0.7); font-size: 14px;">Device:</td>
                      <td style="padding-bottom: 12px; color: #ffffff; font-size: 14px; text-align: right;">${deviceInfo}</td>
                    </tr>
                    <tr>
                      <td style="color: rgba(255,255,255,0.7); font-size: 14px;">IP Address:</td>
                      <td style="color: #ffffff; font-size: 14px; text-align: right;">${ipAddress}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.9);">
              If this was you, no action is needed.
            </p>
            
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.9);">
              If you don't recognize this activity, please secure your account immediately:
            </p>
            
            <!-- CTA Button -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
              <tr>
                <td align="center">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #4361EE, #EF1262); border-radius: 8px;">
                        <a href="${secureAccountUrl}" style="display: inline-block; padding: 14px 36px; font-family: 'Poppins', Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500;">Secure My Account</a>
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
          <td style="background-color: rgba(255,255,255,0.05); padding: 20px 30px; text-align: center; color: rgba(255,255,255,0.6); font-size: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
            <p style="margin: 0 0 10px 0;">
              This is an automated security alert from Eventify.
              If you need assistance, please contact our security team.
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
