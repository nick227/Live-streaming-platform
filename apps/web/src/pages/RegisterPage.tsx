import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useRegister } from '@streamyolo/sdk'
import { Form } from '@/components/ui/Form'
import { AuthPageShell } from '@/components/ui/AuthPageShell'
import type { FieldConfig } from '@/components/ui/Form'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(30),
  displayName: z.string().min(1).max(50).optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const fields: FieldConfig[] = [
  { name: 'email', label: 'Email', type: 'email', voice: false, required: true },
  { name: 'password', label: 'Password', type: 'password', voice: false, required: true },
  { name: 'username', label: 'Username', type: 'text', voice: false, required: true },
  { name: 'displayName', label: 'Display Name', type: 'text', voice: false, required: false },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const mutation = useRegister()

  return (
    <AuthPageShell
      title="Create Account"
      footer={<>Already have an account?{' '}<Link to="/login" className="text-primary hover:underline">Sign In</Link></>}
    >
      <Form<FormData>
        fields={fields}
        schema={schema}
        onSubmit={async (data) => {
          try {
            await mutation.mutateAsync(data)
            navigate('/')
          } catch {
            toast.error('Registration failed — email or username may be taken')
          }
        }}
        isLoading={mutation.isPending}
        submitLabel="Create Account"
      />
    </AuthPageShell>
  )
}
