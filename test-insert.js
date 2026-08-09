const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gqazjrvzkcsrlocokfjp.supabase.co',
  'sb_publishable_l9VmAx4ufzuJe3lAtzG09A_hJlILg6-'
);

async function testInsert() {
  const { data, error } = await supabase.from('events').insert({
    name: 'Test Event',
    event_date: '2026-08-10',
    event_type: 'Workshop',
    venue: 'Test Venue'
  }).select('id').single();

  console.log('Error:', error);
}

testInsert();
