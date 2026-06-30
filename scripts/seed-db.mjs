import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nshdnjbtzkyugeodiotw.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zaGRuamJ0emt5dWdlb2Rpb3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIwMjI2NCwiZXhwIjoyMDk2Nzc4MjY0fQ.a1f4xrBYPHVKQK6AXjl0PYdVrr2kZWK8-Rf5TR5P7VM'

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

function ok(label, res) {
  if (res.error) {
    console.error(`✗ ${label}:`, res.error.message)
    process.exit(1)
  }
  const count = Array.isArray(res.data) ? res.data.length : 1
  console.log(`✓ ${label} (${count})`)
  return res.data
}

// ── Brands ────────────────────────────────────────────────────────
async function seedBrands() {
  const data = [
    { id: 'wendys',   display_name: "Wendy's",  color: '#e2211c' },
    { id: 'tacobell', display_name: 'Taco Bell', color: '#702082' },
  ]
  ok('brands', await sb.from('brands').upsert(data, { onConflict: 'id' }))
}

// ── Locations ─────────────────────────────────────────────────────
async function seedLocations() {
  const rows = [
    { slug: 'tacobell-041966', brand: 'tacobell', store_number: '041966', display_name: 'Jersey City - Path Plaza',         short_name: 'Path Plaza',       address: '163 Washington Valley Road',  city: 'Jersey City',    state: 'NJ', zip: '07059', maps_url: 'https://www.google.com/maps/search/?api=1&query=163+Washington+Valley+Road+Jersey+City+NJ+07059', lat: 40.7264, lng: -74.0383 },
    { slug: 'tacobell-030685', brand: 'tacobell', store_number: '030685', display_name: 'Milltown - Ryders Lane',            short_name: 'Ryders Lane',      address: '200 Ryders Lane',             city: 'Milltown',       state: 'NJ', zip: '08850', maps_url: 'https://www.google.com/maps/search/?api=1&query=200+Ryders+Lane+Milltown+NJ+08850', lat: 40.4574, lng: -74.4319 },
    { slug: 'tacobell-034804', brand: 'tacobell', store_number: '034804', display_name: 'Bayonne - E 53rd Street',           short_name: 'E 53rd Street',    address: '21-33 E 53rd Street',         city: 'Bayonne',        state: 'NJ', zip: '07002', maps_url: 'https://www.google.com/maps/search/?api=1&query=21+E+53rd+Street+Bayonne+NJ+07002', lat: 40.6568, lng: -74.1117 },
    { slug: 'tacobell-038857', brand: 'tacobell', store_number: '038857', display_name: 'Jersey City - Montgomery Street',   short_name: 'Montgomery St',    address: '75 Montgomery Street',        city: 'Jersey City',    state: 'NJ', zip: '07302', maps_url: 'https://www.google.com/maps/search/?api=1&query=75+Montgomery+Street+Jersey+City+NJ+07302', lat: 40.7163, lng: -74.0416 },
    { slug: 'tacobell-040482', brand: 'tacobell', store_number: '040482', display_name: 'North Brunswick - Rt 130',          short_name: 'Rt 130',           address: '2720 US Route 130',           city: 'North Brunswick', state: 'NJ', zip: '08902', maps_url: 'https://www.google.com/maps/search/?api=1&query=2720+US+Route+130+North+Brunswick+NJ+08902', lat: 40.4873, lng: -74.4769 },
    { slug: 'tacobell-040306', brand: 'tacobell', store_number: '040306', display_name: 'Manville - North Main Street',      short_name: 'North Main St',    address: '100 North Main Street',       city: 'Manville',       state: 'NJ', zip: '08835', maps_url: 'https://www.google.com/maps/search/?api=1&query=100+North+Main+Street+Manville+NJ+08835', lat: 40.5418, lng: -74.5879 },
    { slug: 'tacobell-040323', brand: 'tacobell', store_number: '040323', display_name: 'Jersey City - 12th Street',         short_name: '12th Street JC',   address: '231 12th Street',             city: 'Jersey City',    state: 'NJ', zip: '07310', maps_url: 'https://www.google.com/maps/search/?api=1&query=231+12th+Street+Jersey+City+NJ+07310', lat: 40.7198, lng: -74.0451 },
    { slug: 'wendys-13589',    brand: 'wendys',   store_number: '13589',  display_name: 'Clinton - Walmart Plaza',           short_name: 'Walmart Plaza',    address: '39 Walmart Plaza',            city: 'Clinton',        state: 'NJ', zip: '08809', maps_url: 'https://www.google.com/maps/search/?api=1&query=39+Walmart+Plaza+Clinton+NJ+08809', lat: 40.6387, lng: -74.9093 },
    { slug: 'wendys-13406',    brand: 'wendys',   store_number: '13406',  display_name: "Jersey City - 12th Street",         short_name: '12th St JC',       address: '245 12th Street',             city: 'Jersey City',    state: 'NJ', zip: '07302', maps_url: 'https://www.google.com/maps/search/?api=1&query=245+12th+Street+Jersey+City+NJ+07302', lat: 40.7197, lng: -74.0449 },
    { slug: 'wendys-13569',    brand: 'wendys',   store_number: '13569',  display_name: 'Rockaway - Route 46',               short_name: 'Route 46',         address: '209 Route 46',                city: 'Rockaway',       state: 'NJ', zip: '07866', maps_url: 'https://www.google.com/maps/search/?api=1&query=209+Route+46+Rockaway+NJ+07866', lat: 40.9001, lng: -74.5165 },
    { slug: 'wendys-9549',     brand: 'wendys',   store_number: '9549',   display_name: 'Poughkeepsie - South Road',         short_name: 'South Road',       address: '2596 South Road',             city: 'Poughkeepsie',  state: 'NY', zip: '12601', maps_url: 'https://www.google.com/maps/search/?api=1&query=2596+South+Road+Poughkeepsie+NY+12601', lat: 41.6588, lng: -73.9370 },
    { slug: 'wendys-5327',     brand: 'wendys',   store_number: '5327',   display_name: 'Brick - Jack Martin Blvd',          short_name: 'Jack Martin Blvd', address: '101 Jack Martin Boulevard',   city: 'Brick',          state: 'NJ', zip: '08724', maps_url: 'https://www.google.com/maps/search/?api=1&query=101+Jack+Martin+Boulevard+Brick+NJ+08724', lat: 40.0534, lng: -74.1068 },
    { slug: 'wendys-7998',     brand: 'wendys',   store_number: '7998',   display_name: 'Brick - Route 70 East',             short_name: 'Route 70 East',    address: '555 New Jersey Highway 70',   city: 'Brick',          state: 'NJ', zip: '08723', maps_url: 'https://www.google.com/maps/search/?api=1&query=555+Route+70+East+Brick+NJ+08723', lat: 40.0557, lng: -74.0977 },
    { slug: 'wendys-8186',     brand: 'wendys',   store_number: '8186',   display_name: 'Point Pleasant - Route 88',         short_name: 'Route 88',         address: '3150 Route 88',               city: 'Point Pleasant', state: 'NJ', zip: '08742', maps_url: 'https://www.google.com/maps/search/?api=1&query=3150+Route+88+Point+Pleasant+NJ+08742', lat: 40.0826, lng: -74.0674 },
    { slug: 'wendys-9530',     brand: 'wendys',   store_number: '9530',   display_name: 'Whiting - Lacey Rd',                short_name: 'Lacey Rd',         address: '450 Lacey Road',              city: 'Whiting',        state: 'NJ', zip: '08759', maps_url: 'https://www.google.com/maps/search/?api=1&query=450+Lacey+Road+Whiting+NJ+08759', lat: 39.9679, lng: -74.1549 },
    { slug: 'wendys-10803',    brand: 'wendys',   store_number: '10803',  display_name: 'Toms River - Route 70',             short_name: 'Route 70 TR',      address: '232 New Jersey Highway 70',   city: 'Toms River',     state: 'NJ', zip: '08755', maps_url: 'https://www.google.com/maps/search/?api=1&query=232+Route+70+Toms+River+NJ+08755', lat: 39.9537, lng: -74.1979 },
    { slug: 'wendys-11389',    brand: 'wendys',   store_number: '11389',  display_name: 'Howell - U.S. 9',                  short_name: 'U.S. 9',           address: '2011 US Route 9',             city: 'Howell',         state: 'NJ', zip: '07731', maps_url: 'https://www.google.com/maps/search/?api=1&query=2011+US+Route+9+Howell+NJ+07731', lat: 40.1640, lng: -74.1968 },
    { slug: 'wendys-13248',    brand: 'wendys',   store_number: '13248',  display_name: 'Eatontown - Route 35 North',        short_name: 'Route 35N',        address: '151 Route 35 North',          city: 'Eatontown',      state: 'NJ', zip: '07724', maps_url: 'https://www.google.com/maps/search/?api=1&query=151+Route+35+North+Eatontown+NJ+07724', lat: 40.2926, lng: -74.0560 },
    { slug: 'wendys-455',      brand: 'wendys',   store_number: '455',    display_name: 'Lansdale - South Broad Street',     short_name: 'S Broad St',       address: '600 South Broad Street',      city: 'Lansdale',       state: 'PA', zip: '19446', maps_url: 'https://www.google.com/maps/search/?api=1&query=600+South+Broad+Street+Lansdale+PA+19446', lat: 40.2415, lng: -75.2835 },
    { slug: 'wendys-527',      brand: 'wendys',   store_number: '527',    display_name: 'Dresher - Limekiln Pike',           short_name: 'Limekiln Pike',    address: '1710 Limekiln Pike',          city: 'Dresher',        state: 'PA', zip: '19025', maps_url: 'https://www.google.com/maps/search/?api=1&query=1710+Limekiln+Pike+Dresher+PA+19025', lat: 40.1376, lng: -75.1666 },
    { slug: 'wendys-1400',     brand: 'wendys',   store_number: '1400',   display_name: 'Horsham - Easton Road',             short_name: 'Easton Rd',        address: '415 Easton Road',             city: 'Horsham',        state: 'PA', zip: '19044', maps_url: 'https://www.google.com/maps/search/?api=1&query=415+Easton+Road+Horsham+PA+19044', lat: 40.1726, lng: -75.1296 },
    { slug: 'wendys-1875',     brand: 'wendys',   store_number: '1875',   display_name: 'Lansdale - Allentown Road',         short_name: 'Allentown Rd',     address: '1758 Allentown Road',         city: 'Lansdale',       state: 'PA', zip: '19446', maps_url: 'https://www.google.com/maps/search/?api=1&query=1758+Allentown+Road+Lansdale+PA+19446', lat: 40.2451, lng: -75.2780 },
    { slug: 'wendys-1879',     brand: 'wendys',   store_number: '1879',   display_name: 'Collegeville - Second Avenue',      short_name: 'Second Ave',       address: '201 Second Avenue',           city: 'Collegeville',   state: 'PA', zip: '19426', maps_url: 'https://www.google.com/maps/search/?api=1&query=201+Second+Avenue+Collegeville+PA+19426', lat: 40.1887, lng: -75.4513 },
    { slug: 'wendys-2084',     brand: 'wendys',   store_number: '2084',   display_name: 'Royersford - Buckwalter Road',      short_name: 'Buckwalter Rd',    address: '70 Buckwalter Road Suite 1050', city: 'Royersford',  state: 'PA', zip: '19468', maps_url: 'https://www.google.com/maps/search/?api=1&query=70+Buckwalter+Road+Royersford+PA+19468', lat: 40.1954, lng: -75.5396 },
    { slug: 'wendys-2230',     brand: 'wendys',   store_number: '2230',   display_name: 'Phoenixville - Township Line Rd',   short_name: 'Township Line Rd', address: '1075 Township Line Road',     city: 'Phoenixville',   state: 'PA', zip: '19460', maps_url: 'https://www.google.com/maps/search/?api=1&query=1075+Township+Line+Road+Phoenixville+PA+19460', lat: 40.1301, lng: -75.5146 },
    { slug: 'wendys-2444',     brand: 'wendys',   store_number: '2444',   display_name: 'Doylestown - N Main Street',        short_name: 'N Main St',        address: '400 North Main Street',       city: 'Doylestown',     state: 'PA', zip: '18901', maps_url: 'https://www.google.com/maps/search/?api=1&query=400+North+Main+Street+Doylestown+PA+18901', lat: 40.3101, lng: -75.1299 },
    { slug: 'wendys-2644',     brand: 'wendys',   store_number: '2644',   display_name: 'Conshohocken - Ridge Pike',         short_name: 'Ridge Pike',       address: '1013 West Ridge Pike',        city: 'Conshohocken',   state: 'PA', zip: '19428', maps_url: 'https://www.google.com/maps/search/?api=1&query=1013+West+Ridge+Pike+Conshohocken+PA+19428', lat: 40.0776, lng: -75.3013 },
    { slug: 'wendys-2686',     brand: 'wendys',   store_number: '2686',   display_name: 'Souderton - Route 113',             short_name: 'Route 113',        address: '752 Souderton Road',          city: 'Souderton',      state: 'PA', zip: '18964', maps_url: 'https://www.google.com/maps/search/?api=1&query=752+Souderton+Road+Souderton+PA+18964', lat: 40.3051, lng: -75.3227 },
    { slug: 'wendys-8612',     brand: 'wendys',   store_number: '8612',   display_name: 'Morrisville - Plaza Blvd',          short_name: 'Plaza Blvd',       address: '227 Plaza Boulevard',         city: 'Morrisville',    state: 'PA', zip: '19067', maps_url: 'https://www.google.com/maps/search/?api=1&query=227+Plaza+Boulevard+Morrisville+PA+19067', lat: 40.2068, lng: -74.7821 },
    { slug: 'wendys-8616',     brand: 'wendys',   store_number: '8616',   display_name: 'Norristown - South Trooper Road',   short_name: 'S Trooper Rd',     address: '590 South Trooper Road',      city: 'Norristown',     state: 'PA', zip: '19403', maps_url: 'https://www.google.com/maps/search/?api=1&query=590+South+Trooper+Road+Norristown+PA+19403', lat: 40.1215, lng: -75.3399 },
    { slug: 'wendys-8617',     brand: 'wendys',   store_number: '8617',   display_name: 'King of Prussia - Henderson Rd',    short_name: 'Henderson Rd',     address: '306 South Henderson Road',    city: 'King of Prussia', state: 'PA', zip: '19406', maps_url: 'https://www.google.com/maps/search/?api=1&query=306+South+Henderson+Road+King+of+Prussia+PA+19406', lat: 40.0878, lng: -75.3950 },
    { slug: 'wendys-11187',    brand: 'wendys',   store_number: '11187',  display_name: 'Norristown - Dekalb Pike',          short_name: 'Dekalb Pike',      address: '2815 Dekalb Pike',            city: 'Norristown',     state: 'PA', zip: '19401', maps_url: 'https://www.google.com/maps/search/?api=1&query=2815+Dekalb+Pike+Norristown+PA+19401', lat: 40.1286, lng: -75.3401 },
    { slug: 'wendys-11188',    brand: 'wendys',   store_number: '11188',  display_name: 'Phoenixville - Egypt Road',         short_name: 'Egypt Rd',         address: '1540 Egypt Road',             city: 'Phoenixville',   state: 'PA', zip: '19460', maps_url: 'https://www.google.com/maps/search/?api=1&query=1540+Egypt+Road+Phoenixville+PA+19460', lat: 40.1302, lng: -75.5148 },
    { slug: 'wendys-11228',    brand: 'wendys',   store_number: '11228',  display_name: 'Exton - Eagleview Blvd',            short_name: 'Eagleview Blvd',   address: '186 Eagleview Boulevard',     city: 'Exton',          state: 'PA', zip: '19341', maps_url: 'https://www.google.com/maps/search/?api=1&query=186+Eagleview+Boulevard+Exton+PA+19341', lat: 40.0293, lng: -75.6341 },
    { slug: 'wendys-11807',    brand: 'wendys',   store_number: '11807',  display_name: 'Hatfield - Bethlehem Pike',         short_name: 'Bethlehem Pike HF', address: '1260 Bethlehem Pike',        city: 'Hatfield',       state: 'PA', zip: '19440', maps_url: 'https://www.google.com/maps/search/?api=1&query=1260+Bethlehem+Pike+Hatfield+PA+19440', lat: 40.2769, lng: -75.2965 },
    { slug: 'wendys-11858',    brand: 'wendys',   store_number: '11858',  display_name: 'Quakertown - W End Blvd',           short_name: 'W End Blvd',       address: '1465 West Broad Street',      city: 'Quakertown',     state: 'PA', zip: '18951', maps_url: 'https://www.google.com/maps/search/?api=1&query=1465+West+Broad+Street+Quakertown+PA+18951', lat: 40.4415, lng: -75.3464 },
    { slug: 'wendys-11971',    brand: 'wendys',   store_number: '11971',  display_name: 'Montgomeryville - Bethlehem Pike',  short_name: 'Bethlehem Pike MV', address: '1010 Bethlehem Pike',        city: 'Montgomeryville', state: 'PA', zip: '18936', maps_url: 'https://www.google.com/maps/search/?api=1&query=1010+Bethlehem+Pike+Montgomeryville+PA+18936', lat: 40.2502, lng: -75.2769 },
    { slug: 'wendys-12335',    brand: 'wendys',   store_number: '12335',  display_name: 'Bristol - Veterans Ave',            short_name: 'Veterans Ave',     address: '3024 New Rodgers Road',       city: 'Bristol',        state: 'PA', zip: '19007', maps_url: 'https://www.google.com/maps/search/?api=1&query=3024+New+Rodgers+Road+Bristol+PA+19007', lat: 40.1015, lng: -74.8566 },
  ]
  ok('locations', await sb.from('locations').upsert(rows, { onConflict: 'slug' }))
}

