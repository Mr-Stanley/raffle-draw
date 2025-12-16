"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Sparkles, ArrowLeft, Users, StopCircle } from "lucide-react"
import type { Raffle, Prize, Participant, Winner } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import confetti from "canvas-confetti"
import { WheelSpinner } from "@/components/wheel-spinner"

interface LiveDrawInterfaceProps {
  raffle: Raffle
  prizes: Prize[]
  participants: Participant[]
  existingWinners: (Winner & { participant?: Participant; prize?: Prize })[]
  startRaffle?: () => Promise<{ error?: string; success?: boolean }>
  completeRaffle?: () => Promise<{ error?: string } | void>
}

export function LiveDrawInterface({
  raffle,
  prizes,
  participants,
  existingWinners,
  startRaffle,
  completeRaffle,
}: LiveDrawInterfaceProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(prizes[0] || null)
  const [displayedName, setDisplayedName] = useState("")
  const [winner, setWinner] = useState<Participant | null>(null)
  const [winners, setWinners] = useState(existingWinners)
  const [availablePrizes, setAvailablePrizes] = useState(prizes)
  const [isRaffleLive, setIsRaffleLive] = useState(raffle.status === "live")

  useEffect(() => {
    if (raffle.status === "upcoming" && !isRaffleLive && startRaffle) {
      setRaffleToLive()
    }
  }, [raffle.status, isRaffleLive, startRaffle])

  const setRaffleToLive = async () => {
    if (!startRaffle) {
      // Fallback to client-side update if server action not provided
      const { data, error } = await supabase
        .from("raffles")
        .update({ status: "live" })
        .eq("id", raffle.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating raffle status:", error)
        alert(`Failed to start raffle: ${error.message}`)
        return
      }

      if (data) {
        setIsRaffleLive(true)
        router.refresh()
      }
      return
    }

    // Use server action
    const result = await startRaffle()
    if (result?.error) {
      alert(`Failed to start raffle: ${result.error}`)
      return
    }

    if (result?.success) {
      setIsRaffleLive(true)
      router.refresh()
    }
  }

  const getEligibleParticipants = () => {
    // All participants are eligible, including past winners
    return participants
  }

  const startDraw = async () => {
    if (!currentPrize || isSpinning) return

    const eligibleParticipants = getEligibleParticipants()
    if (eligibleParticipants.length === 0) {
      alert("No more eligible participants!")
      return
    }

    setIsSpinning(true)
    setWinner(null)
    setDisplayedName("")

    // Spin for a random duration (2-4 seconds)
    const spinDuration = 2000 + Math.random() * 2000

    setTimeout(() => {
      selectWinner(eligibleParticipants)
    }, spinDuration)
  }

  const selectWinner = async (eligibleParticipants: Participant[]) => {
    setIsSpinning(false)
    const selectedWinner = eligibleParticipants[Math.floor(Math.random() * eligibleParticipants.length)]
    setWinner(selectedWinner)

    // Save winner to database
    if (currentPrize) {
      const { data } = await supabase
        .from("winners")
        .insert({
          raffle_id: raffle.id,
          participant_id: selectedWinner.id,
          prize_id: currentPrize.id,
        })
        .select("*, participant:participants(*), prize:prizes(*)")
        .single()

      if (data) {
        setWinners([...winners, data])

        // Trigger confetti after a short delay to allow wheel to settle
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          })
        }, 500)

        // Update prize remaining count
        await supabase
          .from("prizes")
          .update({ remaining: currentPrize.remaining - 1 })
          .eq("id", currentPrize.id)

        // Update available prizes
        const updatedPrizes = availablePrizes.map((p) =>
          p.id === currentPrize.id ? { ...p, remaining: p.remaining - 1 } : p,
        )
        const stillAvailable = updatedPrizes.filter((p) => p.remaining > 0)
        setAvailablePrizes(stillAvailable)

        if (stillAvailable.length > 0) {
          setCurrentPrize(stillAvailable[0])
          // Reset winner for next draw
          setTimeout(() => {
            setWinner(null)
          }, 3000)
        } else {
          setCurrentPrize(null)
        }
      }
    }
  }

  const completeDraw = async () => {
    // Confirm before ending draw abruptly
    const confirmed = window.confirm(
      `Are you sure you want to end this draw? ${
        availablePrizes.length > 0
          ? `There are still ${availablePrizes.length} prize(s) remaining.`
          : ""
      } This action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    if (completeRaffle) {
      // Use server action
      const result = await completeRaffle()
      if (result?.error) {
        alert(`Failed to complete raffle: ${result.error}`)
      }
      // Server action handles redirect
      return
    }

    // Fallback to client-side update
    const { error } = await supabase
      .from("raffles")
      .update({ status: "completed" })
      .eq("id", raffle.id)

    if (error) {
      console.error("Error completing raffle:", error)
      alert(`Failed to complete raffle: ${error.message}`)
      return
    }

    router.push(`/admin/raffles/${raffle.id}`)
    router.refresh()
  }

  const prizeTypeLabels: Record<Prize["type"], string> = {
    lunch_voucher: "Lunch Voucher",
    data_voucher: "Data Voucher",
    airtime: "Airtime",
    cash_token: "Cash Token",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/admin/raffles/${raffle.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit Draw
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={completeDraw}
            disabled={isSpinning}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            <StopCircle className="mr-2 h-4 w-4" />
            {isSpinning ? "Spinning..." : "End Draw"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-balance">{raffle.title}</h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{getEligibleParticipants().length} eligible participants</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Draw Area */}
          <div className="space-y-6">
            {currentPrize ? (
              <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-2">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                  </div>
                  <CardTitle className="text-2xl">Current Prize</CardTitle>
                  <div className="mt-4">
                    <h3 className="text-3xl font-bold mb-2">{currentPrize.name}</h3>
                    <Badge variant="secondary" className="text-base px-4 py-1">
                      {prizeTypeLabels[currentPrize.type]}
                    </Badge>
                    <p className="text-2xl font-bold text-primary mt-2">₦{currentPrize.value.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-2">{currentPrize.remaining} remaining</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 flex items-center justify-center">
                    {getEligibleParticipants().length > 0 ? (
                      <WheelSpinner
                        participants={getEligibleParticipants()}
                        isSpinning={isSpinning}
                        winner={winner}
                        onSpinComplete={() => {
                          if (winner) {
                            confetti({
                              particleCount: 100,
                              spread: 70,
                              origin: { y: 0.6 },
                            })
                          }
                        }}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-xl text-muted-foreground">No participants available</p>
                      </div>
                    )}
                  </div>

                  {winner && (
                    <div className="text-center p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="h-6 w-6 text-yellow-500" />
                        <span className="text-2xl font-bold text-purple-600">Winner!</span>
                        <Sparkles className="h-6 w-6 text-yellow-500" />
                      </div>
                      <p className="text-xl font-semibold">{winner.name}</p>
                      <p className="text-sm text-muted-foreground">{winner.entry_code}</p>
                    </div>
                  )}

                  <Button onClick={startDraw} disabled={isSpinning || !currentPrize} className="w-full h-14 text-lg" size="lg">
                    {isSpinning ? "Spinning..." : "Spin the Wheel"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-green-500/20 shadow-lg">
                <CardContent className="py-12 text-center">
                  <Trophy className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">All Prizes Drawn!</h3>
                  <p className="text-muted-foreground mb-6">The raffle draw is complete</p>
                  <Button onClick={completeDraw} size="lg" className="bg-green-600 hover:bg-green-700">
                    Complete Draw
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Remaining Prizes */}
            {availablePrizes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Remaining Prizes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {availablePrizes.map((prize) => (
                      <div
                        key={prize.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          prize.id === currentPrize?.id ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div>
                          <p className="font-medium">{prize.name}</p>
                          <p className="text-sm text-muted-foreground">₦{prize.value.toLocaleString()}</p>
                        </div>
                        <Badge variant="outline">{prize.remaining} left</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Winners List */}
          <Card className="lg:sticky lg:top-4 h-fit max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>Winners ({winners.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {winners.length > 0 ? (
                <div className="space-y-3">
                  {winners
                    .slice()
                    .reverse()
                    .map((w, index) => (
                      <div
                        key={w.id}
                        className={`flex items-start justify-between p-4 rounded-lg border ${
                          index === 0 ? "border-yellow-500 bg-yellow-50" : "border-border"
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-bold text-lg">{w.participant?.name}</p>
                          <p className="text-sm text-muted-foreground">{w.participant?.entry_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">{w.prize?.name}</p>
                          <p className="text-sm text-muted-foreground">₦{w.prize?.value.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No winners yet. Start drawing!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
