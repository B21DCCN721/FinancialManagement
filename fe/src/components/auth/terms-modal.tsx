"use client"

import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
  type: "terms" | "privacy"
}

export function TermsModal({ isOpen, onClose, type }: TermsModalProps) {
  const { t } = useTranslation()

  const title = type === "terms" ? t("auth.termsTitle", "Điều khoản Dịch vụ") : t("auth.privacyTitle", "Chính sách Bảo mật")
  const desc = type === "terms" 
    ? t("auth.termsDesc", "Vui lòng đọc kỹ điều khoản sử dụng FinManage.") 
    : t("auth.privacyDesc", "Chính sách bảo vệ thông tin và dữ liệu cá nhân của bạn.")

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={desc}>
      <div className="space-y-4 pt-4 border-t mt-2 text-sm text-foreground/80 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
        {type === "terms" ? (
          <div className="space-y-3">
            <section>
              <h4 className="font-semibold text-foreground">1. Chấp nhận Điều khoản / Acceptance of Terms</h4>
              <p className="mt-1 text-xs">
                Khi đăng ký hoặc sử dụng FinManage, bạn đồng ý tuân thủ các điều khoản này. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.
                <br />
                <span className="text-muted-foreground italic">By registering or using FinManage, you agree to comply with these terms. If you do not agree, please stop using the service.</span>
              </p>
            </section>
            <section>
              <h4 className="font-semibold text-foreground">2. Tài khoản người dùng / User Account</h4>
              <p className="mt-1 text-xs">
                Bạn có trách nhiệm bảo mật thông tin tài khoản, mật khẩu và mọi hoạt động diễn ra dưới tài khoản của mình.
                <br />
                <span className="text-muted-foreground italic">You are responsible for maintaining the confidentiality of your account, password, and all activities under your account.</span>
              </p>
            </section>
            <section>
              <h4 className="font-semibold text-foreground">3. Sử dụng hợp lệ / Permitted Use</h4>
              <p className="mt-1 text-xs">
                FinManage là công cụ hỗ trợ quản lý tài chính cá nhân. Bạn cam kết không sử dụng hệ thống cho bất kỳ mục đích bất hợp pháp, rửa tiền hoặc gian lận tài chính nào.
                <br />
                <span className="text-muted-foreground italic">FinManage is a personal finance management tool. You agree not to use the system for any illegal purposes, money laundering, or financial fraud.</span>
              </p>
            </section>
            <section>
              <h4 className="font-semibold text-foreground">4. Giới hạn trách nhiệm / Limitation of Liability</h4>
              <p className="mt-1 text-xs">
                Chúng tôi không chịu trách nhiệm về bất kỳ tổn thất tài chính trực tiếp hay gián tiếp nào phát sinh từ việc bạn sử dụng ứng dụng hoặc do sai sót trong quá trình nhập liệu của người dùng.
                <br />
                <span className="text-muted-foreground italic">We are not liable for any direct or indirect financial loss resulting from your use of the application or due to errors in user input.</span>
              </p>
            </section>
            <section>
              <h4 className="font-semibold text-foreground">5. Thay đổi điều khoản / Changes to Terms</h4>
              <p className="mt-1 text-xs">
                Chúng tôi có quyền cập nhật, chỉnh sửa các điều khoản này bất kỳ lúc nào để phù hợp với pháp luật và dịch vụ của chúng tôi.
                <br />
                <span className="text-muted-foreground italic">We reserve the right to update or modify these terms at any time to comply with local laws and our service offerings.</span>
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-3">
            <section>
              <h4 className="font-semibold text-foreground">1. Thu thập thông tin / Information Collection</h4>
              <p className="mt-1 text-xs">
                Chúng tôi thu thập thông tin cá nhân (họ tên, email) khi bạn đăng ký và các thông tin giao dịch tài chính do bạn tự nguyện nhập vào hệ thống.
                <br />
                <span className="text-muted-foreground italic">We collect personal information (name, email) when you register, as well as financial transaction details you voluntarily input.</span>
              </p>
            </section>
            <section>
              <h4 className="font-semibold text-foreground">2. Sử dụng thông tin / Use of Information</h4>
              <p className="mt-1 text-xs">
                Dữ liệu tài chính của bạn được dùng để tổng hợp báo cáo chi tiêu trực quan, phân tích xu hướng và cung cấp gợi ý quản lý tài chính cá nhân thông qua AI.
                <br />
                <span className="text-muted-foreground italic">Your financial data is used to generate visual spending reports, analyze trends, and provide personal financial advice through AI.</span>
              </p>
            </section>
            <section>
              <h4 className="font-semibold text-foreground">3. Bảo mật dữ liệu / Data Security</h4>
              <p className="mt-1 text-xs">
                Mọi thông tin cá nhân và dữ liệu giao dịch của bạn đều được mã hóa trong quá trình truyền tải và lưu trữ để đảm bảo an toàn tuyệt đối trước các truy cập trái phép.
                <br />
                <span className="text-muted-foreground italic">All your personal information and transaction data are encrypted during transmission and storage to prevent unauthorized access.</span>
              </p>
            </section>
            <section>
              <h4 className="font-semibold text-foreground">4. Chia sẻ thông tin / Information Sharing</h4>
              <p className="mt-1 text-xs">
                Chúng tôi cam kết không bán, trao đổi hoặc tiết lộ thông tin tài chính cá nhân của bạn cho bất kỳ bên thứ ba nào khi chưa có sự đồng ý của bạn.
                <br />
                <span className="text-muted-foreground italic">We promise not to sell, trade, or disclose your personal financial information to any third party without your consent.</span>
              </p>
            </section>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t mt-4">
        <Button variant="outline" onClick={onClose} className="px-6">
          {t("common.close", "Đóng")}
        </Button>
      </div>
    </Modal>
  )
}