// ── Get slug → UUID maps ──────────────────────────────────────────
async function getSlugMap() {
  const { data, error } = await sb.from('locations').select('id, slug')
  if (error) { console.error('Failed to fetch locations:', error.message); process.exit(1) }
  return Object.fromEntries(data.map(r => [r.slug, r.id]))
}

async function getLeaseMap(slugMap) {
  const { data, error } = await sb.from('leases').select('id, location_id')
  if (error) { console.error('Failed to fetch leases:', error.message); process.exit(1) }
  // invert slugMap: uuid → slug, then map lease location_id → lease id
  const uuidToSlug = Object.fromEntries(Object.entries(slugMap).map(([k,v]) => [v,k]))
  return Object.fromEntries(data.map(r => [uuidToSlug[r.location_id], r.id]))
}

// ── Leases ────────────────────────────────────────────────────────
async function seedLeases(slugMap) {
  const L = (slug) => slugMap[slug]
  const rows = [
    { location_id: L('wendys-9549'),     lessee: 'Y&C Wen NY LLC',                  lessor: "Poughkeepsie Shopping Center, Inc.", possession_date: '2022-07-01', commencement_date: '2022-07-01', expiry_date: '2034-12-31', term_type: 'NNN', square_footage: 23400,  base_rent_monthly: 12117.15, cam_estimated_monthly: null, pro_rata_share: 10,   status: 'active', extracted_at: '2024-01-01T00:00:00Z' },
    { location_id: L('wendys-11807'),    lessee: 'Y & C Wen PA LLC',                lessor: '309 Plaza LP',                       possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2027-08-01', term_type: 'NNN', square_footage: 2900,   base_rent_monthly: 6211.12,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-2644'),     lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Restaurants of New York, LLC", possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2029-03-31', term_type: 'NNN', square_footage: 1500,   base_rent_monthly: 18137.03, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-2686'),     lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Restaurants of New York, LLC", possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2029-12-31', term_type: 'NNN', square_footage: 1500,   base_rent_monthly: 14766.58, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-8612'),     lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Restaurants of New York, LLC", possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2030-12-31', term_type: 'NNN', square_footage: 1500,   base_rent_monthly: 9888.47,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-2230'),     lessee: 'Y & C Wen PA LLC',                lessor: 'Alpha Realty Management Co',         possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2031-06-01', term_type: 'NNN', square_footage: 1500,   base_rent_monthly: 6286.00,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-8616'),     lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Restaurants of New York, LLC", possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2031-12-31', term_type: 'NNN', square_footage: 3073,   base_rent_monthly: 9658.92,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-8617'),     lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Restaurants of New York, LLC", possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2031-12-31', term_type: 'NNN', square_footage: 1500,   base_rent_monthly: 8750.00,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-11858'),    lessee: 'Y & C Wen PA LLC',                lessor: 'Quakertown Holding Corporation',     possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2032-10-31', term_type: 'NNN', square_footage: 3367,   base_rent_monthly: 7510.41,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-12335'),    lessee: 'Y & C Wen PA LLC',                lessor: 'WP Bristol, LLC',                    possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2032-12-30', term_type: 'NNN', square_footage: 1500,   base_rent_monthly: 8250.00,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-11389'),    lessee: 'Yum and Chill Wen II Holdings LLC', lessor: 'Howell Wen, LLC',                  possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2034-01-31', term_type: 'NNN', square_footage: null,   base_rent_monthly: 7562.50,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-2084'),     lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Restaurants of New York, LLC", possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2034-12-22', term_type: 'NNN', square_footage: 2151,   base_rent_monthly: 14389.38, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-1400'),     lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Properties, LLC",            possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2035-11-30', term_type: 'NNN', square_footage: 1530,   base_rent_monthly: 12724.41, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-455'),      lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Properties, LLC",            possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2035-11-30', term_type: 'NNN', square_footage: 1500,   base_rent_monthly: 16525.05, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-1875'),     lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Properties, LLC",            possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2035-11-30', term_type: 'NNN', square_footage: 1500,   base_rent_monthly: 11234.42, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-13248'),    lessee: 'Yum and Chill Wen II Holdings LLC', lessor: 'Eatontown Wyckoff LLC',            possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2036-02-28', term_type: 'NNN', square_footage: 2565,   base_rent_monthly: 11000.00, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-2444'),     lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Restaurants of New York, LLC", possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2036-06-30', term_type: 'NNN', square_footage: 1500,   base_rent_monthly: 14818.28, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-527'),      lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Properties, LLC",            possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2036-11-01', term_type: 'NNN', square_footage: 2939,   base_rent_monthly: 6234.28,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-11971'),    lessee: 'Y & C Wen PA LLC',                lessor: 'Higher Rock Partners, LP',           possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2036-12-20', term_type: 'NNN', square_footage: 2887,   base_rent_monthly: 11000.00, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-11187'),    lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Restaurants of New York, LLC", possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2037-03-31', term_type: 'NNN', square_footage: 2815,   base_rent_monthly: 14259.65, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-11228'),    lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Restaurants of New York, LLC", possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2037-11-30', term_type: 'NNN', square_footage: 1500,   base_rent_monthly: 8308.67,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-1879'),     lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Restaurants of New York, LLC", possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2037-12-31', term_type: 'NNN', square_footage: 3920,   base_rent_monthly: 6034.08,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-11188'),    lessee: 'Y & C Wen PA LLC',                lessor: "Wendy's Restaurants of New York, LLC", possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2039-03-31', term_type: 'NNN', square_footage: 2046,   base_rent_monthly: 8316.67,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-13589'),    lessee: 'Yum and Chill Wen Holdings LLC',  lessor: 'National Project Resources L.P.',    possession_date: '2022-02-16', commencement_date: '2022-02-16', expiry_date: '2043-12-31', term_type: 'NNN', square_footage: 2160,   base_rent_monthly: 7250.00,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-13569'),    lessee: 'Yum and Chill Wen Holdings LLC',  lessor: 'Gill Petroleum Inc.',               possession_date: '2024-09-01', commencement_date: '2024-09-01', expiry_date: '2044-08-01', term_type: 'NNN', square_footage: null,   base_rent_monthly: 8000.00,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-13406'),    lessee: 'Yum and Chill Wen Holdings LLC',  lessor: 'Newport Auto Service Center Inc.',  possession_date: '2024-09-01', commencement_date: '2024-09-01', expiry_date: '2044-08-31', term_type: 'NNN', square_footage: null,   base_rent_monthly: 11666.05, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-10803'),    lessee: 'Yum and Chill Wen II Holdings LLC', lessor: 'Wen Gabby LLC',                   possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2050-06-30', term_type: 'NNN', square_footage: null,   base_rent_monthly: 13719.99, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-8186'),     lessee: 'Yum and Chill Wen II Holdings LLC', lessor: 'Wen-Chris, Inc.',                 possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2050-06-30', term_type: 'NNN', square_footage: null,   base_rent_monthly: 9836.34,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-9530'),     lessee: 'Yum and Chill Wen II Holdings LLC', lessor: 'Jen Wen, LLC',                    possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2050-06-30', term_type: 'NNN', square_footage: null,   base_rent_monthly: 10835.14, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-5327'),     lessee: 'Yum and Chill Wen II Holdings LLC', lessor: 'Giordano Brick Management Corp.', possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2050-06-30', term_type: 'NNN', square_footage: 2974,   base_rent_monthly: 18547.92, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('wendys-7998'),     lessee: 'Yum and Chill Wen II Holdings LLC', lessor: 'EM-WEN, Inc.',                    possession_date: '2025-06-02', commencement_date: '2025-06-02', expiry_date: '2050-06-30', term_type: 'NNN', square_footage: 1500,   base_rent_monthly: 15293.24, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('tacobell-030685'), lessee: 'Yum and Chill TB Holdings LLC',    lessor: 'Heritage Properties',              possession_date: '2014-05-20', commencement_date: '2014-05-20', expiry_date: '2030-07-31', term_type: 'NNN', square_footage: 2592,   base_rent_monthly: 8961.00,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('tacobell-041966'), lessee: 'Yum and Chill TB Holdings LLC',    lessor: 'Port Authority Trans-Hudson Corporation', possession_date: '2025-01-01', commencement_date: '2025-01-01', expiry_date: '2034-12-01', term_type: 'NNN', square_footage: 1831, base_rent_monthly: 9396.67,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('tacobell-034804'), lessee: 'Yum and Chill TB Holdings LLC',    lessor: 'Levin Properties, L.P.',            possession_date: '2018-02-15', commencement_date: '2018-02-15', expiry_date: '2038-02-28', term_type: 'NNN', square_footage: 8177,   base_rent_monthly: 12156.41, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('tacobell-040323'), lessee: 'Yum and Chill TB Holdings LLC',    lessor: 'Holland, L.L.C.',                   possession_date: '2025-03-01', commencement_date: '2025-03-01', expiry_date: '2041-08-31', term_type: 'NNN', square_footage: null,   base_rent_monthly: 12448.88, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('tacobell-038857'), lessee: 'Yum and Chill TB Holdings LLC',    lessor: '75 Jersey City, LLC',               possession_date: '2021-10-28', commencement_date: '2021-10-28', expiry_date: '2041-11-30', term_type: 'NNN', square_footage: 2100,   base_rent_monthly: 8186.04,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('tacobell-040482'), lessee: 'Yum and Chill TB Holdings LLC',    lessor: 'PMG Eastern Shore, LLC',            possession_date: '2022-01-11', commencement_date: '2022-01-11', expiry_date: '2043-06-30', term_type: 'NNN', square_footage: null,   base_rent_monthly: 9187.11,  cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
    { location_id: L('tacobell-040306'), lessee: 'Yum and Chill TB Holdings LLC',    lessor: 'National Retail Resources L.P.',    possession_date: '2021-11-15', commencement_date: '2021-11-15', expiry_date: '2046-10-31', term_type: 'NNN', square_footage: 2000,   base_rent_monthly: 12321.98, cam_estimated_monthly: null, pro_rata_share: null, status: 'active', extracted_at: '2026-06-14T00:00:00Z' },
  ]

  // Check for unmapped slugs
  const missing = rows.filter(r => !r.location_id).map((_, i) => i)
  if (missing.length) { console.error('Missing location UUIDs at indices:', missing); process.exit(1) }

  ok('leases', await sb.from('leases').upsert(rows, { onConflict: 'location_id' }))
}

