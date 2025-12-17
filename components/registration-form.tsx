"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

interface RegistrationFormProps {
  raffleId: string
  participantCount: number
}

export function RegistrationForm({ raffleId, participantCount }: RegistrationFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [entryCode, setEntryCode] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email")?.toString().toLowerCase().trim() as string
    const phone = formData.get("phone") as string

    // Validate raffle exists and is still open for registration
    const { data: raffle, error: raffleError } = await supabase
      .from("raffles")
      .select("id, status")
      .eq("id", raffleId)
      .single()

    if (raffleError || !raffle) {
      setError("This raffle no longer exists or is invalid. Please refresh the page.")
      setIsLoading(false)
      return
    }

    if (raffle.status !== "upcoming") {
      setError(
        raffle.status === "live"
          ? "Registration is closed. This raffle draw is currently live."
          : "Registration is closed. This raffle has ended."
      )
      setIsLoading(false)
      return
    }

    // Check if user is already registered before attempting insert
    const { data: existingParticipant } = await supabase
      .from("participants")
      .select("id, email")
      .eq("raffle_id", raffleId)
      .eq("email", email)
      .single()

    if (existingParticipant) {
      setError("This email is already registered for this raffle. Please use a different email address.")
      setIsLoading(false)
      return
    }

    // Generate unique entry code using timestamp and random number to avoid collisions
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
    const generatedCode = `RAFFLE-${timestamp}-${random}`

    try {
      const { data, error } = await supabase
        .from("participants")
        .insert({
          raffle_id: raffleId,
          name,
          email,
          phone,
          entry_code: generatedCode,
        })
        .select()
        .single()

      if (error) {
        // Handle specific error cases
        if (error.code === "23503") {
          // Foreign key constraint violation - raffle doesn't exist
          setError("This raffle no longer exists. Please refresh the page and try again.")
          return
        } else if (error.code === "23505") {
          // Unique constraint violation
          if (error.message.includes("entry_code")) {
            // Retry with a new code
            const retryTimestamp = Date.now().toString().slice(-6)
            const retryRandom = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
            const retryCode = `RAFFLE-${retryTimestamp}-${retryRandom}`
            
            const { data: retryData, error: retryError } = await supabase
              .from("participants")
              .insert({
                raffle_id: raffleId,
                name,
                email,
                phone,
                entry_code: retryCode,
              })
              .select()
              .single()

            if (retryError) {
              if (retryError.code === "23503") {
                setError("This raffle no longer exists. Please refresh the page.")
              } else {
                setError("Registration failed. Please try again.")
              }
              return
            }

            setSuccess(true)
            setEntryCode(retryData.entry_code)
            router.refresh()
            return
          } else {
            // Email conflict (shouldn't happen due to pre-check, but handle it)
            setError("This email is already registered for this raffle.")
            return
          }
        } else {
          setError(error.message || "Registration failed. Please try again.")
          return
        }
      }

      setSuccess(true)
      setEntryCode(data.entry_code)
      router.refresh()
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success && entryCode) {
    return (
      <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Registration Successful!</h3>
          <p className="text-muted-foreground mb-4">You are now entered in the raffle draw</p>

          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-green-300 mb-4">
            <p className="text-sm text-muted-foreground mb-2">Your Entry Code</p>
            <p className="text-3xl font-bold text-primary">{entryCode}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            Save this code! You will need it to claim your prize if you win. Good luck!
          </p>
        </div>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" placeholder="Chidi Okafor" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" name="email" type="email" placeholder="chidi@example.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+234 801 234 5678" required />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Registering..." : "Register Now"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By registering, you agree to participate in the raffle draw
      </p>
    </form>
  )
}
