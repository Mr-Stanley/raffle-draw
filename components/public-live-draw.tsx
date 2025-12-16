"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Sparkles, ArrowLeft, Users, Gift } from "lucide-react"
import type { Raffle, Prize, Participant, Winner } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { WheelSpinner } from "@/components/wheel-spinner"

interface PublicLiveDrawProps {
  raffle: Raffle
  prizes: Prize[]
  participants: Participant[]
  winners: (Winner & { participant?: Participant; prize?: Prize })[]
}

export function PublicLiveDraw({ raffle, prizes, participants, winners: initialWinners }: PublicLiveDrawProps) {
  const supabase = createClient()
  const [winners, setWinners] = useState(initialWinners)
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentWinner, setCurrentWinner] = useState<Participant | null>(null)

  // Subscribe to real-time updates for winners
  useEffect(() => {
    const channel = supabase
      .channel(`raffle-${raffle.id}-winners`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "winners",
          filter: `raffle_id=eq.${raffle.id}`,
        },
        async (payload) => {
          // Fetch the full winner data with relations
          const { data } = await supabase
            .from("winners")
            .select("*, participant:participants(*), prize:prizes(*)")
            .eq("id", payload.new.id)
            .single()

          if (data) {
            setWinners((prev) => [data, ...prev])
            // Set current winner for wheel animation
            if (data.participant) {
              setCurrentWinner(data.participant as Participant)
              setIsSpinning(false)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [raffle.id, supabase])

  // Subscribe to prize updates to know when a new draw starts
  useEffect(() => {
    const channel = supabase
      .channel(`raffle-${raffle.id}-prizes`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "prizes",
          filter: `raffle_id=eq.${raffle.id}`,
        },
        () => {
          // Refresh prizes to get updated remaining counts
          supabase
            .from("prizes")
            .select("*")
            .eq("raffle_id", raffle.id)
            .gt("remaining", 0)
            .order("value", { ascending: false })
            .then(({ data }) => {
              if (data && data.length > 0) {
                setCurrentPrize(data[0])
                setIsSpinning(true)
                setCurrentWinner(null)
              } else {
                setCurrentPrize(null)
              }
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [raffle.id, supabase])

  // Set initial current prize
  useEffect(() => {
    const availablePrizes = prizes.filter((p) => p.remaining > 0)
    if (availablePrizes.length > 0) {
      setCurrentPrize(availablePrizes[0])
    }
  }, [prizes])

  const prizeTypeLabels: Record<Prize["type"], string> = {
    lunch_voucher: "Lunch Voucher",
    data_voucher: "Data Voucher",
    airtime: "Airtime",
    cash_token: "Cash Token",
  }

  const getEligibleParticipants = () => {
    return participants
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/raffle/${raffle.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Raffle
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-semibold text-red-600">LIVE</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-balance">{raffle.title}</h1>
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{getEligibleParticipants().length} participants</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span>{prizes.length} prizes</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Wheel Spinner */}
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Live Draw</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentPrize && (
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
                    <h3 className="text-xl font-bold">{currentPrize.name}</h3>
                  </div>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {prizeTypeLabels[currentPrize.type]} - ₦{currentPrize.value.toLocaleString()}
                  </Badge>
                </div>
              )}

              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 flex items-center justify-center">
                {getEligibleParticipants().length > 0 ? (
                  <WheelSpinner
                    participants={getEligibleParticipants()}
                    isSpinning={isSpinning}
                    winner={currentWinner}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-xl text-muted-foreground">No participants available</p>
                  </div>
                )}
              </div>

              {currentWinner && (
                <div className="text-center p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                    <span className="text-2xl font-bold text-purple-600">Winner!</span>
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                  </div>
                  <p className="text-xl font-semibold">{currentWinner.name}</p>
                  <p className="text-sm text-muted-foreground">{currentWinner.entry_code}</p>
                </div>
              )}

              {isSpinning && (
                <div className="text-center">
                  <p className="text-lg font-semibold text-purple-600 animate-pulse">Spinning...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Winners List */}
          <Card className="lg:sticky lg:top-4 h-fit max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>Winners ({winners.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {winners.length > 0 ? (
                <div className="space-y-3">
                  {winners.map((w, index) => (
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
                <p className="text-center text-muted-foreground py-8">No winners yet. Waiting for the draw to start...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

