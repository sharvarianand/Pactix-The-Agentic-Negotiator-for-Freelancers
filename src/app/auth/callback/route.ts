import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      try {
        const { ensureFreelancerProfile } = await import('@/lib/auth/sync')
        await ensureFreelancerProfile(
          data.user.id,
          data.user.email!,
          data.user.user_metadata.full_name || data.user.user_metadata.name
        )
      } catch (syncError) {
        console.error('Profile Sync Error:', syncError)
      }
      return NextResponse.redirect(new URL(next, request.url))
    }
    
    if (error) console.error('Auth Callback Error:', error)
  }

  // return the user to an error page
  return NextResponse.redirect(new URL(`/login?error=auth_failed`, request.url))
}
