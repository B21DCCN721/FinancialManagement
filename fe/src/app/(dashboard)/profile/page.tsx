"use client"

import { useState } from "react"
import { Loader2, Save, KeyRound, Trash2, User2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useGetMeQuery, useUpdateProfileMutation, useChangePasswordMutation } from "@/services/usersApi"
import { useDeleteAccountMutation } from "@/services/authApi"
import { useDispatch } from "react-redux"
import { updateUser, clearAuth } from "@/store/authSlice"
import { logger } from "@/lib/logger"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const dispatch = useDispatch()
  const router = useRouter()

  const { data: user, isLoading } = useGetMeQuery()
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()
  const [changePassword, { isLoading: isChangingPwd }] = useChangePasswordMutation()
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation()

  const [profileSuccess, setProfileSuccess] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [pwdSuccess, setPwdSuccess] = useState(false)
  const [pwdError, setPwdError] = useState("")

  const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setProfileSuccess(false)
    const formData = new FormData(e.currentTarget)
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string

    try {
      const updatedUser = await updateProfile({ firstName, lastName }).unwrap()
      dispatch(updateUser(updatedUser))
      setProfileSuccess(true)
      logger.info("Profile updated")
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      logger.error("Failed to update profile", err)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdError("")
    setPwdSuccess(false)
    if (newPwd.length < 8) { setPwdError("Mật khẩu mới phải có ít nhất 8 ký tự."); return }
    try {
      await changePassword({ currentPassword: currentPwd, newPassword: newPwd }).unwrap()
      setPwdSuccess(true)
      setCurrentPwd("")
      setNewPwd("")
      logger.info("Password changed")
      setTimeout(() => setPwdSuccess(false), 3000)
    } catch (err) {
      const apiErr = err as { data?: { message?: string } }
      setPwdError(apiErr?.data?.message ?? "Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hiện tại.")
      logger.error("Failed to change password", err)
    }
  }

  const handleLogout = () => {
    dispatch(clearAuth())
    router.push("/login")
  }

  const confirmDeleteAccount = async () => {
    setDeleteError("")
    try {
      await deleteAccount().unwrap()
      dispatch(clearAuth())
      router.push("/login")
    } catch (err) {
      logger.error("Failed to delete account", err)
      setDeleteError("Có lỗi xảy ra khi xóa tài khoản. Vui lòng thử lại sau.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
          Cài đặt tài khoản
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Quản lý thông tin cá nhân và thiết lập bảo mật của bạn.</p>
      </div>

      {/* Avatar Header */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8 rounded-3xl relative overflow-hidden group transition-all duration-500 hover:shadow-xl"
        style={{
          background: "linear-gradient(135deg, rgba(124,92,252,0.1) 0%, rgba(192,132,252,0.03) 100%)",
          border: "1px solid rgba(124,92,252,0.2)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div
          className="h-24 w-24 rounded-[2rem] flex flex-shrink-0 items-center justify-center text-4xl font-bold text-white shadow-lg relative z-10 transition-transform duration-500 group-hover:scale-105"
          style={{ background: "linear-gradient(135deg, #7c5cfc 0%, #c084fc 100%)" }}
        >
          {user?.firstName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? <User2 className="h-12 w-12" />}
        </div>
        <div className="relative z-10">
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {user?.firstName || user?.lastName
              ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
              : "Chưa đặt tên"}
          </p>
          <p className="text-base text-muted-foreground mt-1.5">{user?.email}</p>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary mt-4 border border-primary/20 backdrop-blur-sm">
            Thành viên từ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Personal Info */}
        <Card className="overflow-hidden border-border/40 shadow-sm transition-all duration-500 hover:shadow-lg hover:border-primary/30 group">
          <CardHeader className="bg-muted/20 pb-6 border-b border-border/40">
            <CardTitle className="text-xl flex items-center gap-2">
              <User2 className="h-5 w-5 text-primary" />
              Thông tin cá nhân
            </CardTitle>
            <CardDescription>Cập nhật tên hiển thị của bạn trên hệ thống.</CardDescription>
          </CardHeader>
          <form onSubmit={handleProfileSave}>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label htmlFor="firstName" className="font-medium">Tên</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={user?.firstName ?? ""}
                    placeholder="Nguyễn"
                    className="transition-all focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="lastName" className="font-medium">Họ</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={user?.lastName ?? ""}
                    placeholder="Văn A"
                    className="transition-all focus-visible:ring-primary/50"
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="email" className="font-medium">Email liên hệ</Label>
                <Input id="email" type="email" value={user?.email ?? ""} disabled className="opacity-70 bg-muted/50" />
                <p className="text-xs text-muted-foreground">Email là định danh duy nhất và không thể thay đổi.</p>
              </div>
              {profileSuccess && (
                <div className="flex items-center gap-2 text-sm text-emerald-500 font-medium animate-in fade-in slide-in-from-left-2 duration-300">
                  <CheckCircle2 className="h-5 w-5" />
                  Hồ sơ đã được lưu thành công!
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/10 pt-4 pb-6">
              <Button type="submit" disabled={isSaving} className="w-full sm:w-auto ml-auto px-8 transition-transform active:scale-95">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Lưu thay đổi
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Change Password */}
        {user?.authProvider !== "google" && (
          <Card className="overflow-hidden border-border/40 shadow-sm transition-all duration-500 hover:shadow-lg hover:border-primary/30 group">
            <CardHeader className="bg-muted/20 pb-6 border-b border-border/40">
              <CardTitle className="text-xl flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Mật khẩu & Bảo mật
              </CardTitle>
              <CardDescription>Bảo vệ tài khoản của bạn bằng một mật khẩu mạnh (ít nhất 8 ký tự).</CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2.5">
                  <Label htmlFor="current-pwd" className="font-medium">Mật khẩu hiện tại</Label>
                  <Input
                    id="current-pwd"
                    type="password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    required
                    className="max-w-md transition-all focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="new-pwd" className="font-medium">Mật khẩu mới</Label>
                  <Input
                    id="new-pwd"
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Nhập tối thiểu 8 ký tự..."
                    required
                    className="max-w-md transition-all focus-visible:ring-primary/50"
                  />
                </div>
                {pwdError && <p className="text-sm text-destructive font-medium animate-in fade-in">{pwdError}</p>}
                {pwdSuccess && (
                  <div className="flex items-center gap-2 text-sm text-emerald-500 font-medium animate-in fade-in slide-in-from-left-2 duration-300">
                    <CheckCircle2 className="h-5 w-5" />
                    Mật khẩu đã được cập nhật an toàn!
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/10 pt-4 pb-6">
                <Button type="submit" disabled={isChangingPwd} className="w-full sm:w-auto ml-auto px-8 transition-transform active:scale-95">
                  {isChangingPwd ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  Đổi mật khẩu
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Preferences */}
        <Card className="overflow-hidden border-border/40 shadow-sm transition-all duration-500 hover:shadow-lg hover:border-primary/30 group">
          <CardHeader className="bg-muted/20 pb-6 border-b border-border/40">
            <CardTitle className="text-xl flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              Tùy chọn hiển thị
            </CardTitle>
            <CardDescription>Cá nhân hoá trải nghiệm sử dụng của bạn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="currency" className="font-medium">Đơn vị tiền tệ</Label>
                <Select id="currency" defaultValue="VND">
                  <option value="VND">VND – Đồng Việt Nam</option>
                  <option value="USD">USD – US Dollar</option>
                  <option value="EUR">EUR – Euro</option>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="language" className="font-medium">Ngôn ngữ</Label>
                <Select id="language" defaultValue="vi">
                  <option value="vi">🇻🇳 Tiếng Việt</option>
                  <option value="en">🇬🇧 English</option>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 pt-4 pb-6">
            <Button variant="outline" className="w-full sm:w-auto ml-auto px-8 transition-all hover:bg-primary/10 hover:text-primary">Lưu tùy chọn</Button>
          </CardFooter>
        </Card>

        {/* Danger Zone */}
        <Card className="overflow-hidden border-destructive/20 shadow-sm transition-all duration-500 hover:shadow-lg hover:border-destructive/50 bg-gradient-to-b from-transparent to-destructive/5 group">
          <CardHeader className="border-b border-destructive/10 pb-6">
            <CardTitle className="text-xl flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Vùng nguy hiểm
            </CardTitle>
            <CardDescription className="text-destructive/80">Cẩn trọng! Những hành động dưới đây không thể hoàn tác lại.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium text-foreground">Đăng xuất khỏi thiết bị</p>
                <p className="text-sm text-muted-foreground mt-1">Kết thúc phiên làm việc hiện tại của bạn một cách an toàn.</p>
              </div>
              <Button variant="secondary" className="mt-4 sm:mt-0 px-6 transition-transform active:scale-95" onClick={handleLogout}>
                Đăng xuất
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors">
              <div>
                <p className="font-medium text-destructive">Xoá vĩnh viễn tài khoản</p>
                <p className="text-sm text-destructive/80 mt-1">Mọi dữ liệu tài chính, mục tiêu và báo cáo sẽ bị xoá sạch không thể khôi phục.</p>
              </div>
              <Button
                variant="destructive"
                className="mt-4 sm:mt-0 px-6 transition-transform active:scale-95 shadow-md hover:shadow-destructive/40"
                onClick={() => setShowDeleteModal(true)}
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Xóa tài khoản
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xóa tài khoản vĩnh viễn"
        description="Hành động này tuyệt đối không thể hoàn tác. Mọi dữ liệu tài chính của bạn sẽ bị xóa sạch khỏi hệ thống."
      >
        <div className="space-y-4 pt-4 border-t mt-2">
          {deleteError && (
            <p className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20 animate-in fade-in">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAccount}
              disabled={isDeleting}
              className="shadow-md"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