// ── Rent Schedule ─────────────────────────────────────────────────
async function seedRentSchedule(leaseMap) {
  const L = (slug) => leaseMap[slug]

  await sb.from('rent_schedule').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const rows = [
    // wendys-9549 — 3-tier
    { lease_id: L('wendys-9549'), period_label: 'Months 1-30 (Jul 2022 - Dec 2024)',   period_start: '2022-07-01', period_end: '2024-12-31', base_rent_monthly: 11091.67, cam_estimated_monthly: null, notes: 'Initial term', sort_order: 1 },
    { lease_id: L('wendys-9549'), period_label: 'Months 31-90 (Jan 2025 - Dec 2029)',  period_start: '2025-01-01', period_end: '2029-12-31', base_rent_monthly: 12117.15, cam_estimated_monthly: null, notes: 'Second tier',  sort_order: 2 },
    { lease_id: L('wendys-9549'), period_label: 'Months 91-150 (Jan 2030 - Dec 2034)', period_start: '2030-01-01', period_end: '2034-12-31', base_rent_monthly: 13420.91, cam_estimated_monthly: null, notes: 'Final tier',   sort_order: 3 },
    // single Base Term for all others
    { lease_id: L('wendys-11807'),    period_label: 'Base Term', period_start: '2025-06-02', period_end: '2027-08-01', base_rent_monthly: 6211.12,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-2644'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2029-03-31', base_rent_monthly: 18137.03, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-2686'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2029-12-31', base_rent_monthly: 14766.58, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-8612'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2030-12-31', base_rent_monthly: 9888.47,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-2230'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2031-06-01', base_rent_monthly: 6286.00,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-8616'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2031-12-31', base_rent_monthly: 9658.92,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-8617'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2031-12-31', base_rent_monthly: 8750.00,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-11858'),    period_label: 'Base Term', period_start: '2025-06-02', period_end: '2032-10-31', base_rent_monthly: 7510.41,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-12335'),    period_label: 'Base Term', period_start: '2025-06-02', period_end: '2032-12-30', base_rent_monthly: 8250.00,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-11389'),    period_label: 'Base Term', period_start: '2025-06-02', period_end: '2034-01-31', base_rent_monthly: 7562.50,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-2084'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2034-12-22', base_rent_monthly: 14389.38, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-1400'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2035-11-30', base_rent_monthly: 12724.41, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-455'),      period_label: 'Base Term', period_start: '2025-06-02', period_end: '2035-11-30', base_rent_monthly: 16525.05, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-1875'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2035-11-30', base_rent_monthly: 11234.42, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-13248'),    period_label: 'Base Term', period_start: '2025-06-02', period_end: '2036-02-28', base_rent_monthly: 11000.00, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-2444'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2036-06-30', base_rent_monthly: 14818.28, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-527'),      period_label: 'Base Term', period_start: '2025-06-02', period_end: '2036-11-01', base_rent_monthly: 6234.28,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-11971'),    period_label: 'Base Term', period_start: '2025-06-02', period_end: '2036-12-20', base_rent_monthly: 11000.00, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-11187'),    period_label: 'Base Term', period_start: '2025-06-02', period_end: '2037-03-31', base_rent_monthly: 14259.65, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-11228'),    period_label: 'Base Term', period_start: '2025-06-02', period_end: '2037-11-30', base_rent_monthly: 8308.67,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-1879'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2037-12-31', base_rent_monthly: 6034.08,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-11188'),    period_label: 'Base Term', period_start: '2025-06-02', period_end: '2039-03-31', base_rent_monthly: 8316.67,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-13589'),    period_label: 'Base Term', period_start: '2022-02-16', period_end: '2043-12-31', base_rent_monthly: 7250.00,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-13569'),    period_label: 'Base Term', period_start: '2024-09-01', period_end: '2044-08-01', base_rent_monthly: 8000.00,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-13406'),    period_label: 'Base Term', period_start: '2024-09-01', period_end: '2044-08-31', base_rent_monthly: 11666.05, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-10803'),    period_label: 'Base Term', period_start: '2025-06-02', period_end: '2050-06-30', base_rent_monthly: 13719.99, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-8186'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2050-06-30', base_rent_monthly: 9836.34,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-9530'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2050-06-30', base_rent_monthly: 10835.14, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-5327'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2050-06-30', base_rent_monthly: 18547.92, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('wendys-7998'),     period_label: 'Base Term', period_start: '2025-06-02', period_end: '2050-06-30', base_rent_monthly: 15293.24, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('tacobell-030685'), period_label: 'Base Term', period_start: '2014-05-20', period_end: '2030-07-31', base_rent_monthly: 8961.00,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('tacobell-041966'), period_label: 'Base Term', period_start: '2025-01-01', period_end: '2034-12-01', base_rent_monthly: 9396.67,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('tacobell-034804'), period_label: 'Base Term', period_start: '2018-02-15', period_end: '2038-02-28', base_rent_monthly: 12156.41, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('tacobell-040323'), period_label: 'Base Term', period_start: '2025-03-01', period_end: '2041-08-31', base_rent_monthly: 12448.88, cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('tacobell-038857'), period_label: 'Base Term', period_start: '2021-10-28', period_end: '2041-11-30', base_rent_monthly: 8186.04,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('tacobell-040482'), period_label: 'Base Term', period_start: '2022-01-11', period_end: '2043-06-30', base_rent_monthly: 9187.11,  cam_estimated_monthly: null, notes: null, sort_order: 1 },
    { lease_id: L('tacobell-040306'), period_label: 'Base Term', period_start: '2021-11-15', period_end: '2046-10-31', base_rent_monthly: 12321.98, cam_estimated_monthly: null, notes: null, sort_order: 1 },
  ]
  ok('rent_schedule', await sb.from('rent_schedule').insert(rows))
}

