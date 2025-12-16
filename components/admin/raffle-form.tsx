"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RaffleFormProps {
  createRaffle: (formData: FormData) => Promise<{ error?: string } | void>
}

export function RaffleForm({ createRaffle }: RaffleFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await createRaffle(formData)
        if (result?.error) {
          setError(result.error)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Raffle Title</Label>
        <Input id="title" name="title" placeholder="Weekly Prize Draw" required disabled={isPending} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Win exciting prizes including vouchers and cash tokens..."
          rows={4}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="draw_date">Draw Date</Label>
        <Input id="draw_date" name="draw_date" type="datetime-local" required disabled={isPending} />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create Raffle"}
      </Button>
    </form>
  )
}

