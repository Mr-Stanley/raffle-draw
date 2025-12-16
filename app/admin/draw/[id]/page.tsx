import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LiveDrawInterface } from "@/components/admin/live-draw-interface"

export default async function LiveDrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: raffle } = await supabase.from("raffles").select("*").eq("id", id).single()

  if (!raffle) {
    redirect("/admin")
  }

  // Server action to update raffle status to live
  async function startRaffle() {
    "use server"
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be logged in" }
    }

    const { error } = await supabase.from("raffles").update({ status: "live" }).eq("id", id)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  }

  // Server action to complete raffle
  async function completeRaffle() {
    "use server"
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be logged in" }
    }

    const { error } = await supabase.from("raffles").update({ status: "completed" }).eq("id", id)

    if (error) {
      return { error: error.message }
    }

    redirect(`/admin/raffles/${id}`)
  }

  const { data: prizes } = await supabase
    .from("prizes")
    .select("*")
    .eq("raffle_id", id)
    .gt("remaining", 0)
    .order("value", { ascending: false })

  const { data: participants } = await supabase.from("participants").select("*").eq("raffle_id", id)

  const { data: winners } = await supabase
    .from("winners")
    .select("*, participant:participants(*), prize:prizes(*)")
    .eq("raffle_id", id)

  return (
    <LiveDrawInterface
      raffle={raffle}
      prizes={prizes || []}
      participants={participants || []}
      existingWinners={winners || []}
      startRaffle={startRaffle}
      completeRaffle={completeRaffle}
    />
  )
}