// ── Critical Dates ────────────────────────────────────────────────
async function seedCriticalDates(leaseMap) {
  const L = (slug) => leaseMap[slug]

  await sb.from('critical_dates').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const rows = [
    { lease_id: L('wendys-9549'), event_type: 'lease_commencement', event_date: '2022-07-01', notice_required_days: null, notes: 'Y&C acquisition. Original commencement: Aug 8, 2014.' },
    { lease_id: L('wendys-9549'), event_type: 'lease_expiration',   event_date: '2034-12-31', notice_required_days: null, notes: 'Primary term expiration' },
    { lease_id: L('wendys-9549'), event_type: 'renewal_deadline',   event_date: '2033-12-01', notice_required_days: 365,  notes: 'Notice deadline to cancel 1st auto-renewal (Jan 1 2035 - Dec 31 2039)' },
    { lease_id: L('wendys-9549'), event_type: 'renewal_deadline',   event_date: '2038-12-01', notice_required_days: 365,  notes: 'Notice deadline to cancel 2nd auto-renewal (Jan 1 2040 - Dec 31 2044)' },
    ...['wendys-11807','wendys-2644','wendys-2686','wendys-8612','wendys-2230','wendys-8616','wendys-8617','wendys-11858','wendys-12335','wendys-11389','wendys-2084','wendys-1400','wendys-455','wendys-1875','wendys-13248','wendys-2444','wendys-527','wendys-11971','wendys-11187','wendys-11228','wendys-1879','wendys-11188','wendys-13589','wendys-13569','wendys-13406','wendys-10803','wendys-8186','wendys-9530','wendys-5327','wendys-7998','tacobell-030685','tacobell-041966','tacobell-034804','tacobell-040323','tacobell-038857','tacobell-040482','tacobell-040306'].flatMap(slug => {
      const dates = {
        'wendys-11807':    ['2025-06-02','2027-08-01'],
        'wendys-2644':     ['2025-06-02','2029-03-31'],
        'wendys-2686':     ['2025-06-02','2029-12-31'],
        'wendys-8612':     ['2025-06-02','2030-12-31'],
        'wendys-2230':     ['2025-06-02','2031-06-01'],
        'wendys-8616':     ['2025-06-02','2031-12-31'],
        'wendys-8617':     ['2025-06-02','2031-12-31'],
        'wendys-11858':    ['2025-06-02','2032-10-31'],
        'wendys-12335':    ['2025-06-02','2032-12-30'],
        'wendys-11389':    ['2025-06-02','2034-01-31'],
        'wendys-2084':     ['2025-06-02','2034-12-22'],
        'wendys-1400':     ['2025-06-02','2035-11-30'],
        'wendys-455':      ['2025-06-02','2035-11-30'],
        'wendys-1875':     ['2025-06-02','2035-11-30'],
        'wendys-13248':    ['2025-06-02','2036-02-28'],
        'wendys-2444':     ['2025-06-02','2036-06-30'],
        'wendys-527':      ['2025-06-02','2036-11-01'],
        'wendys-11971':    ['2025-06-02','2036-12-20'],
        'wendys-11187':    ['2025-06-02','2037-03-31'],
        'wendys-11228':    ['2025-06-02','2037-11-30'],
        'wendys-1879':     ['2025-06-02','2037-12-31'],
        'wendys-11188':    ['2025-06-02','2039-03-31'],
        'wendys-13589':    ['2022-02-16','2043-12-31'],
        'wendys-13569':    ['2024-09-01','2044-08-01'],
        'wendys-13406':    ['2024-09-01','2044-08-31'],
        'wendys-10803':    ['2025-06-02','2050-06-30'],
        'wendys-8186':     ['2025-06-02','2050-06-30'],
        'wendys-9530':     ['2025-06-02','2050-06-30'],
        'wendys-5327':     ['2025-06-02','2050-06-30'],
        'wendys-7998':     ['2025-06-02','2050-06-30'],
        'tacobell-030685': ['2014-05-20','2030-07-31'],
        'tacobell-041966': ['2025-01-01','2034-12-01'],
        'tacobell-034804': ['2018-02-15','2038-02-28'],
        'tacobell-040323': ['2025-03-01','2041-08-31'],
        'tacobell-038857': ['2021-10-28','2041-11-30'],
        'tacobell-040482': ['2022-01-11','2043-06-30'],
        'tacobell-040306': ['2021-11-15','2046-10-31'],
      }
      const [comm, exp] = dates[slug]
      return [
        { lease_id: L(slug), event_type: 'lease_commencement', event_date: comm, notice_required_days: null, notes: slug.startsWith('wendys-1') || slug.includes('1') ? 'Y&C acquisition date' : null },
        { lease_id: L(slug), event_type: 'lease_expiration',   event_date: exp,  notice_required_days: null, notes: 'Primary term expiration' },
      ]
    }),
  ]
  ok('critical_dates', await sb.from('critical_dates').insert(rows))
}

