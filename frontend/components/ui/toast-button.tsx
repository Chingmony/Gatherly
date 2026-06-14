'use client'

import { Button, type ButtonProps } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

/**
 * A Button that fires a confirmation toast on click — for prototype actions that
 * don't yet have a backend mutation (Resend, Manage, etc.). Lets server
 * components include an interactive control without becoming client components.
 */
export function ToastButton({ message, children, ...props }: ButtonProps & { message: string }) {
  const { toast } = useToast()
  return (
    <Button {...props} onClick={() => toast(message)}>
      {children}
    </Button>
  )
}
