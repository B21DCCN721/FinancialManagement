"use client"

import { useState } from "react"
import { Loader2, Save, KeyRound, Trash2, User2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useGetMeQuery, useUpdateProfileMutation, useChangePasswordMutation } from "@/services/usersApi"
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

  const [profileSuccess, setProfileSuccess] = useState(false)

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt tài khoản</h1>
        <p className="text-muted-foreground">Quản lý thông tin cá nhân và bảo mật tài khoản của bạn.</p>
      </div>

      {/* Avatar + Email header */}
      <div
        className="flex items-center gap-5 p-6 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(124,92,252,0.1) 0%, rgba(192,132,252,0.06) 100%)",
          border: "1px solid rgba(124,92,252,0.2)",
        }}
      >
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
          style={{ background: "linear-gradient(135deg, #7c5cfc 0%, #c084fc 100%)" }}
        >
          {user?.firstName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? <User2 className="h-8 w-8" />}
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">
            {user?.firstName || user?.lastName
              ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
              : "Chưa đặt tên"}
          </p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Thành viên từ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>Cập nhật tên hiển thị của bạn.</CardDescription>
          </CardHeader>
          <form onSubmit={handleProfileSave}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Tên</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={user?.firstName ?? ""}
                    placeholder="Nguyễn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Họ</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={user?.lastName ?? ""}
                    placeholder="Văn A"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email ?? ""} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">Email không thể thay đổi.</p>
              </div>
              {profileSuccess && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Cập nhật thành công!
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Lưu thay đổi
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Change Password (Only for local users) */}
        {user?.authProvider !== "google" && (
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>Mật khẩu mới phải có ít nhất 8 ký tự.</CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-pwd">Mật khẩu hiện tại</Label>
                  <Input
                    id="current-pwd"
                    type="password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pwd">Mật khẩu mới</Label>
                  <Input
                    id="new-pwd"
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                  />
                </div>
                {pwdError && <p className="text-sm text-danger">{pwdError}</p>}
                {pwdSuccess && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    Đổi mật khẩu thành công!
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isChangingPwd}>
                  {isChangingPwd ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  Đổi mật khẩu
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Tùy chọn hiển thị</CardTitle>
            <CardDescription>Ngôn ngữ và đơn vị tiền tệ.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Đơn vị tiền tệ mặc định</Label>
              <Select id="currency" defaultValue="VND">
                <option value="VND">VND – Vietnamese Dong</option>
                <option value="USD">USD – US Dollar</option>
                <option value="EUR">EUR – Euro</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Ngôn ngữ</Label>
              <Select id="language" defaultValue="vi">
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline">Lưu tùy chọn</Button>
          </CardFooter>
        </Card>

        {/* Danger Zone */}
        <Card style={{ borderColor: "rgba(239,68,68,0.3)" }}>
          <CardHeader>
            <CardTitle className="text-danger">Vùng nguy hiểm</CardTitle>
            <CardDescription>Những hành động này không thể hoàn tác.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleLogout}>
              Đăng xuất tài khoản
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              style={{ borderColor: "rgba(239,68,68,0.3)", color: "#ef4444" }}
              onClick={() => {
                if (confirm("Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác.")) {
                  // useDeleteAccountMutation – gọi khi user xác nhận
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa tài khoản vĩnh viễn
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
