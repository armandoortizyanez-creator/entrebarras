import dynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const LoginForm = dynamic(() => import('./LoginForm'), { ssr: false })

export default function LoginPage() {
  return <LoginForm />
}
