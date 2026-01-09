import { redirect } from 'next/navigation'

export default function NewProductPage() {
  redirect('/products/upload?tab=manual')
}
