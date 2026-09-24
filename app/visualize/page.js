import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { querySales } from '@/lib/sales-data'
import VisualizeClient from './VisualizeClient'

export default async function VisualizePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { rows } = await querySales({})

  return <VisualizeClient records={rows} />
}
