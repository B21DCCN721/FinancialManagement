/**
 * =============================================================================
 * Receipt Parser — Trích xuất thông tin từ text OCR hóa đơn
 * =============================================================================
 * Hỗ trợ các loại hóa đơn:
 *   - Nhà hàng, cà phê, quán ăn
 *   - Siêu thị (BigC, Winmart, Co.opmart, MM Mega Market…)
 *   - Cửa hàng tiện lợi (7-Eleven, Circle K, GS25, Ministop…)
 *   - Nhà thuốc (Long Châu, Pharmacity, An Khang…)
 *   - Thương mại điện tử (Shopee, Lazada, Tiki…)
 *   - Grab / taxi
 *   - Hóa đơn ngân hàng / chuyển khoản
 *   - Hóa đơn điện, nước, internet
 *   - Hóa đơn khách sạn, bệnh viện, bãi đỗ xe
 * =============================================================================
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Từ khóa tổng tiền — dùng để ưu tiên tìm dòng chứa số tiền cần trả */
const TOTAL_KEYWORDS = [
  // Tiếng Việt
  /t[oổ]ng\s*c[oộ]ng/i,
  /t[oổ]ng\s*ti[eề]n\s*(thanh\s*to[aá]n|c[aầ]n\s*tr[aả]|ph[aả]i\s*tr[aả])?/i,
  /ti[eề]n\s*thanh\s*to[aá]n/i,
  /thanh\s*to[aá]n/i,
  /s[oố]\s*ti[eề]n/i,
  /th[aà]nh\s*ti[eề]n/i,
  /t[oổ]ng\s*ph[aả]i\s*tr[aả]/i,
  /kh[aá]ch\s*tr[aả]/i,
  /gi[aá]\s*tr[iị]\s*thanh\s*to[aá]n/i,
  /t[oổ]ng\s*gi[aá]\s*tr[iị]/i,
  // Tiếng Anh
  /grand\s*total/i,
  /total\s*(amount|due|payable|payment)?/i,
  /amount\s*(due|payable|total)?/i,
  /net\s*(amount|total)/i,
  /balance\s*(due|payable)?/i,
  /subtotal/i,
  /sum\s*total/i,
  /invoice\s*total/i,
]

/** Từ khóa phụ (ít tin cậy hơn nhưng vẫn dùng làm fallback) */
const SECONDARY_AMOUNT_KEYWORDS = [
  /gi[aá]\s*(ti[eề]n|b[aá]n)/i,
  /\bprice\b/i,
  /\bcharge[sd]?\b/i,
  /\bfee\b/i,
]

/** Đơn vị tiền tệ */
const CURRENCY_SUFFIX = /(?:\s*(?:đ|₫|vnd|vnđ|dong|đồng|viet\s*nam\s*dong|d\b))/i

/** Pattern SĐT Việt Nam và quốc tế */
const PHONE_PATTERNS = [
  /(?:\+84|0084|0)\s*[35789]\d[\s.\-]?\d{3}[\s.\-]?\d{3,4}/,
  /\+\d{1,3}[\s.\-]?\(?\d{2,4}\)?[\s.\-]?\d{3,4}[\s.\-]?\d{3,4}/,
  /\b0[35789]\d{8}\b/,
]

