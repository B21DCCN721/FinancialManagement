import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { AuthGuard } from "@/components/auth-guard"
import { SidebarProvider } from "@/contexts/SidebarContext"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden bg-mesh relative">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden w-full">
            <Header />
            <main className="flex-1 overflow-y-auto pt-16 p-6" style={{ background: "transparent" }}>
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  )
}
