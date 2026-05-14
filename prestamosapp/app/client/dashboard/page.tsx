"use client"

import { DashboardContent } from "@/components/dashboard-content"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()
  return <DashboardContent onNavigate={(section) => router.push(`/client/${section}`)} />
}
