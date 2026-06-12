import { OAuth2Client } from "google-auth-library"

interface SendMailOptions {
  to: string
  subject: string
  html: string
}

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
)

export async function sendMail(options: SendMailOptions) {
  try {
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

    if (!token) {
      throw new Error("Không thể lấy access token từ Google")
    }

    // Tạo nội dung email định dạng MIME chuẩn (RFC 2822)
    const rawMessage = [
      `From: ${process.env.EMAIL_FROM}`,
      `To: ${options.to}`,
      `Subject: =?utf-8?B?${Buffer.from(options.subject).toString("base64")}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      options.html,
    ].join("\r\n")

    // Encode chuỗi email sang base64url theo yêu cầu của Gmail API
    const encodedMessage = Buffer.from(rawMessage).toString("base64url")

    // Gửi email qua Gmail REST API thay vì SMTP (tránh bị block cổng 465/587 trên server)
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Gmail API Error:", errorData)
      throw new Error("Lỗi gửi mail qua Gmail API: " + JSON.stringify(errorData))
    }

    const data = await response.json()
    console.log(`Message sent via API: ${data.id}`)
    return data
  } catch (err) {
    console.error("Error sending email", err)
    throw err
  }
}
