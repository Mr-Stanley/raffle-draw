export interface Raffle {
  id: string
  title: string
  description: string | null
  status: "upcoming" | "live" | "completed"
  draw_date: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Prize {
  id: string
  raffle_id: string
  name: string
  type: "lunch_voucher" | "data_voucher" | "airtime" | "cash_token"
  value: number
  quantity: number
  remaining: number
  created_at: string
}

export interface Participant {
  id: string
  raffle_id: string
  name: string
  email: string
  phone: string | null
  entry_code: string
  created_at: string
}

export interface Winner {
  id: string
  raffle_id: string
  participant_id: string
  prize_id: string
  won_at: string
  notified: boolean
}
