import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types/database'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function requireUser() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const user = await getUser()
  
  if (!user) return null
  
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return data
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) {
    redirect('/login')
  }
  return profile
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile()
  if (profile.role !== 'admin') {
    redirect('/products')
  }
  return profile
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'admin'
}
