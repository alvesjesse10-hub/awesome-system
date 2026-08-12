import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Esta tela está em construção e chega em uma próxima etapa.</p>
      </CardContent>
    </Card>
  )
}
