/**
 * Google Cloud Vision API — Service Account configuration
 *
 * Credentials are loaded from the GOOGLE_VISION_CREDENTIALS environment variable,
 * which should contain the full Service Account JSON as a single-line string.
 *
 * For local development, you can set this in your .env file:
 *   GOOGLE_VISION_CREDENTIALS={"type":"service_account","project_id":...}
 *
 * For production (VPS, Render, Railway, Docker, AWS...), set the env var in your
 * platform's dashboard — no file needed in the repository.
 */
import { env } from "./env"

/**
 * Parse the GOOGLE_VISION_CREDENTIALS env var into a credentials object.
 * Returns undefined if the env var is not set (Vision features will be unavailable).
 */
function loadVisionCredentials(): {
  client_email: string
  private_key: string
  project_id?: string
} | undefined {
  if (!env.GOOGLE_VISION_CREDENTIALS) {
    console.warn(
      "[Vision] GOOGLE_VISION_CREDENTIALS is not set. Receipt scanning will be unavailable."
    )
    return undefined
  }

  try {
    const parsed = JSON.parse(env.GOOGLE_VISION_CREDENTIALS)
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error("Missing required fields: client_email or private_key")
    }

    // Một số platform deploy (Render, Railway, VPS...) khi nhập env var qua UI
    // có thể double-escape ký tự xuống dòng thành \\n (literal backslash + n)
    // thay vì \n (newline thật). Dòng này đảm bảo private_key luôn hợp lệ.
    const privateKey = (parsed.private_key as string).replace(/\\n/g, "\n")

    return {
      client_email: parsed.client_email as string,
      private_key: privateKey,
      project_id: parsed.project_id as string | undefined,
    }
  } catch (err) {
    console.error("[Vision] Failed to parse GOOGLE_VISION_CREDENTIALS:", err)
    return undefined
  }
}

export const GOOGLE_VISION_CREDENTIALS = loadVisionCredentials()
