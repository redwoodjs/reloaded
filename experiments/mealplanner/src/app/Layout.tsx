import { Context } from '@/worker'
import { Header } from './components/Header'
import { Toaster } from './components/ui/sonner'

export const Layout = ({ children, ctx }: { children: React.ReactNode, ctx: Context }) => {
  return (
    <div>
      <Header user={ctx.user} />
      {children}
      <Toaster />
    </div>
  )
}