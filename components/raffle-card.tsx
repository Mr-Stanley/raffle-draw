"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Gift } from "lucide-react"
import type { Raffle } from "@/lib/types"
import Link from "next/link"

interface RaffleCardProps {
  raffle: Raffle & { prizes?: { count: number }[] }
}

export function RaffleCard({ raffle }: RaffleCardProps) {
  const prizeCount = raffle.prizes?.[0]?.count || 0

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-xl">{raffle.title}</CardTitle>
          {raffle.status === "live" && (
            <Badge variant="default" className="bg-red-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
                Live
              </span>
            </Badge>
          )}
          {raffle.status === "upcoming" && <Badge variant="outline">Upcoming</Badge>}
        </div>
        <CardDescription className="line-clamp-2">{raffle.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3 mb-4">
          {raffle.draw_date && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              {new Date(raffle.draw_date).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })}
            </div>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <Gift className="mr-2 h-4 w-4" />
            {prizeCount} {prizeCount === 1 ? "prize" : "prizes"} available
          </div>
        </div>

        <Link href={`/raffle/${raffle.id}`}>
          <Button className="w-full" variant={raffle.status === "live" ? "default" : "outline"}>
            {raffle.status === "live" ? "Watch Live Draw" : "View Details"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
