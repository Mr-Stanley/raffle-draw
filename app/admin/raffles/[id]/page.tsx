import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Play } from "lucide-react"
import Link from "next/link"
import { PrizesTable } from "@/components/admin/prizes-table"
import { ParticipantsTable } from "@/components/admin/participants-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function RaffleDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: prizes } = await supabase.from("prizes").select("*").eq("raffle_id", id).order("created_at")

  const { data: participants } = await supabase.from("participants").select("*").eq("raffle_id", id).order("created_at")

  const { data: winners } = await supabase
    .from("winners")
    .select("*, participant:participants(*), prize:prizes(*)")
    .eq("raffle_id", id)

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

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{raffle.title}</h1>
              <p className="text-muted-foreground">{raffle.description}</p>
            </div>
            <Badge
              variant={raffle.status === "live" ? "default" : raffle.status === "completed" ? "secondary" : "outline"}
            >
              {raffle.status}
            </Badge>
          </div>

          {raffle.draw_date && (
            <p className="text-sm text-muted-foreground">
              Draw Date: {new Date(raffle.draw_date).toLocaleDateString("en-NG", { dateStyle: "full" })}
            </p>
          )}

          {raffle.status === "upcoming" && (
            <div className="mt-4">
              <Link href={`/admin/draw/${raffle.id}`}>
                <Button>
                  <Play className="mr-2 h-4 w-4" />
                  Start Live Draw
                </Button>
              </Link>
            </div>
          )}
        </div>

        <Tabs defaultValue="prizes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="prizes">Prizes ({prizes?.length || 0})</TabsTrigger>
            <TabsTrigger value="participants">Participants ({participants?.length || 0})</TabsTrigger>
            <TabsTrigger value="winners">Winners ({winners?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="prizes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Prizes</CardTitle>
                    <CardDescription>Manage prizes for this raffle</CardDescription>
                  </div>
                  <Link href={`/admin/raffles/${id}/prizes/new`}>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Prize
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <PrizesTable prizes={prizes || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
                <CardDescription>View all registered participants</CardDescription>
              </CardHeader>
              <CardContent>
                <ParticipantsTable participants={participants || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="winners">
            <Card>
              <CardHeader>
                <CardTitle>Winners</CardTitle>
                <CardDescription>View all winners from this raffle</CardDescription>
              </CardHeader>
              <CardContent>
                {winners && winners.length > 0 ? (
                  <div className="space-y-4">
                    {winners.map((winner) => (
                      <div key={winner.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{winner.participant?.name}</p>
                          <p className="text-sm text-muted-foreground">{winner.participant?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{winner.prize?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(winner.won_at).toLocaleString("en-NG")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No winners yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