// ── Clauses ───────────────────────────────────────────────────────
async function seedClauses(leaseMap) {
  await sb.from('clauses').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const rows = [
    {
      lease_id: leaseMap['wendys-9549'],
      clause_type: 'cam_cap',
      title: '10% CAM Cap',
      content: "Tenant's proportionate share of Common Area Maintenance charges shall in no event exceed 10% of the total Fixed Annual Rental payable by Tenant for such lease year.",
      page_reference: '§12.3, p.8',
    },
    {
      lease_id: leaseMap['wendys-9549'],
      clause_type: 'audit_right',
      title: '3-Year Audit Window',
      content: "Tenant shall have the right to audit Landlord's books and records relating to Common Area charges within three (3) years following receipt of the annual reconciliation statement.",
      page_reference: '§12.6, p.9',
    },
  ]
  ok('clauses', await sb.from('clauses').insert(rows))
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log('Seeding Y&C Lease Management database...\n')

  await seedBrands()
  await seedLocations()

  const slugMap = await getSlugMap()
  console.log(`  Loaded ${Object.keys(slugMap).length} location UUIDs`)

  await seedLeases(slugMap)

  const leaseMap = await getLeaseMap(slugMap)
  console.log(`  Loaded ${Object.keys(leaseMap).length} lease UUIDs`)

  await seedRentSchedule(leaseMap)
  await seedCriticalDates(leaseMap)
  await seedClauses(leaseMap)

  console.log('\nDone.')
}

main().catch(err => { console.error(err); process.exit(1) })
