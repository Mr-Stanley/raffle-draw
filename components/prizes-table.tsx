"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Prize } from "@/lib/types"

interface PrizesTableProps {
  prizes: Prize[]
}

const prizeTypeLabels: Record<Prize["type"], string> = {
  lunch_voucher: "Lunch Voucher",
  data_voucher: "Data Voucher",
  airtime: "Airtime",
  cash_token: "Cash Token",
}

export function PrizesTable({ prizes }: PrizesTableProps) {
  if (prizes.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No prizes added yet</p>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prizes.map((prize) => (
            <TableRow key={prize.id}>
              <TableCell className="font-medium">{prize.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{prizeTypeLabels[prize.type]}</Badge>
              </TableCell>
              <TableCell>₦{prize.value.toLocaleString()}</TableCell>
              <TableCell>{prize.quantity}</TableCell>
              <TableCell>{prize.remaining}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
