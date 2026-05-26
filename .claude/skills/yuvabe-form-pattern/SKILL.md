---
name: yuvabe-form-pattern
description: Use before writing any form component in Yuvabe ATS. Enforces React Hook Form + Zod v4 patterns — schema-first, centralized validation, proper error display, loading states. Activate before writing any <form> element or useForm() call. Note: if react-hook-form is not yet installed, run `pnpm add react-hook-form @hookform/resolvers` first.
---

# Yuvabe — Form Pattern

## The rule

Every form uses React Hook Form + Zod. No exceptions. Schema lives in `schemas/`, not inside the component.

**Install (if not present):**
```bash
pnpm add react-hook-form @hookform/resolvers
```

---

## Canonical form pattern

```ts
// schemas/jobs.schema.ts — schema first, always in schemas/
export const CreateJobFormSchema = z.object({
  title: z.string().min(1, { error: 'Title is required' }).max(200),
  description: z.string().min(20, { error: 'Description must be at least 20 characters' }),
})
export type CreateJobFormValues = z.infer<typeof CreateJobFormSchema>
```

> **Zod v4 note:** Use `{ error: 'text' }` not `{ message: 'text' }` for error options — v4 renamed this field.

```tsx
// Component
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateJobFormSchema, type CreateJobFormValues } from '@/schemas/jobs.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function CreateJobForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateJobFormValues>({
    resolver: zodResolver(CreateJobFormSchema),
    defaultValues: { title: '', description: '' },
  })

  async function onSubmit(values: CreateJobFormValues) {
    try {
      await createJob(values)
      reset()
      toast.success('Job created')
    } catch {
      toast.error('Failed to create job')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Job title</Label>
        <Input
          id="title"
          {...register('title')}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" className="text-body-sm text-primary border-l-2 border-primary pl-3 py-1">
            {errors.title.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Creating…
          </>
        ) : 'Create job'}
      </Button>
    </form>
  )
}
```

---

## Error display pattern

Field errors — left terracotta rule, no icon, no card:

```tsx
{errors.fieldName && (
  <p className="text-body-sm text-primary border-l-2 border-primary pl-3 py-1 mt-1">
    {errors.fieldName.message}
  </p>
)}
```

Form-level errors (server errors):

```tsx
{formError && (
  <div className="border-l-2 border-primary pl-4 py-2 bg-primary/[0.03]">
    <p className="caps-action text-primary mb-1">Couldn't save</p>
    <p className="text-body text-foreground/80">{formError}</p>
  </div>
)}
```

---

## Loading state pattern

Submit buttons with async actions MUST show a spinner and swap their label:

```tsx
<Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      Saving…           {/* verb-specific, not generic "Loading…" */}
    </>
  ) : 'Save job'}
</Button>
```

---

## With TanStack mutation

```tsx
'use client'
import { useCreateJob } from '@/features/jobs/hooks/use-create-job'

export function CreateJobForm() {
  const createJob = useCreateJob()
  const form = useForm<CreateJobFormValues>({
    resolver: zodResolver(CreateJobFormSchema),
  })

  return (
    <form onSubmit={form.handleSubmit(async (values) => {
      await createJob.mutateAsync(values)
    })}>
      {/* fields */}
      <Button type="submit" disabled={createJob.isPending}>
        {createJob.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</>
        ) : 'Create job'}
      </Button>
      {createJob.isError && (
        <p className="text-body-sm text-primary border-l-2 border-primary pl-3 py-1">
          {createJob.error?.message ?? 'Failed to create job'}
        </p>
      )}
    </form>
  )
}
```

---

## File upload forms

File upload fields manage state separately from RHF (RHF doesn't handle `FileList` natively):

```tsx
const [file, setFile] = useState<File | null>(null)

<input
  type="file"
  accept=".pdf,.docx,.txt"
  onChange={(e) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }}
/>
```

For forms with file uploads, use `multipart/form-data` via `fetch` (not a Server Action):

```ts
const formData = new FormData()
formData.append('file', file)
formData.append('title', values.title)
const res = await fetch('/api/extract-criteria', { method: 'POST', body: formData })
```

---

## Anti-patterns

```tsx
// ❌ Schema defined inside a component
function MyForm() {
  const schema = z.object({ name: z.string() })  // move to schemas/
}

// ❌ Uncontrolled validation — no RHF
function MyForm() {
  const [email, setEmail] = useState('')
  function submit() { if (!email) alert('Required') }  // use RHF + Zod
}

// ❌ Submit button with no loading state
<Button type="submit">Submit</Button>  // must show spinner when async

// ❌ Generic error message
toast.error('Error')  // name what failed: toast.error('Failed to save job')

// ❌ React state for form field values
const [title, setTitle] = useState('')  // use register() from RHF

// ❌ Zod v3 error syntax in v4 project
z.string().min(1, { message: 'Required' })  // use { error: 'Required' } in v4
```
