import type { ReactNode } from "react"

type PrivatePageProps = {
  children: ReactNode
  description: string
  title: string
}

export function PrivatePage({
  children,
  description,
  title,
}: PrivatePageProps) {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      </header>
      {children}
    </section>
  )
}
