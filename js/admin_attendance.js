// ============================================================
// ZERO GRAVITY - ATTENDANCE MANAGEMENT MODULE
// ============================================================

let attendanceState = {
  EVENT: {},
  PREP: {}
};

let currentEventId = {
  EVENT: null,
  PREP: null
};

// Get today's date in IST (YYYY-MM-DD)
function getTodayIST() {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(new Date());
  let y, m, d;
  for (let p of parts) {
    if (p.type === 'year') y = p.value;
    if (p.type === 'month') m = p.value;
    if (p.type === 'day') d = p.value;
  }
  return `${y}-${m}-${d}`;
}

const todayIST = getTodayIST();

// Tab Navigation
document.querySelectorAll('.attendance-nav-item').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.attendance-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.attendance-tab-content').forEach(c => c.style.display = 'none');
    
    e.target.classList.add('active');
    const targetId = e.target.getAttribute('data-attendance-target');
    document.getElementById(targetId).style.display = 'block';
    
    if (targetId === 'attendance-event') loadEventAttendanceTab();
    if (targetId === 'attendance-prep') loadPrepAttendanceTab();
    if (targetId === 'attendance-preview') loadPreviewTab();
    if (targetId === 'attendance-history') loadHistoryTab();
  });
});

window.renderAttendance = function() {
  document.getElementById('eventAttendanceDateBanner').textContent = todayIST;
  document.getElementById('prepAttendanceDateBanner').textContent = todayIST;
  loadEventAttendanceTab();
};

// ------------------------------------------------------------
// EVENT ATTENDANCE
// ------------------------------------------------------------
async function loadEventAttendanceTab() {
  const select = document.getElementById('eventAttendanceEventSelect');
  select.innerHTML = '<option value="">Loading...</option>';
  
  try {
    // Only load events happening TODAY
    const { data: events, error } = await sb
      .from('events')
      .select('id, name')
      .lte('event_date', todayIST)
      .gte('end_date', todayIST)
      .order('name');
      
    if (error) throw error;
    
    if (!events || events.length === 0) {
      select.innerHTML = '<option value="">No events scheduled for today</option>';
      document.getElementById('eventAttendanceMarkingArea').style.display = 'none';
      return;
    }
    
    select.innerHTML = '<option value="">Choose an event</option>' + 
      events.map(e => `<option value="${e.id}">${escapeHTML(e.name)}</option>`).join('');
      
  } catch (err) {
    console.error('Error loading today events:', err);
    select.innerHTML = '<option value="">Error loading events</option>';
  }
}

document.getElementById('eventAttendanceEventSelect').addEventListener('change', (e) => {
  const eventId = e.target.value;
  if (eventId) {
    currentEventId.EVENT = eventId;
    loadAttendanceGrid('EVENT', eventId, todayIST, 'eventAttendanceMembersGrid');
  } else {
    document.getElementById('eventAttendanceMarkingArea').style.display = 'none';
  }
});

// ------------------------------------------------------------
// EVENT PREP ATTENDANCE
// ------------------------------------------------------------
async function loadPrepAttendanceTab() {
  const select = document.getElementById('prepAttendanceEventSelect');
  if (select.options.length > 1) return; // already loaded
  
  select.innerHTML = '<option value="">Loading...</option>';
  try {
    const { data: events, error } = await sb
      .from('events')
      .select('id, name')
      .order('event_date', { ascending: false });
      
    if (error) throw error;
    
    select.innerHTML = '<option value="">Choose an event for prep</option>' + 
      (events || []).map(e => `<option value="${e.id}">${escapeHTML(e.name)}</option>`).join('');
  } catch (err) {
    console.error('Error loading prep events:', err);
  }
}

document.getElementById('prepAttendanceEventSelect').addEventListener('change', (e) => {
  const eventId = e.target.value;
  if (eventId) {
    currentEventId.PREP = eventId;
    loadAttendanceGrid('PREP', eventId, todayIST, 'prepAttendanceMembersGrid');
  } else {
    document.getElementById('prepAttendanceMarkingArea').style.display = 'none';
  }
});


