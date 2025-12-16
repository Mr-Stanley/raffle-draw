import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, Calendar, Users, Trophy, Sparkles } from "lucide-react"
import Link from "next/link"
import { RaffleCard } from "@/components/raffle-card"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: upcomingRaffles } = await supabase
    .from("raffles")
    .select("*, prizes(count)")
    .eq("status", "upcoming")
    .order("draw_date", { ascending: true })
    .limit(3)

  const { data: liveRaffles } = await supabase
    .from("raffles")
    .select("*, prizes(count)")
    .eq("status", "live")
    .order("created_at", { ascending: false })

  const { data: recentWinners } = await supabase
    .from("winners")
    .select("*, participant:participants(*), prize:prizes(*), raffle:raffles(*)")
    .order("won_at", { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Raffle Draw</h1>
          </div>
          <Link href="/auth/login">
            <Button variant="outline" size="sm">
              Admin Login
            </Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Banner */}
        <section className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 animate-pulse" />
              <Trophy className="h-10 w-10" />
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
            <h2 className="text-5xl font-bold mb-4 text-balance">Win Amazing Prizes!</h2>
            <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto text-balance">
              Join our exciting raffle draws and stand a chance to win lunch vouchers, data bundles, airtime, and cash
              tokens
            </p>
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                <span>Multiple Prizes</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>Fair & Transparent</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                <span>Live Draws</span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Raffles */}
        {liveRaffles && liveRaffles.length > 0 && (
          <section className="py-12 bg-yellow-50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                <h2 className="text-3xl font-bold">Live Draws Happening Now</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {liveRaffles.map((raffle) => (
                  <div key={raffle.id} className="relative">
                    <RaffleCard raffle={raffle} />
                    <Link
                      href={`/raffle/${raffle.id}/live`}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg"
                    >
                      <Button size="lg" className="bg-white text-black hover:bg-white/90">
                        Watch Live
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Upcoming Raffles */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Upcoming Raffles</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Register now to participate in our upcoming raffle draws
              </p>
            </div>

            {upcomingRaffles && upcomingRaffles.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {upcomingRaffles.map((raffle) => (
                  <RaffleCard key={raffle.id} raffle={raffle} />
                ))}
              </div>
            ) : (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No upcoming raffles</p>
                  <p className="text-sm text-muted-foreground">Check back soon for new raffle draws!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Recent Winners */}
        {recentWinners && recentWinners.length > 0 && (
          <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Recent Winners</h2>
                <p className="text-muted-foreground">Congratulations to our lucky winners!</p>
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                {recentWinners.map((winner) => (
                  <Card key={winner.id} className="border-2 border-yellow-200 bg-white">
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                          <Trophy className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{winner.participant?.name}</p>
                          <p className="text-sm text-muted-foreground">{winner.raffle?.title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{winner.prize?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(winner.won_at).toLocaleDateString("en-NG")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground">Participating is easy and transparent</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-purple-600">1</span>
                  </div>
                  <CardTitle>Register</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">
                    Sign up for an upcoming raffle with your name, email, and phone number
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-blue-600">2</span>
                  </div>
                  <CardTitle>Get Entry Code</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">Receive your unique entry code that gives you a chance to win</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-green-600">3</span>
                  </div>
                  <CardTitle>Watch & Win</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">Watch the live draw and see if you are selected as a winner!</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Raffle Draw. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
