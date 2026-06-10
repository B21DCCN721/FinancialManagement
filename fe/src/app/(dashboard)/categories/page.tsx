"use client"

import { useState } from "react"
import { Plus, Tag, Pencil, Trash2, Loader2, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/services/categoriesApi"
import { logger } from "@/lib/logger"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

// Bảng emoji icon gợi ý
const ICON_SUGGESTIONS = ["🍔", "🚗", "🛍️", "🎬", "🏠", "⚡", "💊", "✈️", "📚", "💰", "🎓", "💳", "🎁", "📝"]
const COLOR_SUGGESTIONS = [
  "#7c5cfc", "#10d9a0", "#ff4d6d", "#f59e0b",
  "#38bdf8", "#a78bfa", "#34d399", "#fb923c",
]

function CategoryTypeBadge({ type }: { type: string }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={
        type === "income"
          ? { background: "rgba(16,217,160,0.12)", color: "#10d9a0", border: "1px solid rgba(16,217,160,0.25)" }
          : { background: "rgba(124,92,252,0.12)", color: "#a78bfa", border: "1px solid rgba(124,92,252,0.25)" }
      }
    >
      {type === "income" ? (
        // Temporary fallback until hook is used here, or we use t directly
        // Actually, this component is outside. Let's pass t or use hook here.
        "Thu nhập"
      ) : "Chi phí"}
    </span>
  )
}

export default function CategoriesPage() {
  const { t } = useTranslation()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedIcon, setSelectedIcon] = useState("📝")
  const [selectedColor, setSelectedColor] = useState("#7c5cfc")

  const { data: categories = [], isLoading } = useGetCategoriesQuery()
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation()
  const [deleteCategory] = useDeleteCategoryMutation()

  const editingCategory = categories.find((c) => c.id === editingId)

  const resetModal = () => {
    setIsAddModalOpen(false)
    setEditingId(null)
    setSelectedIcon("📝")
    setSelectedColor("#7c5cfc")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const type = formData.get("type") as "income" | "expense"

    try {
      if (editingId) {
        await updateCategory({ id: editingId, body: { name, color: selectedColor, icon: selectedIcon } }).unwrap()
        logger.info("Category updated", { id: editingId })
        toast.success(t("categories.updateSuccess"))
      } else {
        await createCategory({ name, type, color: selectedColor, icon: selectedIcon }).unwrap()
        logger.info("Category created", { name })
        toast.success(t("categories.addSuccess"))
      }
      resetModal()
    } catch (err) {
      logger.error("Failed to save category", err)
      toast.error(t("categories.addError"))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id).unwrap()
      logger.info("Category deleted", { id })
      toast.success(t("categories.deleteSuccess"))
    } catch (err) {
      logger.error("Failed to delete category", err)
      toast.error(t("categories.deleteError"))
    }
  }

  const openEdit = (id: string) => {
    const cat = categories.find((c) => c.id === id)
    if (!cat) return
    setEditingId(id)
    setSelectedIcon(cat.icon ?? "📝")
    setSelectedColor(cat.color ?? "#7c5cfc")
    setIsAddModalOpen(true)
  }

  const incomeCategories = categories.filter((c) => c.type === "income")
  const expenseCategories = categories.filter((c) => c.type === "expense")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("categories.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("categories.subtitle")}</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setIsAddModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(124,92,252,0.4)]"
        >
          <Plus className="h-4 w-4" />
          {t("categories.createCategory")}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Income */}
          {incomeCategories.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">{t("categories.income")}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {incomeCategories.map((cat) => (
                  <CategoryCard key={cat.id} cat={cat} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}

          {/* Expense */}
          {expenseCategories.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">{t("categories.expense")}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {expenseCategories.map((cat) => (
                  <CategoryCard key={cat.id} cat={cat} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}

          {categories.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center glass-card rounded-2xl px-6">
              <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                <Inbox className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {t("categories.empty")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={resetModal}
        title={editingId ? t("categories.editModalTitle") : t("categories.addModalTitle")}
        description={editingId ? t("categories.editModalDesc") : t("categories.addModalDesc")}
      >
        <form className="space-y-5 pt-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">{t("categories.name")}</Label>
            <Input id="name" name="name" placeholder="VD: Du lịch, Sức khỏe" required defaultValue={editingCategory?.name} />
          </div>

          {!editingId && (
            <div className="space-y-2">
              <Label>{t("categories.type")}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value="expense" defaultChecked className="text-primary focus:ring-primary h-4 w-4" />
                  <span className="text-sm font-medium">{t("categories.expense")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value="income" className="text-primary focus:ring-primary h-4 w-4" />
                  <span className="text-sm font-medium">{t("categories.income")}</span>
                </label>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("categories.icon")}</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_SUGGESTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-110"
                  style={
                    selectedIcon === icon
                      ? { background: selectedColor + "33", border: `2px solid ${selectedColor}` }
                      : { background: "var(--secondary)", border: "2px solid transparent" }
                  }
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("categories.color")}</Label>
            <div className="flex gap-2">
              {COLOR_SUGGESTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="h-7 w-7 rounded-full transition-all hover:scale-110"
                  style={{
                    background: color,
                    outline: selectedColor === color ? `3px solid ${color}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={resetModal}>{t("categories.cancel")}</Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? t("categories.update") : t("categories.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function CategoryCard({
  cat,
  onEdit,
  onDelete,
}: {
  cat: { id: string; name: string; type: string; color?: string; icon?: string }
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card className="hover:shadow-md transition-all group hover:scale-[1.01]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
              style={{ background: (cat.color ?? "#7c5cfc") + "22" }}
            >
              {cat.icon ?? <Tag className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{cat.name}</h3>
              <CategoryTypeBadge type={cat.type} />
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(cat.id)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(cat.id)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
