import dynamic from 'next/dynamic'

export const dynamicConfig = 'force-dynamic'

const LoginForm = dynamic(() => import('./LoginForm'), { ssr: false })

export default function LoginPage() {
  return <LoginForm />
}
