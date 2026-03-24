export const resetPasswordEmail = (platformName, resetUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="width:40px;height:40px;background:#38bdf8;border-radius:10px;display:inline-block;text-align:center;line-height:40px;">
                      <span style="color:#0f172a;font-size:16px;font-weight:800;">
                        ${platformName.slice(0,2).toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;">${platformName}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 24px;">
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 12px;">
                Reset Your Password
              </h1>
              <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px;">
                We received a request to reset the password for your ${platformName} account.
                Click the button below to set a new password.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#38bdf8;border-radius:10px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:14px 32px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 12px;">
                Or copy and paste this link in your browser:
              </p>
              <p style="background:#0f172a;border-radius:8px;padding:10px 14px;font-family:monospace;font-size:12px;color:#38bdf8;word-break:break-all;margin:0 0 24px;">
                ${resetUrl}
              </p>

              <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.15);border-radius:10px;padding:14px 16px;margin-bottom:8px;">
                <p style="color:#fbbf24;font-size:13px;margin:0;">
                  ⚠ This link expires in <strong>1 hour</strong>.
                  If you didn't request a password reset, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 36px 28px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="color:#334155;font-size:12px;margin:0;text-align:center;">
                © ${new Date().getFullYear()} ${platformName}. This email was sent to you because a
                password reset was requested on your account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const welcomeEmail = (platformName, fullName) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td style="background:#0f172a;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="color:#fff;font-size:18px;font-weight:700;">${platformName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px;">
              <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 12px;">
                Welcome, ${fullName}! 🎉
              </h1>
              <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px;">
                Your ${platformName} account has been created successfully.
                You can now log in and start managing your finances.
              </p>
              <p style="color:#64748b;font-size:13px;margin:0;">
                If you have any questions, contact our support team through the chat widget inside the app.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 36px 28px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="color:#334155;font-size:12px;margin:0;text-align:center;">
                © ${new Date().getFullYear()} ${platformName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;