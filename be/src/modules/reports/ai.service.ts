import { FastifyInstance } from "fastify"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { env } from "../../config/env"
import { getCache, setCache, buildCacheKey } from "../../utils/cache"
import { getSummaryService, getCategoryBreakdownService } from "./reports.service"
import { errors } from "../../utils/errors"

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

export async function getAiInsightsService(server: FastifyInstance, userId: string, period: string) {
  // Check cache first (Cache for 1 hour to save API tokens and speed up load)
  const key = buildCacheKey("user", userId, "ai_insights", period)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  // Lấy dữ liệu tài chính của user
  const [summary, categoryBreakdown] = await Promise.all([
    getSummaryService(server, userId, period) as Promise<any>,
    getCategoryBreakdownService(server, userId, period) as Promise<any[]>
  ])

  // Xây dựng Prompt
  const prompt = `
Bạn là một chuyên gia tư vấn tài chính cá nhân xuất sắc. Dưới đây là dữ liệu thu chi của tôi trong tháng ${period}:

1. Tổng quan:
- Tổng thu nhập: ${summary.totalIncome.toLocaleString('vi-VN')} VND
- Tổng chi tiêu: ${summary.totalExpense.toLocaleString('vi-VN')} VND
- Số dư: ${summary.netBalance.toLocaleString('vi-VN')} VND
- Tổng số lượng giao dịch: ${summary.transactionCount}

2. Phân tích các danh mục:
${categoryBreakdown.map((c) => `- ${c.categoryName} (${c.type === 'expense' ? 'Chi' : 'Thu'}): ${c.totalAmount.toLocaleString('vi-VN')} VND (${c.percentage}%)`).join('\n')}

Yêu cầu:
1. Viết một đoạn Đánh giá ngắn gọn về tình trạng sức khỏe tài chính tháng này của tôi.
2. Chỉ ra các khoản chi tiêu lớn nhất và đánh giá xem chúng có chiếm tỷ trọng quá cao không.
3. Đưa ra 3 lời khuyên hành động cụ thể để tôi tiết kiệm hoặc tối ưu ngân sách tốt hơn trong tháng tới.

Hãy viết bằng tiếng Việt, văn phong thân thiện, động viên và format bằng Markdown thật đẹp mắt (dùng danh sách, in đậm). Đi thẳng vào báo cáo, không cần lời chào hỏi dư thừa.
`

  // Gọi Gemini API (Có thể dùng gemini-2.0-flash hoặc gemini-1.5-flash tùy quota)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
  
  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const report = {
      period,
      generatedAt: new Date().toISOString(),
      insights: text
    }

    // Cache kết quả trong 1 giờ (3600s)
    await setCache(server.redis, key, report, 3600)

    return report
  } catch (error) {
    server.log.error(error)
    throw errors.internal("Hệ thống AI hiện đang quá tải hoặc tạm thời không khả dụng. Vui lòng thử lại sau.")
  }
}
