import { FormBuilder } from '@/components/form-builder/form-builder'
import { getRegistrationForm } from '@/lib/api'

export default function FormBuilderPage() {
  return <FormBuilder initial={getRegistrationForm().schema} />
}
