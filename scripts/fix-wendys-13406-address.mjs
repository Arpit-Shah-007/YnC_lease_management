import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data, error } = await supabase
  .from('locations')
  .update({ address: '276 Jersey Ave' })
  .eq('slug', 'jersey-city-245-12th-st')
  .select('id, slug, address, city, state, zip')

if (error) {
  // Try by store_number if slug didn't match
  const { data: d2, error: e2 } = await supabase
    .from('locations')
    .update({ address: '276 Jersey Ave' })
    .eq('store_number', '13406')
    .select('id, slug, address, city, state, zip')

  if (e2) { console.error('Both attempts failed:', e2.message); process.exit(1) }
  console.log('Updated (by store_number):', d2)
} else {
  console.log('Updated (by slug):', data)
}
