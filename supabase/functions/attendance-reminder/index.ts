import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    // We only accept POST (or allow GET for testing/cron)
    
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get current time in IST
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Asia/Kolkata', 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: 'numeric', minute: 'numeric', hour12: false
    });
    const parts = formatter.formatToParts(now);
    let y, m, d, hr, min;
    for (let p of parts) {
      if (p.type === 'year') y = p.value;
      if (p.type === 'month') m = p.value;
      if (p.type === 'day') d = p.value;
      if (p.type === 'hour') hr = parseInt(p.value);
      if (p.type === 'minute') min = parseInt(p.value);
    }
    const todayIST = `${y}-${m}-${d}`;
    
    // 8 PM is hour 20. Only process if it's between 20:00 and 23:59 IST.
    if (hr < 20) {
      return new Response(JSON.stringify({ message: "Too early. Reminders start at 8:00 PM IST." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const isFinalCheck = (hr === 23 && min >= 45);

    // 1. Get all non-cancelled events happening today
    const { data: events, error: eventsErr } = await supabase
      .from('events')
      .select('id, name, status')
      .neq('status', 'cancelled')
      .lte('event_date', todayIST)
      .gte('end_date', todayIST);
      
    if (eventsErr) throw eventsErr;
    
    if (!events || events.length === 0) {
       return new Response(JSON.stringify({ message: "No events today." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Get total active members
    const { count: memberCount, error: memberErr } = await supabase
      .from('members')
      .select('id', { count: 'exact', head: true });
      
    if (memberErr) throw memberErr;
    
    const logs = [];

    // 3. Check each event
    for (const event of events) {
       // Check attendance records for today
       const { count: markedCount, error: attErr } = await supabase
         .from('attendance')
         .select('id', { count: 'exact', head: true })
         .eq('event_id', event.id)
         .eq('attendance_date', todayIST)
         .eq('attendance_type', 'EVENT');
         
       if (attErr) throw attErr;
       
       const isComplete = (markedCount >= memberCount);
       let status = isComplete ? 'completed' : 'pending';
       if (isFinalCheck && !isComplete) status = 'completed'; // Stop checking after 11:45 PM
       
       // Update or Insert into reminder state
       const { data: stateData } = await supabase
         .from('attendance_reminder_state')
         .select('*')
         .eq('event_id', event.id)
         .eq('attendance_date', todayIST)
         .eq('attendance_type', 'EVENT')
         .maybeSingle();
         
       if (stateData && stateData.status === 'completed') {
         logs.push(`Event ${event.name} already completed.`);
         continue; // skip
       }
       
       let reminderCount = stateData ? stateData.reminder_count : 0;
       
       if (!isComplete && !isFinalCheck) {
         console.log(`[WARNING SYSTEM] ATTENDANCE INCOMPLETE for ${event.name}. Marked: ${markedCount}/${memberCount}`);
         reminderCount++;
       }
       
       if (isFinalCheck && !isComplete) {
         console.log(`[FAILURE] ATTENDANCE FAILED for ${event.name}. Day ended without full attendance.`);
       }
       
       const payload = {
         event_id: event.id,
         attendance_date: todayIST,
         attendance_type: 'EVENT',
         status: status,
         reminder_count: reminderCount,
         last_reminder_at: new Date().toISOString(),
         completed_at: status === 'completed' ? new Date().toISOString() : null
       };
       
       const { error: upsertErr } = await supabase
         .from('attendance_reminder_state')
         .upsert(payload, { onConflict: 'event_id, attendance_date, attendance_type' });
         
       if (upsertErr) throw upsertErr;
       
       logs.push(`Processed ${event.name}: Complete=${isComplete}, Status=${status}, Reminders=${reminderCount}`);
    }

    return new Response(JSON.stringify({ message: "Processed", logs }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})
