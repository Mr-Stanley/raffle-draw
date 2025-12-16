import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { RaffleForm } from "@/components/admin/raffle-form"

export default async function NewRafflePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  async function createRaffle(formData: FormData) {
    "use server"
    const supabase = await createClient()

    // Get the current user inside the server action
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "You must be logged in to create a raffle" }
    }

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const drawDate = formData.get("draw_date") as string

    if (!title || !drawDate) {
      return { error: "Title and draw date are required" }
    }

    // Convert datetime-local format to ISO string for PostgreSQL
    const drawDateISO = drawDate ? new Date(drawDate).toISOString() : null

    const { data: raffle, error } = await supabase
      .from("raffles")
      .insert({
        title,
        description: description || null,
        status: "upcoming",
        draw_date: drawDateISO,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating raffle:", error)
      return { error: `Failed to create raffle: ${error.message}` }
    }

    if (!raffle) {
      return { error: "Failed to create raffle: No data returned" }
    }

    redirect(`/admin/raffles/${raffle.id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Raffle</CardTitle>
            <CardDescription>Set up a new raffle draw event</CardDescription>
          </CardHeader>
          <CardContent>
            <RaffleForm createRaffle={createRaffle} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
