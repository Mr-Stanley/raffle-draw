"use client"

import { useEffect, useRef } from "react"
import type { Participant } from "@/lib/types"

interface WheelSpinnerProps {
  participants: Participant[]
  isSpinning: boolean
  winner: Participant | null
  onSpinComplete?: () => void
}

export function WheelSpinner({ participants, isSpinning, winner, onSpinComplete }: WheelSpinnerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)
  const animationRef = useRef<number | null>(null)
  const targetRotationRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 40

    const drawWheel = (rotation: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (participants.length === 0) {
        ctx.fillStyle = "#f3f4f6"
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "#6b7280"
        ctx.font = "20px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("No participants", centerX, centerY)
        return
      }

      const anglePerSegment = (Math.PI * 2) / participants.length

      // Draw segments
      participants.forEach((participant, index) => {
        const startAngle = index * anglePerSegment + rotation
        const endAngle = (index + 1) * anglePerSegment + rotation

        // Alternate colors
        ctx.fillStyle = index % 2 === 0 ? "#a78bfa" : "#818cf8"
        if (winner && participant.id === winner.id) {
          ctx.fillStyle = "#fbbf24" // Highlight winner in gold
        }

        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.closePath()
        ctx.fill()

        // Draw border
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw participant name
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(startAngle + anglePerSegment / 2)
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 14px sans-serif"
        const textRadius = radius * 0.7
        ctx.fillText(participant.name, textRadius, 0)
        ctx.restore()
      })

      // Draw center circle
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(centerX, centerY, 30, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 3
      ctx.stroke()

      // Draw pointer at top
      ctx.fillStyle = "#ef4444"
      ctx.beginPath()
      ctx.moveTo(centerX, centerY - radius - 10)
      ctx.lineTo(centerX - 15, centerY - radius - 30)
      ctx.lineTo(centerX + 15, centerY - radius - 30)
      ctx.closePath()
      ctx.fill()
    }

    const animate = () => {
      if (isSpinning) {
        rotationRef.current += 0.3
        drawWheel(rotationRef.current)
        animationRef.current = requestAnimationFrame(animate)
      } else if (winner) {
        // Smoothly rotate to winner
        const winnerIndex = participants.findIndex((p) => p.id === winner.id)
        if (winnerIndex !== -1) {
          const anglePerSegment = (Math.PI * 2) / participants.length
          // Calculate target angle: position winner at top (pointer position)
          // The pointer is at -PI/2 (top), so we need to rotate the winner there
          const winnerAngle = winnerIndex * anglePerSegment + anglePerSegment / 2
          // Add multiple rotations for effect, then position winner at top
          const extraRotations = 5 // Number of full rotations before stopping
          targetRotationRef.current = rotationRef.current + extraRotations * Math.PI * 2 - (winnerAngle - Math.PI / 2)

          const diff = targetRotationRef.current - rotationRef.current
          if (Math.abs(diff) > 0.01) {
            // Easing function for smooth deceleration
            rotationRef.current += diff * 0.15
            drawWheel(rotationRef.current)
            animationRef.current = requestAnimationFrame(animate)
          } else {
            rotationRef.current = targetRotationRef.current
            drawWheel(rotationRef.current)
            if (onSpinComplete) {
              setTimeout(() => onSpinComplete(), 300)
            }
          }
        } else {
          drawWheel(rotationRef.current)
        }
      } else {
        drawWheel(rotationRef.current)
      }
    }

    drawWheel(rotationRef.current)
    if (isSpinning || winner) {
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [participants, isSpinning, winner, onSpinComplete])

  return (
    <div className="flex items-center justify-center p-8">
      <canvas ref={canvasRef} width={600} height={600} className="max-w-full h-auto" />
    </div>
  )
}