/** Header bảng hàng hóa — cần bỏ qua khi tìm description */
const TABLE_HEADER_PATTERNS = [
  /^(ảnh|hình|image)$/i,
  /^(m[uụ]c|item|s[aả]n\s*ph[aẩ]m|product|h[aà]ng\s*h[oó]a)$/i,
  /^(s[oố]\s*l[uư][oợ]ng|quantity|sl|qty)$/i,
  /^(đ[oơ]n\s*gi[aá]|unit\s*price|price|gi[aá])$/i,
  /^(th[aà]nh\s*ti[eề]n|amount|total)$/i,
  /^(ghi\s*ch[uú]|note|remarks?)$/i,
  /^(stt|no\.|#)$/i,
  /^(m[aã]\s*(h[aà]ng|sp)|sku|code)$/i,
]

/** Từ khóa nên bỏ qua khi tìm description */
const SKIP_DESCRIPTION_PATTERNS = [
  /^(tel|phone|fax|email|hotline|website|www\.|http)/i,
  /^(hóa\s*đơn|invoice|receipt|bill|phiếu\s*(thu|chi|mua\s*hàng)|order|đơn\s*hàng|phiếu\s*tính\s*tiền)/i,
  /^(địa\s*chỉ|address|đ\/c|dc:)/i,
  /^(tên\s*(tài\s*khoản|tk|nh|cửa\s*hàng|ch|đơn\s*vị)|account\s*name)/i,
  /^(ngân\s*hàng|bank|chi\s*nhánh|branch)/i,
  /^(mã\s*(số|đơn|giao\s*dịch|hd)|code|ref|id:)/i,
  /^(tổng|total|subtotal|tax|thuế|vat|ck|chiết\s*khấu|discount|phí|fee)/i,
  /^(thông\s*tin|information|note|ghi\s*chú|nội\s*dung)/i,
  /^(ngày|date|time|giờ|printed|issued)/i,
  /^(cảm\s*ơn|thank|xin\s*ch[aà]o|goodbye|goodbye|farewell)/i,
  /^(số\s*tài\s*khoản|stk|account\s*number)/i,
  /^\+?[\d\s().+\-]{7,}$/, // Dòng chỉ toàn số/SĐT
  /^[\d\s.,:;\/\-_*#@!%^&()[\]{}|\\]+$/, // Dòng chỉ ký tự đặc biệt/số
  /^[A-Z0-9]{10,}$/, // Mã barcode / mã giao dịch
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPhoneNumber(s: string): boolean {
  const cleaned = s.replace(/[\s\-().]/g, "")
  return PHONE_PATTERNS.some((p) => p.test(cleaned)) || PHONE_PATTERNS.some((p) => p.test(s))
}

function isTaxOrBankCode(s: string): boolean {
  const cleaned = s.replace(/[\s\-]/g, "")
  // Mã số thuế 10 chữ số thuần
  if (/^\d{10}$/.test(cleaned)) return true
  // Số tài khoản ngân hàng: 8-20 chữ số thuần
  if (/^\d{12,20}$/.test(cleaned)) return true
  // Năm đơn thuần (2000-2099)
  if (/^20[0-9]{2}$/.test(cleaned)) return true
  return false
}

function isTableHeader(line: string): boolean {
  return TABLE_HEADER_PATTERNS.some((p) => p.test(line))
}

function shouldSkipDescription(line: string): boolean {
  return SKIP_DESCRIPTION_PATTERNS.some((p) => p.test(line))
}

/**
 * Chuẩn hoá chuỗi số thành float.
 * Phân biệt "800.000" (nghìn) vs "800.5" (thập phân).
 */
function normalizeToNumber(raw: string): number {
  let s = raw.trim().replace(/\s/g, "")

  // "1.500.000" hoặc "1,500,000" — nhiều dấu phân cách liên tiếp
  if (/^\d{1,3}([.,]\d{3}){1,5}$/.test(s)) {
    s = s.replace(/[.,]/g, "")
  } else if (/^\d+[.,]\d{1,2}$/.test(s)) {
    // "800.50" hoặc "800,50" — thập phân (giá trị nhỏ)
    s = s.replace(",", ".")
  } else {
    s = s.replace(/[.,]/g, "")
  }

  return parseFloat(s)
}

/**
 * Trích xuất tất cả số tiền tiềm năng từ một chuỗi văn bản.
 * Trả về mảng số nguyên (VND).
 */
function extractMoneyFromText(text: string): number[] {
  const results: number[] = []

  const patterns: RegExp[] = [
    // Có đơn vị rõ ràng: 800.000đ / 800,000 VND / 1.500.000 đồng
    new RegExp(
      `(\\d{1,3}(?:[.,]\\d{3})+|\\d{4,})${CURRENCY_SUFFIX.source}`,
      "gi"
    ),
    // Dạng "k": 150k / 200K / 1.5k
    /\b(\d+(?:[.,]\d+)?)\s*[kK]\b/g,
    // Dạng "M" (triệu): 1.5M / 2M
    /\b(\d+(?:[.,]\d+)?)\s*[mM]\b(?!\w)/g,
    // Số có dấu phân cách nghìn không kèm đơn vị: 1.500.000 / 1,500,000
    /\b(\d{1,3}(?:\.\d{3}){2,}|\d{1,3}(?:,\d{3}){2,})\b/g,
    // Hai nhóm 3 chữ số: 800.000 hoặc 800,000
    /\b(\d{1,3}[.,]\d{3})\b/g,
    // Khoảng trắng là dấu phân cách nghìn: "800 000"
    /\b(\d{1,3}(?:\s\d{3})+)\b/g,
  ]

  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    const regex = new RegExp(pattern.source, pattern.flags)
    while ((match = regex.exec(text)) !== null) {
      const raw = match[1] ?? match[0]
      const context = text.slice(Math.max(0, match.index - 20), match.index + raw.length + 10)

      // Bỏ qua nếu là SĐT hoặc mã số
      if (isPhoneNumber(context)) continue
      if (isTaxOrBankCode(raw.replace(/[.,\s]/g, ""))) continue

      let n: number
      const fullMatch = match[0].toLowerCase()
      if (fullMatch.includes("m") && !fullMatch.includes("vn") && !fullMatch.includes("don")) {
        // Đơn vị M = triệu
        n = parseFloat(raw.replace(",", ".")) * 1_000_000
      } else if (fullMatch.endsWith("k")) {
        // Đơn vị k = nghìn
        n = parseFloat(raw.replace(",", ".")) * 1_000
      } else {
        n = normalizeToNumber(raw)
      }

      // Giới hạn hợp lý: 1.000đ → 500.000.000đ
      if (!isNaN(n) && n >= 1_000 && n <= 500_000_000) {
        results.push(Math.round(n))
      }
    }
  }

  return results
}

// ─── parseAmount ──────────────────────────────────────────────────────────────

/**
 * Trích xuất số tiền từ text OCR.
 *
 * Chiến lược (theo độ ưu tiên):
 *   1. Dòng chứa từ khóa "tổng tiền / total / grand total / balance due"
 *      → lấy số tiền trên dòng đó (độ tin cậy cao nhất)
 *   2. Dòng chứa từ khóa phụ (price, charge, fee)
 *   3. Lấy số tiền lớn nhất tìm thấy trong toàn bộ text
 *      (thường là tổng cộng vì nó lớn hơn các dòng đơn lẻ)
 */
export function parseAmount(text: string): number | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)

  // ── Bước 1: Tìm dòng tổng tiền chính ────────────────────────────────────
  for (const line of lines) {
    const isTotalLine = TOTAL_KEYWORDS.some((kw) => kw.test(line))
    if (!isTotalLine) continue

    const amounts = extractMoneyFromText(line)
    if (amounts.length > 0) {
      return Math.max(...amounts)
    }
  }

  // ── Bước 2: Thử ghép 2 dòng liên tiếp (tổng tiền và số nằm dòng dưới) ──
  for (let i = 0; i < lines.length - 1; i++) {
    const isTotalLine = TOTAL_KEYWORDS.some((kw) => kw.test(lines[i]))
    if (!isTotalLine) continue

    // Thử lấy số từ dòng kế tiếp
    const amounts = extractMoneyFromText(lines[i + 1])
    if (amounts.length > 0) {
      return Math.max(...amounts)
    }
  }

  // ── Bước 3: Từ khóa phụ ──────────────────────────────────────────────────
  for (const line of lines) {
    const isSecondary = SECONDARY_AMOUNT_KEYWORDS.some((kw) => kw.test(line))
    if (!isSecondary) continue

    const amounts = extractMoneyFromText(line)
    if (amounts.length > 0) return Math.max(...amounts)
  }

  // ── Bước 4: Fallback — lấy giá trị lớn nhất toàn bộ text ────────────────
  const allAmounts = extractMoneyFromText(text)
  if (allAmounts.length === 0) return null
  return Math.max(...allAmounts)
}

