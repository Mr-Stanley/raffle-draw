import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewPrizePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  async function createPrize(formData: FormData) {
    "use server"
    const supabase = await createClient()

    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const value = Number.parseFloat(formData.get("value") as string)
    const quantity = Number.parseInt(formData.get("quantity") as string)

    await supabase.from("prizes").insert({
      raffle_id: id,
      name,
      type,
      value,
      quantity,
      remaining: quantity,
    })

    redirect(`/admin/raffles/${id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/admin/raffles/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Raffle
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Add New Prize</CardTitle>
            <CardDescription>Add a prize to this raffle draw</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createPrize} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Prize Name</Label>
                <Input id="name" name="name" placeholder="Lunch Voucher - N5000" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Prize Type</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select prize type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lunch_voucher">Lunch Voucher</SelectItem>
                    <SelectItem value="data_voucher">Data Voucher</SelectItem>
                    <SelectItem value="airtime">Airtime</SelectItem>
                    <SelectItem value="cash_token">Cash Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Value (₦)</Label>
                <Input id="value" name="value" type="number" min="0" step="0.01" placeholder="5000" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" min="1" placeholder="5" required />
              </div>

              <Button type="submit" className="w-full">
                Add Prize
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
