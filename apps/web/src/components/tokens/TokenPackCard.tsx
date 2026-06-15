import { Coins } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface TokenPackCardProps {
  pack: {
    id: string
    name: string
    tokens: number
    priceUsd: number
  }
  onBuy: () => void
  isBuying?: boolean
}

export function TokenPackCard({ pack, onBuy, isBuying }: TokenPackCardProps) {
  return (
    <Card className="flex flex-col items-center text-center p-6 gap-4">
      <CardContent className="p-0 flex flex-col items-center gap-4 w-full">
        <div className="flex items-center gap-2 text-primary">
          <Coins className="h-8 w-8" />
          <span className="text-3xl font-bold">{pack.tokens.toLocaleString()}</span>
        </div>
        <p className="font-semibold text-base">{pack.name}</p>
        <p className="text-muted-foreground text-sm">${(pack.priceUsd / 100).toFixed(2)} USD</p>
        <Button className="w-full" onClick={onBuy} loading={isBuying}>
          Buy Now
        </Button>
      </CardContent>
    </Card>
  )
}
