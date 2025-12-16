"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Gift, Play, Eye } from "lucide-react"
import Link from "next/link"
import type { Raffle } from "@/lib/types"

interface RafflesListProps {
  raffles: (Raffle & { prizes?: { count: number }[] })[]
}

export function RafflesList({ raffles }: RafflesListProps) {
  if (raffles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Gift className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No raffles yet</p>
          <p className="text-sm text-muted-foreground">Create your first raffle to get started</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {raffles.map((raffle) => (
        <Card key={raffle.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">{raffle.title}</CardTitle>
                <CardDescription className="mt-2 line-clamp-2">{raffle.description}</CardDescription>
              </div>
              <Badge
                variant={raffle.status === "live" ? "default" : raffle.status === "completed" ? "secondary" : "outline"}
              >
                {raffle.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
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
                {raffle.prizes?.[0]?.count || 0} prizes
              </div>
            </div>

            <div className="flex gap-2">
              <Link href={`/admin/raffles/${raffle.id}`} className="flex-1">
                <Button variant="outline" className="w-full bg-transparent" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </Link>
              {raffle.status === "upcoming" && (
                <Link href={`/admin/draw/${raffle.id}`} className="flex-1">
                  <Button className="w-full" size="sm">
                    <Play className="mr-2 h-4 w-4" />
                    Start Draw
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
