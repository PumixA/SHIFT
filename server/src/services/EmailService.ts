import nodemailer from "nodemailer"

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com"
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587")
const SMTP_USER = process.env.SMTP_USER || ""
const SMTP_PASS = process.env.SMTP_PASS || ""
const EMAIL_FROM = process.env.EMAIL_FROM || "SHIFT Game <noreply@shift-game.com>"
const APP_URL = process.env.APP_URL || "http://localhost:3000"

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private initialized = false

  /**
   * Initialize the email transporter
   */
  private async init(): Promise<boolean> {
    if (this.initialized) return !!this.transporter

    this.initialized = true

    if (!SMTP_USER || !SMTP_PASS) {
      console.warn("[EmailService] SMTP credentials not configured. Email sending disabled.")
      console.warn("[EmailService] Set SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM in .env")
      return false
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      })

      // Verify connection
      await this.transporter.verify()
      console.log("[EmailService] SMTP connection verified")
      return true
    } catch (error) {
      console.error("[EmailService] Failed to initialize:", error)
      this.transporter = null
      return false
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, username: string, token: string): Promise<boolean> {
    const isReady = await this.init()

    const resetUrl = `${APP_URL}/reset-password?token=${token}`

    if (!isReady || !this.transporter) {
      // Log the reset URL for development
      console.log("[EmailService] Password reset URL (email not sent):")
      console.log(`  User: ${username} (${email})`)
      console.log(`  URL: ${resetUrl}`)
      return true // Return true so the flow continues
    }

    try {
      await this.transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: "SHIFT - Réinitialisation de votre mot de passe",
        html: this.getPasswordResetTemplate(username, resetUrl),
      })

      console.log(`[EmailService] Password reset email sent to: ${email}`)
      return true
    } catch (error) {
      console.error("[EmailService] Send email error:", error)
      return false
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const isReady = await this.init()

    if (!isReady || !this.transporter) {
      console.log(`[EmailService] Welcome email skipped (not configured) for: ${email}`)
      return true
    }

    try {
      await this.transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: "Bienvenue sur SHIFT !",
        html: this.getWelcomeTemplate(username),
      })

      console.log(`[EmailService] Welcome email sent to: ${email}`)
      return true
    } catch (error) {
      console.error("[EmailService] Send welcome email error:", error)
      return false
    }
  }

  /**
   * Password reset email template
   */
  private getPasswordResetTemplate(username: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation du mot de passe</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid rgba(139, 92, 246, 0.2);">
              <h1 style="margin: 0; font-size: 32px; font-weight: 900; font-style: italic; background: linear-gradient(90deg, #06b6d4, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SHIFT</h1>
              <p style="margin: 8px 0 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Le jeu où les règles changent</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px;">Bonjour ${username},</h2>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #8b5cf6, #a855f7); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                Ce lien expire dans <strong style="color: #f59e0b;">1 heure</strong>.
              </p>
              <p style="margin: 16px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(139, 92, 246, 0.2);">
              <p style="margin: 0; color: #475569; font-size: 12px; text-align: center;">
                Si le bouton ne fonctionne pas, copiez ce lien :<br>
                <a href="${resetUrl}" style="color: #8b5cf6; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }

  /**
   * Welcome email template
   */
  private getWelcomeTemplate(username: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur SHIFT</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid rgba(6, 182, 212, 0.2);">
              <h1 style="margin: 0; font-size: 32px; font-weight: 900; font-style: italic; background: linear-gradient(90deg, #06b6d4, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SHIFT</h1>
              <p style="margin: 8px 0 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Le jeu où les règles changent</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px;">Bienvenue ${username} ! 🎮</h2>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                Votre compte SHIFT a été créé avec succès. Vous êtes prêt à jouer !
              </p>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                SHIFT est un jeu de plateau où les règles évoluent dynamiquement pendant la partie. Créez des règles, déjouez vos adversaires et atteignez la victoire !
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${APP_URL}/play" style="display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #06b6d4, #0891b2); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Commencer à jouer
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(6, 182, 212, 0.2);">
              <p style="margin: 0; color: #475569; font-size: 12px; text-align: center;">
                Bon jeu !<br>L'équipe SHIFT
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }
}

export const emailService = new EmailService()
export default emailService
