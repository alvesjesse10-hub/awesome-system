import { Loader2 } from 'lucide-react'

/** Fallback do Suspense enquanto o chunk de uma rota lazy carrega. */
export function PageLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      <span className="sr-only">Carregando página...</span>
    </div>
  )
}