// ─── parseDate ────────────────────────────────────────────────────────────────

/**
 * Trích xuất ngày từ text OCR.
 * Hỗ trợ:
 *   - DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
 *   - YYYY-MM-DD (ISO 8601)
 *   - DD/MM/YY (năm 2 chữ số)
 *   - Timestamp: 2026-06-23 14:30:45 / 23/06/2026 14:30
 *   - "Ngày 23 tháng 06 năm 2026"
 *   - "23 tháng 6, 2026" / "23/6/2026"
 *   - "23 Jun 2026" / "June 23, 2026" (tiếng Anh)
 *   - Ưu tiên dòng có từ khoá ngày/date
 */
export function parseDate(text: string): string | null {
  const MONTH_NAMES: Record<string, number> = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
    apr: 4, april: 4, may: 5, jun: 6, june: 6,
    jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
    oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
  }

  const tryBuildDate = (d: number, m: number, y: number): string | null => {
    // Năm 2 chữ số → giả định 2000+
    if (y < 100) y += 2000
    if (y < 2000 || y > 2100) return null
    if (m < 1 || m > 12) return null
    if (d < 1 || d > 31) return null
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  }

  const datePatterns: { regex: RegExp; parse: (m: RegExpExecArray) => string | null }[] = [
    // ISO timestamp: 2026-06-23T14:30:00 hoặc 2026-06-23 14:30
    {
      regex: /\b(\d{4})[-\/](\d{2})[-\/](\d{2})(?:[T\s]\d{2}:\d{2})?/g,
      parse: (m) => tryBuildDate(parseInt(m[3]), parseInt(m[2]), parseInt(m[1])),
    },
    // DD/MM/YYYY hoặc DD-MM-YYYY hoặc DD.MM.YYYY (cả năm 2 và 4 chữ số)
    {
      regex: /\b(0?[1-9]|[12]\d|3[01])[\/\-\.](0?[1-9]|1[0-2])[\/\-\.]((?:20)?\d{2})\b/g,
      parse: (m) => tryBuildDate(parseInt(m[1]), parseInt(m[2]), parseInt(m[3])),
    },
    // "Ngày 23 tháng 06 năm 2026"
    {
      regex: /ng[àa]y\s+(0?[1-9]|[12]\d|3[01])\s+th[áa]ng\s+(0?[1-9]|1[0-2])\s+n[aă]m\s+(\d{4})/gi,
      parse: (m) => tryBuildDate(parseInt(m[1]), parseInt(m[2]), parseInt(m[3])),
    },
    // "23 tháng 6 2026" hoặc "23/6/2026"
    {
      regex: /(0?[1-9]|[12]\d|3[01])\s+th[áa]ng\s+(0?[1-9]|1[0-2])[,\s]+(\d{4})/gi,
      parse: (m) => tryBuildDate(parseInt(m[1]), parseInt(m[2]), parseInt(m[3])),
    },
    // "23 Jun 2026" hoặc "June 23, 2026"
    {
      regex: /\b(0?[1-9]|[12]\d|3[01])\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[,\s]+(\d{4})\b/gi,
      parse: (m) => {
        const mo = MONTH_NAMES[m[2].toLowerCase().slice(0, 3)]
        return mo ? tryBuildDate(parseInt(m[1]), mo, parseInt(m[3])) : null
      },
    },
    {
      regex: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(0?[1-9]|[12]\d|3[01])[,\s]+(\d{4})\b/gi,
      parse: (m) => {
        const mo = MONTH_NAMES[m[1].toLowerCase().slice(0, 3)]
        return mo ? tryBuildDate(parseInt(m[2]), mo, parseInt(m[3])) : null
      },
    },
  ]

  // Ưu tiên dòng có từ khoá ngày tháng
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const datePriorityKeywords = /\b(ng[àa]y|date|issued|printed|created|time|th[aờ]i\s*gian|ngày\s*lập|ngày\s*xuất)\b/i

  const priorityLines: string[] = []
  const normalLines: string[] = []
  for (const line of lines) {
    if (datePriorityKeywords.test(line)) priorityLines.push(line)
    else normalLines.push(line)
  }

  const searchOrder = [...priorityLines, ...normalLines]

  for (const { regex, parse } of datePatterns) {
    for (const line of searchOrder) {
      const r = new RegExp(regex.source, regex.flags)
      let match: RegExpExecArray | null
      while ((match = r.exec(line)) !== null) {
        const result = parse(match)
        if (result) return result
      }
    }
  }

  return null
}

