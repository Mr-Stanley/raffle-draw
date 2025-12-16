import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RafflesList } from "@/components/admin/raffles-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut, Plus } from "lucide-react"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: raffles } = await supabase
    .from("raffles")
    .select("*, prizes(count)")
    .order("created_at", { ascending: false })

  async function handleSignOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Raffle Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form action={handleSignOut}>
              <Button variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Manage Raffles</h2>
            <p className="text-muted-foreground mt-2">Create and manage your raffle draws</p>
          </div>
          <Link href="/admin/raffles/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Raffle
            </Button>
          </Link>
        </div>

        <RafflesList raffles={raffles || []} />
      </main>
    </div>
  )
}