// ------------------------------------------------------------
// SHARED ATTENDANCE GRID LOGIC
// ------------------------------------------------------------
async function loadAttendanceGrid(type, eventId, date, tbodyId) {
  const markingAreaId = type === 'EVENT' ? 'eventAttendanceMarkingArea' : 'prepAttendanceMarkingArea';
  document.getElementById(markingAreaId).style.display = 'block';
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading members...</td></tr>';
  
  try {
    const { data: members, error: memErr } = await sb.from('members').select('id, name, department').order('name');
    if (memErr) throw memErr;
    
    const { data: records, error: recErr } = await sb
      .from('attendance')
      .select('member_id, status')
      .eq('event_id', eventId)
      .eq('attendance_date', date)
      .eq('attendance_type', type);
      
    if (recErr) throw recErr;
    
    attendanceState[type] = {};
    (records || []).forEach(r => {
      attendanceState[type][r.member_id] = r.status;
    });
    
    tbody.innerHTML = (members || []).map(m => {
      const status = attendanceState[type][m.id];
      let rowClass = status ? (status === 'present' ? 'bg-present' : 'bg-absent') : '';
      
      return `
        <tr class="${rowClass}" id="row_${type}_${m.id}">
          <td style="font-weight:600;">${escapeHTML(m.name)}</td>
          <td>${escapeHTML(m.department || '-')}</td>
          <td>${escapeHTML(m.year || '-')}</td>
          <td>
            <div style="display:flex; gap:8px;">
              <button class="admin-btn small ${status === 'present' ? '' : 'secondary'}" onclick="setMemberStatus('${type}', '${m.id}', 'present')">Present</button>
              <button class="admin-btn small ${status === 'absent' ? '' : 'secondary'}" style="${status === 'absent' ? 'background:var(--red); border-color:var(--red);' : ''}" onclick="setMemberStatus('${type}', '${m.id}', 'absent')">Absent</button>
              <button class="admin-btn small secondary" onclick="setMemberStatus('${type}', '${m.id}', null)">Clear</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    updateCounters(type, members.length);
    if(type === 'EVENT') updateReminderStatus(eventId, date);
    
  } catch (err) {
    console.error(`Error loading ${type} grid:`, err);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--red);">Failed to load: ${err.message || JSON.stringify(err)}</td></tr>`;
  }
}

window.setMemberStatus = function(type, memberId, status) {
  if (status) {
    attendanceState[type][memberId] = status;
  } else {
    delete attendanceState[type][memberId];
  }
  
  // Update UI row
  const row = document.getElementById(`row_${type}_${memberId}`);
  if (row) {
    row.className = status ? (status === 'present' ? 'bg-present' : 'bg-absent') : '';
    // Re-render buttons in that row
    const btnContainer = row.querySelector('td:last-child div');
    if (btnContainer) {
       btnContainer.innerHTML = `
          <button class="admin-btn small ${status === 'present' ? '' : 'secondary'}" onclick="setMemberStatus('${type}', '${memberId}', 'present')">Present</button>
          <button class="admin-btn small ${status === 'absent' ? '' : 'secondary'}" style="${status === 'absent' ? 'background:var(--red); border-color:var(--red);' : ''}" onclick="setMemberStatus('${type}', '${memberId}', 'absent')">Absent</button>
          <button class="admin-btn small secondary" onclick="setMemberStatus('${type}', '${memberId}', null)">Clear</button>
       `;
    }
  }
  
  updateCounters(type, document.getElementById(type === 'EVENT' ? 'eventAttendanceMembersGrid' : 'prepAttendanceMembersGrid').children.length);
};

function updateCounters(type, totalMembers) {
  const state = attendanceState[type];
  let present = 0;
  let absent = 0;
  
  Object.values(state).forEach(s => {
    if (s === 'present') present++;
    if (s === 'absent') absent++;
  });
  
  const notMarked = totalMembers - (present + absent);
  
  const prefix = type === 'EVENT' ? 'att' : 'prep';
  document.getElementById(`${prefix}CounterTotal`).textContent = totalMembers;
  document.getElementById(`${prefix}CounterPresent`).textContent = present;
  document.getElementById(`${prefix}CounterAbsent`).textContent = absent;
  document.getElementById(`${prefix}CounterNotMarked`).textContent = notMarked;
}

async function updateReminderStatus(eventId, date) {
  try {
    const { data, error } = await sb
      .from('attendance_reminder_state')
      .select('status, reminder_count, last_reminder_at')
      .eq('event_id', eventId)
      .eq('attendance_date', date)
      .eq('attendance_type', 'EVENT')
      .maybeSingle();
      
    if (error) throw error;
    
    const statusDiv = document.getElementById('attReminderStatus');
    if (!data) {
      statusDiv.innerHTML = 'Reminder: Pending Initial Check (8:00 PM)';
      return;
    }
    
    if (data.status === 'completed') {
      statusDiv.innerHTML = '<span style="color:var(--green);">🟢 Attendance Complete (Reminders stopped)</span>';
    } else {
      statusDiv.innerHTML = `<span style="color:var(--yellow);">🟠 Reminders Active (Sent: ${data.reminder_count})</span>`;
    }
  } catch (err) {
    console.error('Reminder status error:', err);
  }
}

// SAVE LOGIC
async function saveAttendance(type) {
  const eventId = currentEventId[type];
  if (!eventId) return;
  
  const btnId = type === 'EVENT' ? 'btnSaveEventAttendance' : 'btnSavePrepAttendance';
  const btn = document.getElementById(btnId);
  btn.disabled = true;
  btn.textContent = 'Saving...';
  
  try {
    // Delete current records for this date/type/event
    await sb.from('attendance')
      .delete()
      .eq('event_id', eventId)
      .eq('attendance_date', todayIST)
      .eq('attendance_type', type);
      
    const records = Object.entries(attendanceState[type]).map(([memberId, status]) => ({
      event_id: eventId,
      member_id: memberId,
      attendance_date: todayIST,
      attendance_type: type,
      status: status
    }));
    
    if (records.length > 0) {
      const { error } = await sb.from('attendance').insert(records);
      if (error) throw error;
    }
    
    await auditLog('save_attendance', 'attendance', eventId, {
      type: type,
      date: todayIST,
      records: records.length
    });
    
    await customAlert('Success', 'Attendance saved successfully.');
    
    if(type === 'EVENT') updateReminderStatus(eventId, todayIST);
    
  } catch (err) {
    console.error('Save attendance error:', err);
    await customAlert('Error', err.message || 'Failed to save attendance');
  } finally {
    btn.disabled = false;
    btn.textContent = type === 'EVENT' ? 'Save Attendance' : 'Save Prep Attendance';
  }
}

document.getElementById('btnSaveEventAttendance').addEventListener('click', () => saveAttendance('EVENT'));
document.getElementById('btnSavePrepAttendance').addEventListener('click', () => saveAttendance('PREP'));

// ------------------------------------------------------------
// CUMULATIVE STATS PREVIEW
// ------------------------------------------------------------
async function loadPreviewTab() {
  const select = document.getElementById('previewEventSelect');
  if (select.options.length > 1) return;
  
  try {
    const { data: events, error } = await sb.from('events').select('id, name').order('name');
    if (error) throw error;
    select.innerHTML = '<option value="">Select Event</option>' + 
      (events || []).map(e => `<option value="${e.id}">${escapeHTML(e.name)}</option>`).join('');
  } catch (err) {
    console.error(err);
  }
}

document.getElementById('previewEventSelect').addEventListener('change', async (e) => {
  const eventId = e.target.value;
  const dateSelect = document.getElementById('previewDateSelect');
  if (!eventId) {
    dateSelect.disabled = true;
    dateSelect.innerHTML = '<option>Select an event first</option>';
    document.getElementById('previewResultsArea').style.display = 'none';
    return;
  }
  
  try {
    const { data, error } = await sb.from('attendance').select('attendance_date').eq('event_id', eventId);
    if (error) throw error;
    
    const uniqueDates = [...new Set(data.map(d => d.attendance_date))].sort();
    
    if (uniqueDates.length === 0) {
      dateSelect.disabled = true;
      dateSelect.innerHTML = '<option>No attendance recorded</option>';
      document.getElementById('previewResultsArea').style.display = 'none';
      return;
    }
    
    dateSelect.disabled = false;
    dateSelect.innerHTML = '<option value="">Select Date</option>' + 
      uniqueDates.map(d => `<option value="${d}">${d}</option>`).join('');
      
  } catch(err) {
    console.error(err);
  }
});

document.getElementById('previewDateSelect').addEventListener('change', async (e) => {
  const date = e.target.value;
  const eventId = document.getElementById('previewEventSelect').value;
  if (!date || !eventId) return;
  
  document.getElementById('previewResultsArea').style.display = 'block';
  const tbody = document.getElementById('previewResultsGrid');
  tbody.innerHTML = '<tr><td colspan="4">Loading stats...</td></tr>';
  
  try {
    const { data: attData, error } = await sb
      .from('attendance')
      .select('member_id, status, attendance_date')
      .eq('event_id', eventId)
      .lte('attendance_date', date);
      
    if (error) throw error;
    
    const { data: members } = await sb.from('members').select('id, name').order('name');
    
    const uniqueDays = [...new Set(attData.map(d => d.attendance_date))].length;
    
    const stats = {};
    members.forEach(m => stats[m.id] = { name: m.name, attended: 0 });
    
    attData.forEach(d => {
      if (d.status === 'present' && stats[d.member_id]) {
        stats[d.member_id].attended++;
      }
    });
    
    tbody.innerHTML = members.map(m => {
      const s = stats[m.id];
      const perc = uniqueDays > 0 ? Math.round((s.attended / uniqueDays) * 100) : 0;
      return `
        <tr>
          <td>${escapeHTML(s.name)}</td>
          <td>${s.attended}</td>
          <td>${uniqueDays}</td>
          <td>${perc}%</td>
        </tr>
      `;
    }).join('');
    
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--red);">Error loading stats</td></tr>';
  }
});

// ------------------------------------------------------------
// HISTORY TAB
// ------------------------------------------------------------
async function loadHistoryTab() {
  const select = document.getElementById('historyEventFilter');
  if (select.options.length <= 1) {
    try {
      const { data: events } = await sb.from('events').select('id, name').order('name');
      select.innerHTML = '<option value="">All Events</option>' + 
        (events || []).map(e => `<option value="${e.id}">${escapeHTML(e.name)}</option>`).join('');
    } catch(e) {}
  }
  
  fetchHistory();
}

document.getElementById('historyTypeFilter').addEventListener('change', fetchHistory);
document.getElementById('historyEventFilter').addEventListener('change', fetchHistory);

async function fetchHistory() {
  const type = document.getElementById('historyTypeFilter').value;
  const eventId = document.getElementById('historyEventFilter').value;
  
  const tbody = document.getElementById('historyResultsGrid');
  tbody.innerHTML = '<tr><td colspan="7">Loading history...</td></tr>';
  
  try {
    let query = sb.from('attendance').select('attendance_date, event_id, attendance_type, status, events(name)');
    if (type) query = query.eq('attendance_type', type);
    if (eventId) query = query.eq('event_id', eventId);
    
    const { data, error } = await query;
    if (error) throw error;
    
    const groups = {};
    data.forEach(r => {
      const key = `${r.attendance_date}_${r.event_id}_${r.attendance_type}`;
      if (!groups[key]) {
        groups[key] = { date: r.attendance_date, event: r.events?.name || 'Unknown', type: r.attendance_type, present:0, absent:0 };
      }
      if (r.status === 'present') groups[key].present++;
      if (r.status === 'absent') groups[key].absent++;
    });
    
    const arr = Object.values(groups).sort((a,b) => b.date.localeCompare(a.date));
    
    if (arr.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No history found</td></tr>';
      return;
    }
    
    tbody.innerHTML = arr.map(g => {
      return `
        <tr>
          <td>${g.date}</td>
          <td>${escapeHTML(g.event)}</td>
          <td>${g.type}</td>
          <td>${g.present}</td>
          <td>${g.absent}</td>
          <td>-</td>
          <td><span style="color:var(--admin-muted);">🔒 Locked</span></td>
        </tr>
      `;
    }).join('');
    
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--red);">Error loading history</td></tr>';
  }
}
