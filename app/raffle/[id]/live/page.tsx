import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PublicLiveDraw } from "@/components/public-live-draw"

export default async function PublicLiveDrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: raffle } = await supabase.from("raffles").select("*").eq("id", id).single()

  if (!raffle) {
    redirect("/")
  }

  // Only allow viewing if raffle is live
  if (raffle.status !== "live") {
    redirect(`/raffle/${id}`)
  }

  const { data: prizes } = await supabase
    .from("prizes")
    .select("*")
    .eq("raffle_id", id)
    .order("value", { ascending: false })

  const { data: participants } = await supabase.from("participants").select("*").eq("raffle_id", id)

  const { data: winners } = await supabase
    .from("winners")
    .select("*, participant:participants(*), prize:prizes(*)")
    .eq("raffle_id", id)
    .order("won_at", { ascending: false })

  return (
    <PublicLiveDraw
      raffle={raffle}
      prizes={prizes || []}
      participants={participants || []}
      winners={winners || []}
    />
  )
}

