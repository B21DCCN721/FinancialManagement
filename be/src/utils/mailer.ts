import nodemailer from "nodemailer"
import { OAuth2Client } from "google-auth-library"

interface SendMailOptions {
  to: string
  subject: string
  html: string
}

let transporter: nodemailer.Transporter | null = null

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
)

async function createTransporter() {
  if (transporter) return transporter

  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM chưa được cấu hình")
  }

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    })
  }

  const accessTokenResponse = await oauth2Client.getAccessToken()
  const token =
    typeof accessTokenResponse === "string"
      ? accessTokenResponse
      : accessTokenResponse?.token

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_FROM,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: token ?? undefined,
    },
  })

  return transporter
}

export async function sendMail(options: SendMailOptions) {
  try {
    const tp = await createTransporter()
    const info = await tp.sendMail({
      from: process.env.EMAIL_FROM ?? '"Financial Management" <noreply@finmanage.test>',
      ...options,
    })

    console.log(`Message sent: ${info.messageId}`)
    return info
  } catch (err) {
    console.error("Error sending email", err)
    throw err
  }
}
