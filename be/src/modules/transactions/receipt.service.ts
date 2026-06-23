import Tesseract from "tesseract.js"
import { parseAmount, parseDate, parseDescription } from "../../utils/receiptParser"
import { AppError } from "../../utils/errors"

export interface ReceiptScanResult {
  amount: number | null
  description: string | null
  date: string | null
  rawText: string
}

/**
 * Quét hóa đơn bằng Tesseract.js (Offline)
 * @param imageBuffer - Buffer của ảnh hóa đơn
 * @returns Kết quả đã parse: amount, description, date, rawText
 */
export async function scanReceiptService(
  imageBuffer: Buffer
): Promise<ReceiptScanResult> {
  let rawText = ""

  try {
    // Nhận diện chữ bằng Tesseract.js (hỗ trợ tiếng Việt và tiếng Anh)
    // Để tối ưu, chỉ truyền buffer trực tiếp vào recognize
    const { data } = await Tesseract.recognize(
      imageBuffer,
      "vie+eng",
      {
        logger: (m) => console.log(`[Tesseract] ${m.status}: ${Math.round(m.progress * 100)}%`),
      }
    )
    rawText = data.text
  } catch (error: any) {
    const errorMsg = error?.message || "Lỗi không xác định từ Tesseract.js"
    throw new AppError(500, `Lỗi khi nhận diện hóa đơn: ${errorMsg}`)
  }

  if (!rawText || rawText.trim() === "") {
    return { amount: null, description: null, date: null, rawText: "" }
  }

  const amount = parseAmount(rawText)
  const date = parseDate(rawText)
  const description = parseDescription(rawText)

  return { amount, description, date, rawText }
}