// ─── parseDescription ─────────────────────────────────────────────────────────

/**
 * Trích xuất tên cửa hàng / mô tả từ text OCR.
 *
 * Chiến lược (theo độ ưu tiên):
 *   1. Dòng sau từ khoá "Cửa hàng:", "Tên đơn vị:", "Merchant:", "Store:"
 *   2. Dòng viết HOA hoàn toàn ở đầu hóa đơn (tên shop thường in hoa)
 *   3. Dòng đầu tiên có chữ cái, đủ dài, không phải từ khoá hệ thống
 */
export function parseDescription(text: string): string | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1 && l.length < 120)

  // ── Bước 1: Tìm dòng label "Tên cửa hàng / Merchant" ───────────────────
  const nameLabels = [
    /(?:tên\s*(?:cửa\s*hàng|ch|đơn\s*vị|công\s*ty)|merchant|store\s*name|shop\s*name|seller)[:\s]+(.+)/i,
    /(?:đơn\s*vị\s*bán|sold\s*by|from)[:\s]+(.+)/i,
  ]

  for (const line of lines) {
    for (const label of nameLabels) {
      const match = line.match(label)
      if (match && match[1].trim().length > 1) return match[1].trim()
    }
  }

  // ── Bước 2: Dòng HOA hoàn toàn ở đầu (tên shop) ────────────────────────
  // Cho phép có dấu tiếng Việt hoa
  const upperCaseViet = /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐƠƯÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝ0-9\s&'".,-]+$/u

  const first30Lines = lines.slice(0, 30)
  for (const line of first30Lines) {
    if (shouldSkipDescription(line)) continue
    if (isPhoneNumber(line)) continue
    if (isTableHeader(line)) continue
    if (upperCaseViet.test(line) && line.replace(/\s/g, "").length > 3) {
      // Bỏ qua nếu chỉ là "HOA ĐƠN" hoặc "INVOICE" v.v.
      if (/^(HÓA\s*ĐƠN|INVOICE|RECEIPT|BILL|ORDER|PHIẾU|ĐƠNHÀNG)$/i.test(line.replace(/\s/g, ""))) continue
      return line
    }
  }

  // ── Bước 3: Dòng đầu tiên hợp lệ có chữ cái ────────────────────────────
  for (const line of first30Lines) {
    if (shouldSkipDescription(line)) continue
    if (isPhoneNumber(line)) continue
    if (isTableHeader(line)) continue
    if (/[a-zA-ZÀ-ỹ]/.test(line) && line.replace(/\s/g, "").length > 3) {
      return line
    }
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return lines[0] || null
}
