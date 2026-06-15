import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useLogin } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import { AuthPageShell } from '@/components/ui/AuthPageShell'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'email', label: 'Email', type: 'email', voice: false, required: true },
  { name: 'password', label: 'Password', type: 'password', voice: false, required: true },
]

export function LoginPage() {
  const navigate = useNavigate()
  const mutation = useLogin()

  return (
    <AuthPageShell
      title="Sign In"
      footer={<>Don&apos;t have an account?{' '}<Link to="/register" className="text-primary hover:underline">Sign Up</Link></>}
    >
      <Form<FormData>
        fields={fields}
        schema={schema}
        onSubmit={async (data) => {
          try {
            await mutation.mutateAsync(data)
            navigate('/', { replace: true })
          } catch (err: any) {
            if (err?.status === 401) {
              toast.error('Invalid email or password')
            } else if (err?.status === 403) {
              toast.error(err?.message ?? 'Account suspended or deactivated')
            } else {
              toast.error(err?.message ?? 'Login failed')
            }
          }
        }}
        isLoading={mutation.isPending}
        submitLabel="Sign In"
      />
    </AuthPageShell>
  )
}
