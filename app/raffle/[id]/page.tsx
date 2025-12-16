import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Gift, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { RegistrationForm } from "@/components/registration-form"

export default async function RaffleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: raffle } = await supabase.from("raffles").select("*").eq("id", id).single()

  if (!raffle) {
    redirect("/")
  }

  const { data: prizes } = await supabase
    .from("prizes")
    .select("*")
    .eq("raffle_id", id)
    .order("value", { ascending: false })

  const { data: participants } = await supabase.from("participants").select("*").eq("raffle_id", id)

  const prizeTypeLabels = {
    lunch_voucher: "Lunch Voucher",
    data_voucher: "Data Voucher",
    airtime: "Airtime",
    cash_token: "Cash Token",
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-balance">{raffle.title}</h1>
                <p className="text-lg text-muted-foreground">{raffle.description}</p>
              </div>
              <Badge
                variant={raffle.status === "live" ? "default" : raffle.status === "completed" ? "secondary" : "outline"}
                className="text-base px-4 py-2"
              >
                {raffle.status === "live" && (
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
                    Live
                  </span>
                )}
                {raffle.status !== "live" && raffle.status}
              </Badge>
            </div>

            {raffle.draw_date && (
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>
                    Draw Date: {new Date(raffle.draw_date).toLocaleDateString("en-NG", { dateStyle: "full" })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  <span>{prizes?.length || 0} prizes</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Prizes List */}
            <Card>
              <CardHeader>
                <CardTitle>Available Prizes</CardTitle>
                <CardDescription>Win one of these amazing prizes</CardDescription>
              </CardHeader>
              <CardContent>
                {prizes && prizes.length > 0 ? (
                  <div className="space-y-4">
                    {prizes.map((prize) => (
                      <div
                        key={prize.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50"
                      >
                        <div>
                          <p className="font-bold text-lg">{prize.name}</p>
                          <Badge variant="outline" className="mt-1">
                            {prizeTypeLabels[prize.type]}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">₦{prize.value.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{prize.remaining} available</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No prizes available</p>
                )}
              </CardContent>
            </Card>

            {/* Registration Form */}
            <Card>
              <CardHeader>
                <CardTitle>Register to Participate</CardTitle>
                <CardDescription>
                  {raffle.status === "upcoming"
                    ? "Fill in your details to join this raffle"
                    : raffle.status === "live"
                      ? "Registration closed - Draw is live"
                      : "This raffle has ended"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {raffle.status === "upcoming" ? (
                  <RegistrationForm raffleId={raffle.id} participantCount={participants?.length || 0} />
                ) : raffle.status === "live" ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                      <span className="h-8 w-8 bg-red-500 rounded-full animate-pulse" />
                    </div>
                    <p className="font-medium mb-2">Draw is happening now!</p>
                    <p className="text-sm text-muted-foreground mb-4">Watch the live draw to see the winners</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="font-medium mb-2">This raffle has ended</p>
                    <p className="text-sm text-muted-foreground">Check out other upcoming raffles</p>
                    <Link href="/">
                      <Button className="mt-4">Browse Raffles</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Participants Count */}
          {participants && participants.length > 0 && (
            <Card className="mt-8">
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-4 text-muted-foreground">
                  <Gift className="h-5 w-5" />
                  <span className="text-lg">
                    <strong className="text-foreground">{participants.length}</strong> participants registered
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
