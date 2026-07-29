import nodemailer from 'nodemailer'

const appName = process.env.APP_NAME || 'FreelanceOS'

export async function sendOTPEmail(email: string, code: string) {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[OTP][dev] Code de connexion pour ${email}: ${code}`)
      return { success: true, fallback: true }
    }

    return {
      success: false,
      error: new Error('Missing SMTP credentials'),
    }
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to: email,
      subject: `${appName} - Votre code de connexion`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Code de connexion</h2>
          <p>Voici votre code de connexion à ${appName} :</p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 20px 0;">${code}</div>
          <p>Ce code expire dans 10 minutes.</p>
        </div>
      `,
    })

    return { success: true }
  } catch (error) {
    return { success: false, error }
  }
}
