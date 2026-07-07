"use client"

import { useState, useEffect } from "react"
import { Loader2, Save, KeyRound, Trash2, User2, LogOut, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Modal } from "@/components/ui/modal"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useGetMeQuery, useUpdateProfileMutation, useChangePasswordMutation, useUnlinkGoogleMutation, useDeleteAccountMutation } from "@/services/usersApi"
import { useDispatch } from "react-redux"
import { updateUser, clearAuth } from "@/store/authSlice"
import { logger } from "@/lib/logger"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export default function ProfilePage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { t, i18n } = useTranslation()

  const { data: user, isLoading } = useGetMeQuery()
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()
  const [changePassword, { isLoading: isChangingPwd }] = useChangePasswordMutation()
  const [unlinkGoogle, { isLoading: isUnlinking }] = useUnlinkGoogleMutation()
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation()

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showUnlinkModal, setShowUnlinkModal] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmNewPwd, setConfirmNewPwd] = useState("")
  const [pwdError, setPwdError] = useState("")

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.resolvedLanguage || "vi")

  useEffect(() => {
    const handleLangChange = (lng: string) => {
      setSelectedLanguage(lng)
    }
    i18n.on('languageChanged', handleLangChange)
    return () => {
      i18n.off('languageChanged', handleLangChange)
    }
  }, [i18n])

  const handleUnlinkGoogle = async () => {
    try {
      await unlinkGoogle().unwrap()
      setShowUnlinkModal(false)
      toast.success("Đã gỡ liên kết Google thành công.")
    } catch (err: any) {
      const msg = err?.data?.message || "Đã có lỗi xảy ra khi gỡ liên kết."
      toast.error(msg)
    }
  }

  const handleSavePreferences = () => {
    if (selectedLanguage !== i18n.resolvedLanguage) {
      i18n.changeLanguage(selectedLanguage)
    }
    toast.success(t("profile.savePreferences"))
  }

  const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    try {
      const updatedUser = await updateProfile({ name }).unwrap()
      dispatch(updateUser(updatedUser))
      setIsEditingProfile(false)
      toast.success(t("profile.profileSaved"))
      logger.info("Profile updated")
    } catch (err: any) {
      toast.error(err?.data?.message || t("common.error") || "Có lỗi xảy ra")
      logger.error("Failed to update profile", err)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdError("")
    if (newPwd.length < 8) { setPwdError(t("auth.passwordMinLength")); return }
    if (newPwd !== confirmNewPwd) { setPwdError(t("profile.passwordMismatch") || "Mật khẩu xác nhận không khớp"); return }
    try {
      await changePassword({ currentPassword: currentPwd, newPassword: newPwd }).unwrap()
      setCurrentPwd("")
      setNewPwd("")
      setConfirmNewPwd("")
      toast.success(t("profile.passwordSaved"))
      logger.info("Password changed")
    } catch (err) {
      const apiErr = err as { data?: { message?: string } }
      const msg = apiErr?.data?.message ?? t("profile.changePwdError")
      setPwdError(msg)
      toast.error(msg)
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
      toast.success(t("profile.deleteAccountBtn"))
      router.push("/login")
    } catch (err: any) {
      logger.error("Failed to delete account", err)
      const msg = err?.data?.message || t("common.error") || "Có lỗi xảy ra"
      setDeleteError(msg)
      toast.error(msg)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto pb-16 mt-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-8">
          <Skeleton className="h-[300px] w-full rounded-2xl" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const displayName = user?.name || t("profile.unnamed")

  const initials = displayName !== t("profile.unnamed")
    ? displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase()

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/60">
          {t("profile.title")}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-lg">{t("profile.subtitle")}</p>
      </div>

      {/* Avatar Header */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8 rounded-3xl relative overflow-hidden group transition-all duration-500 hover:shadow-xl"
        style={{
          background: "linear-gradient(135deg, rgba(124,92,252,0.1) 0%, rgba(192,132,252,0.03) 100%)",
          border: "1px solid rgba(124,92,252,0.2)",
        }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div
          className="h-24 w-24 rounded-4xl flex shrink-0 items-center justify-center text-4xl font-bold text-white shadow-lg relative z-10 transition-transform duration-500 group-hover:scale-105 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #7c5cfc 0%, #c084fc 100%)" }}
        >
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span>{initials ?? <User2 className="h-12 w-12" />}</span>
          )}
        </div>
        <div className="relative z-10">
          <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {displayName}
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-1.5">{user?.email}</p>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary mt-4 border border-primary/20 backdrop-blur-sm">
            {t("profile.memberSince")} {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(i18n.language === 'vi' ? "vi-VN" : "en-US") : "—"}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Personal Info */}
        <Card className="overflow-hidden border-border/40 shadow-sm transition-all duration-500 hover:shadow-lg hover:border-primary/30 group">
          <CardHeader className="bg-muted/20 pb-6 border-b border-border/40">
            <CardTitle className="flex items-center gap-2">
              <User2 className="h-5 w-5 text-primary" />
              {t("profile.personalInfo")}
            </CardTitle>
            <CardDescription>{t("profile.personalInfoDesc")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleProfileSave}>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2.5">
                  <Label htmlFor="name" className="font-medium">{t("profile.name")}</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={user?.name ?? ""}
                    placeholder="Nguyễn Văn A"
                    disabled={!isEditingProfile}
                    className="transition-all focus-visible:ring-primary/50"
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="email" className="font-medium">{t("profile.email")}</Label>
                <Input id="email" type="email" value={user?.email ?? ""} disabled className="opacity-70 bg-muted/50" />
                <p className="text-xs text-muted-foreground">{t("profile.emailHelp")}</p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 pt-4 pb-6">
              {!isEditingProfile ? (
                <Button type="button" onClick={(e) => { e.preventDefault(); setIsEditingProfile(true); }} className="w-full sm:w-auto ml-auto px-8 transition-transform active:scale-95">
                  <Edit2 className="mr-2 h-4 w-4" />
                  {t("profile.editBtn") || "Chỉnh sửa"}
                </Button>
              ) : (
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto ml-auto px-8 transition-transform active:scale-95">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {t("profile.saveChangesBtn") || "Xác nhận"}
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>

        {/* Change Password */}
        {user?.authProvider !== "google" && (
          <Card className="overflow-hidden border-border/40 shadow-sm transition-all duration-500 hover:shadow-lg hover:border-primary/30 group">
            <CardHeader className="bg-muted/20 pb-6 border-b border-border/40">
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                {t("profile.security")}
              </CardTitle>
              <CardDescription>{t("profile.securityDesc")}</CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2.5">
                  <Label htmlFor="current-pwd" className="font-medium">{t("profile.currentPassword")}</Label>
                  <Input
                    id="current-pwd"
                    type="password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    className="max-w-md transition-all focus-visible:ring-primary/50"
                    error={!currentPwd && pwdError ? "Vui lòng nhập mật khẩu hiện tại" : undefined}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="new-pwd" className="font-medium">{t("profile.newPassword")}</Label>
                  <Input
                    id="new-pwd"
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder={t("profile.newPasswordPlaceholder")}
                    className="max-w-md transition-all focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="confirm-pwd" className="font-medium">{t("profile.confirmNewPassword") || "Xác nhận mật khẩu mới"}</Label>
                  <Input
                    id="confirm-pwd"
                    type="password"
                    value={confirmNewPwd}
                    onChange={(e) => setConfirmNewPwd(e.target.value)}
                    placeholder={t("profile.confirmNewPasswordPlaceholder") || "Nhập lại mật khẩu mới"}
                    className="max-w-md transition-all focus-visible:ring-primary/50"
                  />
                </div>
                {pwdError && <p className="text-sm text-destructive font-medium animate-in fade-in">{pwdError}</p>}
              </CardContent>
              <CardFooter className="bg-muted/10 pt-4 pb-6">
                <Button type="submit" disabled={isChangingPwd} className="w-full sm:w-auto ml-auto px-8 transition-transform active:scale-95">
                  {isChangingPwd ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  {t("profile.changePasswordBtn")}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Account Linking */}
        {user?.authProvider === "linked" && (
          <Card className="overflow-hidden border-border/40 shadow-sm transition-all duration-500 hover:shadow-lg hover:border-primary/30 group">
            <CardHeader className="bg-muted/20 pb-6 border-b border-border/40">
              <CardTitle className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Tài khoản liên kết
              </CardTitle>
              <CardDescription>Quản lý các tài khoản bên ngoài đã liên kết với tài khoản này.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Google</h4>
                  <p className="text-xs text-muted-foreground">Đã liên kết để đăng nhập nhanh chóng.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowUnlinkModal(true)} disabled={isUnlinking} className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20">
                  {isUnlinking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gỡ liên kết"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preferences */}
        <Card className="overflow-hidden border-border/40 shadow-sm transition-all duration-500 hover:shadow-lg hover:border-primary/30 group">
          <CardHeader className="bg-muted/20 pb-6 border-b border-border/40">
            <CardTitle className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              {t("profile.preferences")}
            </CardTitle>
            <CardDescription>{t("profile.preferencesDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2.5 max-w-sm">
                <Label htmlFor="language" className="font-medium">{t("profile.language")}</Label>
                <Select
                  id="language"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  <option value="vi">🇻🇳 Tiếng Việt</option>
                  <option value="en">🇬🇧 English</option>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 pt-4 pb-6">
            <Button className="w-full sm:w-auto ml-auto px-8 transition-transform active:scale-95 text-primary-foreground bg-primary hover:bg-primary/90" onClick={handleSavePreferences}>
              <Save className="mr-2 h-4 w-4" />
              {t("profile.savePreferences")}
            </Button>
          </CardFooter>
        </Card>

        {/* Danger Zone */}
        <Card className="overflow-hidden border-destructive/20 shadow-sm transition-all duration-500 hover:shadow-lg hover:border-destructive/50 bg-linear-to-b from-transparent to-destructive/5 group">
          <CardHeader className="border-b border-destructive/10 pb-6">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              {t("profile.dangerZone")}
            </CardTitle>
            <CardDescription className="text-destructive/80">{t("profile.dangerZoneDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium text-foreground">{t("profile.logout")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("profile.logoutDesc")}</p>
              </div>
              <Button variant="destructive" className="mt-4 sm:mt-0 px-6 transition-transform active:scale-95" onClick={() => setShowLogoutModal(true)}>
                <LogOut className="mr-2 h-4 w-4" />
                {t("profile.logoutBtn")}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors">
              <div>
                <p className="font-medium text-destructive">{t("profile.deleteAccount")}</p>
                <p className="text-sm text-destructive/80 mt-1">{t("profile.deleteAccountDesc")}</p>
              </div>
              <Button
                variant="destructive"
                className="mt-4 sm:mt-0 px-6 transition-transform active:scale-95 shadow-md hover:shadow-destructive/40"
                onClick={() => setShowDeleteModal(true)}
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("profile.deleteAccountBtn")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t("profile.deleteConfirmTitle")}
        description={t("profile.deleteConfirmDesc")}
      >
        <div className="space-y-4 pt-4">
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
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAccount}
              disabled={isDeleting}
              className="shadow-md"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {t("profile.confirmDelete")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title={t("profile.logoutConfirmTitle")}
        description={t("profile.logoutConfirmDesc")}
      >
        <div className="space-y-4 pt-4">
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutModal(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="shadow-md"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("profile.confirmLogout")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unlink Google Modal */}
      <ConfirmModal
        isOpen={showUnlinkModal}
        onClose={() => setShowUnlinkModal(false)}
        onConfirm={handleUnlinkGoogle}
        title="Gỡ liên kết Google"
        description="Bạn có chắc chắn muốn gỡ liên kết Google? Bạn sẽ chỉ có thể đăng nhập bằng mật khẩu sau khi gỡ."
        confirmText="Đồng ý gỡ"
        cancelText="Hủy"
        variant="danger"
        isLoading={isUnlinking}
      />
    </div>
  )
}
