// ============================================================
// ZERO GRAVITY — ATTENDANCE MANAGEMENT MODULE (REDESIGNED)
// Event-Driven Architecture
// ============================================================

// Use the global supabase client (declared in admin.js via supabaseClient.js)
// DO NOT re-declare `const sb` — it's already global from admin.js

// State
let attState = {
  EVENT: {},
  PREP: {}
};
let currentAttEvent = { EVENT: null, PREP: null };
let currentAttDate = { EVENT: null, PREP: null };
let cachedActiveMembers = [];
let cachedAllEvents = [];
let attFinalizationCache = {};

// ─────────────────────────────────────────────
// UTILITY: Get today's date in IST (YYYY-MM-DD)
// ─────────────────────────────────────────────
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

function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function formatDateParts(dateStr) {
  if (!dateStr) return { day: '—', month: '' };
  const d = new Date(dateStr + 'T00:00:00');
  return {
    day: d.toLocaleDateString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' }),
    month: d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' })
  };
}

function getEventStatus(event) {
  if (event.status === 'cancelled') return 'cancelled';
  const endDate = event.end_date || event.event_date;
  if (endDate < todayIST) return 'past';
  if (event.event_date > todayIST) return 'upcoming';
  return 'today';
}

// ─────────────────────────────────────────────
// MISSING FUNCTION: Generate prep dates from range
// ─────────────────────────────────────────────
function generatePrepDates(prepStartDate, eventDate) {
  if (!prepStartDate || !eventDate) return [];
  const dates = [];
  const start = new Date(prepStartDate + 'T00:00:00');
  const end = new Date(eventDate + 'T00:00:00');
  const current = new Date(start);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ─────────────────────────────────────────────
// MISSING FUNCTION: Get event display state
// Categorizes events for the dropdown grouping
// ─────────────────────────────────────────────
function getEventDisplayState(event) {
  if (event.status === 'cancelled') return 'CANCELLED';

  const eventDate = event.event_date;

  // Check if attendance has been finalized for the event date
  const finKey = `${event.id}_${eventDate}_EVENT`;
  const isFinalized = attFinalizationCache[finKey] === true;

  if (isFinalized) return 'COMPLETED';
  if (eventDate === todayIST) return 'TODAY';
  if (eventDate > todayIST) return 'UPCOMING';
  
  // If it's past but not finalized, it requires action
  return 'ACTION_REQUIRED';
}

// ─────────────────────────────────────────────
// MISSING FUNCTION: Get lock status for a specific date/type
// ─────────────────────────────────────────────
function getEventLockStatus(eventId, dateStr, type) {
  const key = `${eventId}_${dateStr}_${type}`;
  return attFinalizationCache[key] === true;
}

// ─────────────────────────────────────────────
// TAB NAVIGATION
// ─────────────────────────────────────────────
document.querySelectorAll('.attendance-nav-item').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.attendance-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.attendance-tab-content').forEach(c => c.style.display = 'none');
    e.target.classList.add('active');
    const targetId = e.target.getAttribute('data-attendance-target');
    document.getElementById(targetId).style.display = 'block';

    if (targetId === 'attendance-event') loadEventAttendanceTab();
    if (targetId === 'attendance-prep') loadPrepAttendanceTab();
    if (targetId === 'attendance-history') loadHistoryTab();
  });
});

// ─────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────
window.renderAttendance = async function() {
  const eventSelect = document.getElementById('attEventSelect');
  const prepSelect = document.getElementById('attPrepEventSelect');
  
  try {
    eventSelect.innerHTML = '<option value="">Loading events...</option>';
    if (prepSelect) prepSelect.innerHTML = '<option value="">Loading events...</option>';

    // Pre-fetch events
    const { data: events, error: evtErr } = await sb.from('events')
      .select('id, name, event_date, end_date, status, event_type, prep_start_date, prep_dates')
      .order('event_date', { ascending: false });
    if (evtErr) throw new Error("Events: " + evtErr.message);
    
    cachedAllEvents = (events || []).map(e => {
       if ((!e.prep_dates || e.prep_dates.length === 0) && e.prep_start_date) {
         e.prep_dates = generatePrepDates(e.prep_start_date, e.event_date);
       }
       return e;
    });

    const { data: members, error: memErr } = await sb.from('members')
      .select('id, name, department, role, member_type, status')
      .eq('status', 'active')
      .order('name');
    if (memErr) throw new Error("Members: " + memErr.message);
    cachedActiveMembers = members || [];

    const { data: finData, error: finErr } = await sb.from('attendance_finalization')
      .select('event_id, attendance_date, attendance_type, status');
    if (finErr) throw new Error("Finalization: " + finErr.message);
    
    // Build finalization cache — THIS WAS CORRUPTED IN THE ORIGINAL FILE
    attFinalizationCache = {};
    (finData || []).forEach(f => {
      const key = `${f.event_id}_${f.attendance_date}_${f.attendance_type}`;
      attFinalizationCache[key] = (f.status === 'completed');
    });

    // Default: load the first tab
    loadEventAttendanceTab();

  } catch (err) {
    console.error('Attendance init error:', err);
    eventSelect.innerHTML = '<option value="">Error loading events</option>';
    if (prepSelect) prepSelect.innerHTML = '<option value="">Error loading events</option>';
  }
};

// ─────────────────────────────────────────────
// EVENT ATTENDANCE TAB
// ─────────────────────────────────────────────
async function loadEventAttendanceTab() {
  const select = document.getElementById('attEventSelect');
  const evts = cachedAllEvents.filter(e => e.status !== 'cancelled');

  if (evts.length === 0) {
    select.innerHTML = '<option value="">No events available</option>';
    return;
  }

  const todayEvts = [];
  const actionEvts = [];
  const upcomingEvts = [];
  const completedEvts = [];

  evts.forEach(e => {
    const state = getEventDisplayState(e);
    if (state === 'TODAY') todayEvts.push(e);
    else if (state === 'ACTION_REQUIRED') actionEvts.push(e);
    else if (state === 'UPCOMING') upcomingEvts.push(e);
    else if (state === 'COMPLETED') completedEvts.push(e);
  });

  let optionsHtml = '<option value="">Choose an event</option>';
  
  if (todayEvts.length > 0) {
    optionsHtml += '<optgroup label="Today\'s Events">';
    todayEvts.forEach(e => optionsHtml += `<option value="${e.id}">⚡ ${escapeHTML(e.name)}</option>`);
    optionsHtml += '</optgroup>';
  }
  if (actionEvts.length > 0) {
    optionsHtml += '<optgroup label="Action Required (Past &amp; Unsubmitted)">';
    actionEvts.forEach(e => optionsHtml += `<option value="${e.id}">⚠ ${escapeHTML(e.name)} (${formatDateDisplay(e.event_date)})</option>`);
    optionsHtml += '</optgroup>';
  }
  if (upcomingEvts.length > 0) {
    optionsHtml += '<optgroup label="Upcoming Events">';
    upcomingEvts.forEach(e => optionsHtml += `<option value="${e.id}">🔒 ${escapeHTML(e.name)} (${formatDateDisplay(e.event_date)})</option>`);
    optionsHtml += '</optgroup>';
  }
  if (completedEvts.length > 0) {
    optionsHtml += '<optgroup label="Completed &amp; Locked">';
    completedEvts.forEach(e => optionsHtml += `<option value="${e.id}">✓ ${escapeHTML(e.name)} (${formatDateDisplay(e.event_date)})</option>`);
    optionsHtml += '</optgroup>';
  }

  if (todayEvts.length === 0 && actionEvts.length === 0 && upcomingEvts.length === 0 && completedEvts.length === 0) {
    optionsHtml = '<option value="">No active events</option>';
  }

  select.innerHTML = optionsHtml;
}

// Event selection handler
document.getElementById('attEventSelect').addEventListener('change', async (e) => {
  const eventId = e.target.value;
  const dateText = document.getElementById('attEventDateText');
  const badge = document.getElementById('attEventStatusBadge');
  const markingArea = document.getElementById('attEventMarkingArea');
  const lockedArea = document.getElementById('attEventLockedArea');
  const cancelledArea = document.getElementById('attEventCancelledArea');

  markingArea.style.display = 'none';
  lockedArea.style.display = 'none';
  cancelledArea.style.display = 'none';

  if (!eventId) {
    dateText.textContent = 'Select an event';
    badge.style.display = 'none';
    return;
  }

  const evt = cachedAllEvents.find(ev => ev.id === eventId);
  if (!evt) return;

  const eventDate = evt.event_date;
  dateText.textContent = formatDateDisplay(eventDate);
  badge.style.display = 'inline-flex';

  const state = getEventDisplayState(evt);

  if (evt.status === 'cancelled') {
    badge.className = 'att-badge att-badge-cancelled';
    badge.textContent = 'Cancelled';
    cancelledArea.style.display = 'block';
    return;
  }

  if (state === 'UPCOMING') {
    badge.className = 'att-badge att-badge-upcoming';
    badge.textContent = 'Upcoming';
    document.getElementById('attEventLockedMessage').innerHTML =
      `🔒 Attendance opens on ${formatDateDisplay(eventDate)}.`;
    lockedArea.style.display = 'block';
    return;
  }
  
  if (state === 'COMPLETED') {
    badge.className = 'att-badge att-badge-completed';
    badge.textContent = '✓ Locked';
    document.getElementById('attEventLockedMessage').innerHTML =
      `🔒 Attendance has been submitted and locked.<br><br><button class="admin-btn admin-btn-outline" onclick="document.querySelector('[data-attendance-target=\\'attendance-history\\']').click();">View in History</button>`;
    lockedArea.style.display = 'block';
    return;
  }

  if (state === 'TODAY') {
    badge.className = 'att-badge att-badge-pending';
    badge.textContent = 'Today (Open)';
  } else if (state === 'ACTION_REQUIRED') {
    badge.className = 'att-badge att-badge-danger';
    badge.textContent = '⚠ Action Required';
  }

  currentAttEvent.EVENT = eventId;
  currentAttDate.EVENT = eventDate;
  markingArea.style.display = 'block';
  await loadAttendanceGrid('EVENT', eventId, eventDate, 'attEvtMembersGrid');
});

// ─────────────────────────────────────────────
// PREP ATTENDANCE TAB
// ─────────────────────────────────────────────
async function loadPrepAttendanceTab() {
  const select = document.getElementById('attPrepEventSelect');
  const dateSelect = document.getElementById('attPrepDateSelect');
  
  // Always default to today's date
  if (!dateSelect.value) {
    dateSelect.value = todayIST;
  }
  
  // Filter out cancelled and past events
  const evtsWithPrep = cachedAllEvents.filter(e => {
    const endDate = e.end_date || e.event_date;
    return e.status !== 'cancelled' && endDate >= todayIST;
  });

  if (evtsWithPrep.length === 0) {
    select.innerHTML = '<option value="">No upcoming events for prep</option>';
    return;
  }

  select.innerHTML = '<option value="">Choose an upcoming event</option>' +
    evtsWithPrep.map(e => `<option value="${e.id}">${escapeHTML(e.name)}</option>`).join('');
}

document.getElementById('attPrepEventSelect').addEventListener('change', (e) => {
  const eventId = e.target.value;
  const dateSelect = document.getElementById('attPrepDateSelect');
  const noDates = document.getElementById('attPrepNoDates');
  const markingArea = document.getElementById('attPrepMarkingArea');
  const lockedArea = document.getElementById('attPrepLockedArea');
  const cancelledArea = document.getElementById('attPrepCancelledArea');

  noDates.style.display = 'none';
  markingArea.style.display = 'none';
  if(lockedArea) lockedArea.style.display = 'none';
  if(cancelledArea) cancelledArea.style.display = 'none';

  if (!eventId) {
    dateSelect.disabled = true;
    dateSelect.value = todayIST;
    return;
  }

  const evt = cachedAllEvents.find(ev => ev.id === eventId);
  if (!evt) return;

  // Allow date selection till the event date
  dateSelect.disabled = false;
  dateSelect.max = evt.event_date;
  
  // Set default to today (or event date if today is somehow past it)
  dateSelect.value = (todayIST <= evt.event_date) ? todayIST : evt.event_date; 
  
  currentAttEvent.PREP = eventId;
  
  // Auto-load grid for the default date
  dateSelect.dispatchEvent(new Event('change'));
});

document.getElementById('attPrepDateSelect').addEventListener('change', async (e) => {
  const date = e.target.value;
  const eventId = currentAttEvent.PREP;
  const markingArea = document.getElementById('attPrepMarkingArea');
  const lockedArea = document.getElementById('attPrepLockedArea');
  
  if(lockedArea) lockedArea.style.display = 'none';
  markingArea.style.display = 'none';

  if (!eventId || !date) {
    return;
  }
  
  const isPast = date < todayIST;
  const isToday = date === todayIST;
  const isFuture = date > todayIST;
  const isLocked = getEventLockStatus(eventId, date, 'PREP');

  const state = isLocked ? 'COMPLETED' : (isPast ? 'ACTION_REQUIRED' : (isToday ? 'TODAY' : 'UPCOMING'));

  if (state === 'UPCOMING') {
    if(lockedArea) {
      document.getElementById('attPrepLockedMessage').textContent = `Attendance opens on ${formatDateDisplay(date)}.`;
      lockedArea.style.display = 'block';
    }
    return;
  }
  
  if (state === 'COMPLETED') {
    if(lockedArea) {
      document.getElementById('attPrepLockedMessage').innerHTML = `Attendance has been submitted and locked.<br><br><button class="admin-btn admin-btn-outline" onclick="document.querySelector('[data-attendance-target=\\'attendance-history\\']').click();">View in History</button>`;
      lockedArea.style.display = 'block';
    }
    return;
  }

  currentAttDate.PREP = date;
  markingArea.style.display = 'block';
  await loadAttendanceGrid('PREP', eventId, date, 'attPrepMembersGrid');
});

// ─────────────────────────────────────────────
// SHARED: LOAD ATTENDANCE GRID
// ─────────────────────────────────────────────
async function loadAttendanceGrid(type, eventId, date, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;"><div class="att-loading"><div class="admin-spinner"></div><span>Loading members...</span></div></td></tr>';

  try {
    const members = cachedActiveMembers;

    // Fetch existing attendance records
    const { data: records, error } = await sb.from('attendance')
      .select('member_id, status')
      .eq('event_id', eventId)
      .eq('attendance_date', date)
      .eq('attendance_type', type);
    if (error) throw error;

    // Check finalization status
    const { data: finData } = await sb.from('attendance_finalization')
      .select('status')
      .eq('event_id', eventId)
      .eq('attendance_date', date)
      .eq('attendance_type', type)
      .maybeSingle();

    const isFinalized = finData?.status === 'completed';
    attFinalizationCache[`${eventId}_${date}_${type}`] = isFinalized;

    // Build state
    attState[type] = {};
    (records || []).forEach(r => {
      attState[type][r.member_id] = r.status;
    });

    // Populate department filter
    if (type === 'EVENT') {
      const depts = [...new Set(members.map(m => m.department).filter(Boolean))].sort();
      const deptSelect = document.getElementById('attEvtFilterDept');
      if (deptSelect) {
        deptSelect.innerHTML = '<option value="">All Departments</option>' +
          depts.map(d => `<option value="${d}">${escapeHTML(d)}</option>`).join('');
      }
    }

    renderMemberRows(type, members, tbodyId, isFinalized);
    updateCounters(type, members.length);
    updateActionButtons(type, members.length, isFinalized);

  } catch (err) {
    console.error(`Error loading ${type} grid:`, err);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--admin-danger);">Unable to load attendance: ${err.message || 'Unknown error'}<br><br><button class="admin-btn small" onclick="loadAttendanceGrid('${type}', '${eventId}', '${date}', '${tbodyId}')">Retry</button></td></tr>`;
  }
}

function renderMemberRows(type, members, tbodyId, isFinalized) {
  const tbody = document.getElementById(tbodyId);

  // Apply filters (EVENT tab only)
  let filtered = [...members];
  if (type === 'EVENT') {
    const search = (document.getElementById('attEvtSearch')?.value || '').toLowerCase();
    const deptFilter = document.getElementById('attEvtFilterDept')?.value || '';
    const statusFilter = document.getElementById('attEvtFilterStatus')?.value || '';

    if (search) filtered = filtered.filter(m => m.name.toLowerCase().includes(search));
    if (deptFilter) filtered = filtered.filter(m => m.department === deptFilter);
    if (statusFilter) {
      filtered = filtered.filter(m => {
        const s = attState[type][m.id];
        if (statusFilter === 'pending') return !s;
        return s === statusFilter;
      });
    }
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="att-empty-state"><h4>No members found</h4><p>Try adjusting your filters.</p></td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(m => {
    const status = attState[type][m.id];
    let rowClass = status ? (status === 'present' ? 'bg-present' : 'bg-absent') : '';

    const disabledAttr = isFinalized ? 'disabled' : '';
    const disabledStyle = isFinalized ? 'opacity:0.5; pointer-events:none;' : '';
    
    // Admin Correction Button for locked sessions
    const eventId = type === 'EVENT' ? currentAttEvent.EVENT : currentAttEvent.PREP;
    const dateStr = type === 'EVENT' ? currentAttDate.EVENT : currentAttDate.PREP;
    const correctBtn = isFinalized 
      ? `<button class="admin-btn small" style="margin-left:16px;" onclick="promptAdminCorrection('${type}', '${eventId}', '${dateStr}', '${m.id}', '${escapeHTML(m.name)}', '${status || 'none'}')">✏️ Correct</button>` 
      : '';

    return `
      <tr class="${rowClass}" id="row_${type}_${m.id}">
        <td style="font-weight:600;">${escapeHTML(m.name)}</td>
        <td>${escapeHTML(m.department || '—')}</td>
        <td>${escapeHTML(m.member_type || '—')}</td>
        <td>
          <div style="display:flex; gap:8px; align-items:center;">
            <div style="display:flex; gap:8px; ${disabledStyle}">
              <button class="admin-btn small ${status === 'present' ? '' : 'secondary'}" ${disabledAttr} onclick="setMemberStatus('${type}', '${m.id}', 'present')">Present</button>
              <button class="admin-btn small ${status === 'absent' ? '' : 'secondary'}" style="${status === 'absent' ? 'background:var(--admin-danger); border-color:var(--admin-danger);' : ''}" ${disabledAttr} onclick="setMemberStatus('${type}', '${m.id}', 'absent')">Absent</button>
            </div>
            ${correctBtn}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ─────────────────────────────────────────────
// MEMBER STATUS MANAGEMENT
// ─────────────────────────────────────────────
window.setMemberStatus = function(type, memberId, status) {
  if (status) {
    attState[type][memberId] = status;
  } else {
    delete attState[type][memberId];
  }

  // Update UI row
  const row = document.getElementById(`row_${type}_${memberId}`);
  if (row) {
    row.className = status ? (status === 'present' ? 'bg-present' : 'bg-absent') : '';
    const btnContainer = row.querySelector('td:last-child div div');
    if (btnContainer) {
      btnContainer.innerHTML = `
        <button class="admin-btn small ${status === 'present' ? '' : 'secondary'}" onclick="setMemberStatus('${type}', '${memberId}', 'present')">Present</button>
        <button class="admin-btn small ${status === 'absent' ? '' : 'secondary'}" style="${status === 'absent' ? 'background:var(--admin-danger); border-color:var(--admin-danger);' : ''}" onclick="setMemberStatus('${type}', '${memberId}', 'absent')">Absent</button>
      `;
    }
  }

  const totalMembers = cachedActiveMembers.length;
  updateCounters(type, totalMembers);
  updateActionButtons(type, totalMembers, false);
};

// ─────────────────────────────────────────────
// BULK ACTIONS
// ─────────────────────────────────────────────
function markAllMembers(type, status) {
  const key = `${currentAttEvent[type]}_${currentAttDate[type]}_${type}`;
  if (attFinalizationCache[key]) {
    customAlert('Attendance has been finalized and cannot be modified.', 'Locked');
    return;
  }

  cachedActiveMembers.forEach(m => {
    if (status) {
      attState[type][m.id] = status;
    } else {
      delete attState[type][m.id];
    }
  });

  const tbodyId = type === 'EVENT' ? 'attEvtMembersGrid' : 'attPrepMembersGrid';
  renderMemberRows(type, cachedActiveMembers, tbodyId, false);
  updateCounters(type, cachedActiveMembers.length);
  updateActionButtons(type, cachedActiveMembers.length, false);
}

// Event Attendance buttons
document.getElementById('btnAttEvtPresentAll').addEventListener('click', () => markAllMembers('EVENT', 'present'));
document.getElementById('btnAttEvtClearAll').addEventListener('click', () => markAllMembers('EVENT', null));

// Prep Attendance buttons
document.getElementById('btnAttPrepPresentAll').addEventListener('click', () => markAllMembers('PREP', 'present'));
document.getElementById('btnAttPrepClearAll').addEventListener('click', () => markAllMembers('PREP', null));

// ─────────────────────────────────────────────
// COUNTERS
// ─────────────────────────────────────────────
function updateCounters(type, totalMembers) {
  const state = attState[type];
  let present = 0, absent = 0;
  Object.values(state).forEach(s => {
    if (s === 'present') present++;
    if (s === 'absent') absent++;
  });
  const notMarked = totalMembers - (present + absent);

  const prefix = type === 'EVENT' ? 'attEvt' : 'attPrep';
  document.getElementById(`${prefix}Total`).textContent = totalMembers;
  document.getElementById(`${prefix}Present`).textContent = present;
  document.getElementById(`${prefix}Absent`).textContent = absent;
  document.getElementById(`${prefix}NotMarked`).textContent = notMarked;
}

function updateActionButtons(type, totalMembers, isFinalized) {
  const saveId = type === 'EVENT' ? 'btnAttEvtSave' : 'btnAttPrepSave';
  const presentAllId = type === 'EVENT' ? 'btnAttEvtPresentAll' : 'btnAttPrepPresentAll';
  const clearAllId = type === 'EVENT' ? 'btnAttEvtClearAll' : 'btnAttPrepClearAll';
  
  const saveBtn = document.getElementById(saveId);
  const pBtn = document.getElementById(presentAllId);
  const cBtn = document.getElementById(clearAllId);

  if (isFinalized) {
    saveBtn.style.display = 'none';
    pBtn.style.display = 'none';
    cBtn.style.display = 'none';
    return;
  }

  saveBtn.style.display = '';
  pBtn.style.display = '';
  cBtn.style.display = '';
}

// ─────────────────────────────────────────────
// SEARCH/FILTER (Event Attendance)
// ─────────────────────────────────────────────
['attEvtSearch', 'attEvtFilterDept', 'attEvtFilterStatus'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => {
      const key = `${currentAttEvent.EVENT}_${currentAttDate.EVENT}_EVENT`;
      const isFinalized = attFinalizationCache[key] || false;
      renderMemberRows('EVENT', cachedActiveMembers, 'attEvtMembersGrid', isFinalized);
    });
    el.addEventListener('change', () => {
      const key = `${currentAttEvent.EVENT}_${currentAttDate.EVENT}_EVENT`;
      const isFinalized = attFinalizationCache[key] || false;
      renderMemberRows('EVENT', cachedActiveMembers, 'attEvtMembersGrid', isFinalized);
    });
  }
});

// ─────────────────────────────────────────────
// SAVE ATTENDANCE
// ─────────────────────────────────────────────
async function saveAttendance(type) {
  const eventId = currentAttEvent[type];
  const targetDate = currentAttDate[type];
  if (!eventId || !targetDate) return;

  const totalMembers = cachedActiveMembers.length;
  const marked = Object.keys(attState[type]).length;

  // Validate event
  const evt = cachedAllEvents.find(e => e.id === eventId);
  if (!evt) { await customAlert('Event not found.', 'Error'); return; }
  if (evt.status === 'cancelled') { await customAlert('Cannot mark attendance for cancelled events.', 'Error'); return; }



  // Prevent partial submission
  if (marked < totalMembers && totalMembers > 0) {
    await customAlert(`Please mark all ${totalMembers} members (Present or Absent) before saving.`, 'Incomplete');
    return;
  }

  const confirmed = await customConfirm(
    `This will submit and lock attendance for ${formatDateDisplay(targetDate)}. Once saved, modifications will require an Admin Correction. Save now?`,
    'Save Attendance'
  );
  if (!confirmed) return;

  const btnId = type === 'EVENT' ? 'btnAttEvtSave' : 'btnAttPrepSave';
  const btn = document.getElementById(btnId);
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const records = Object.entries(attState[type]).map(([memberId, status]) => ({
      event_id: eventId,
      member_id: memberId,
      attendance_date: targetDate,
      attendance_type: type,
      status: status
    }));

    if (records.length === 0 && totalMembers > 0) {
      await customAlert('No records to save.', 'Error');
      return;
    }

    // 1. Insert records
    if (records.length > 0) {
      const { error } = await sb.from('attendance')
        .upsert(records, { onConflict: 'event_id,member_id,attendance_date,attendance_type' });
      if (error) throw error;
    }

    // 2. Insert Finalization Lock
    const { error: finError } = await sb.from('attendance_finalization')
      .upsert({
        event_id: eventId,
        attendance_date: targetDate,
        attendance_type: type,
        status: 'completed',
        total_members: totalMembers,
        present_count: Object.values(attState[type]).filter(s => s === 'present').length,
        absent_count: Object.values(attState[type]).filter(s => s === 'absent').length,
        finalized_at: new Date().toISOString()
      }, {
        onConflict: 'event_id,attendance_date,attendance_type'
      });
    if (finError) throw finError;

    // 3. Mark Reminders Complete
    await sb.from('attendance_reminder_state')
      .upsert({
        event_id: eventId,
        attendance_date: targetDate,
        attendance_type: type,
        status: 'completed',
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'event_id,attendance_date,attendance_type'
      });

    await auditLog('submit_attendance', 'attendance', eventId, { type, date: targetDate, members: totalMembers });

    btn.textContent = 'Saved ✓';
    btn.classList.add('att-btn-finalize');
    
    // Show success toast
    if (window.showToast) window.showToast(`Attendance saved and locked for ${formatDateDisplay(targetDate)}`, 'success');
    
    setTimeout(() => {
      // Update cache and re-trigger UI state change
      attFinalizationCache[`${eventId}_${targetDate}_${type}`] = true;
      
      if (type === 'EVENT') {
        loadEventAttendanceTab().then(() => {
          document.getElementById('attEventSelect').value = eventId;
          document.getElementById('attEventSelect').dispatchEvent(new Event('change'));
        });
      } else {
        const dateSelect = document.getElementById('attPrepDateSelect');
        const opt = Array.from(dateSelect.options).find(o => o.value === targetDate);
        if (opt) opt.setAttribute('data-state', 'COMPLETED');
        dateSelect.dispatchEvent(new Event('change'));
      }
    }, 1500);

  } catch (err) {
    console.error('Save error:', err);
    await customAlert(err.message || 'Failed to save attendance.', 'Error');
    btn.disabled = false;
    btn.textContent = type === 'EVENT' ? 'Save Attendance' : 'Save Prep Attendance';
  }
}

document.getElementById('btnAttEvtSave').addEventListener('click', () => saveAttendance('EVENT'));
document.getElementById('btnAttPrepSave').addEventListener('click', () => saveAttendance('PREP'));

// ─────────────────────────────────────────────
// ADMIN CORRECTION
// ─────────────────────────────────────────────
window.promptAdminCorrection = async function(type, eventId, dateStr, memberId, memberName, oldStatus) {
  const newStatus = oldStatus === 'present' ? 'absent' : (oldStatus === 'absent' ? 'present' : 'present');
  
  const confirmed = await customConfirm(
    `Admin Correction for ${memberName}\nCurrent status: ${oldStatus}\nNew status will be: ${newStatus}\n\nThis will be logged in the audit trail. Continue?`,
    'Admin Correction'
  );
  if (!confirmed) return;

  // Use a simple prompt for the reason — will be replaced with a proper modal in Phase 3
  const reason = prompt('Please enter a reason for this correction (required):');
  if (reason === null) return;
  if (!reason.trim()) {
    await customAlert('A reason is required for Admin Corrections.', 'Reason Required');
    return;
  }

  try {
    const { error } = await sb.from('attendance')
      .upsert({
        event_id: eventId,
        member_id: memberId,
        attendance_date: dateStr,
        attendance_type: type,
        status: newStatus,
        correction_reason: reason.trim()
      }, { onConflict: 'event_id,member_id,attendance_date,attendance_type' });
      
    if (error) throw error;
    
    await auditLog('admin_correction', 'attendance', eventId, {
      memberId, memberName, dateStr, type, oldStatus, newStatus, reason
    });
    
    // Recalculate finalization counts
    const { data: finData } = await sb.from('attendance_finalization')
      .select('id, present_count, absent_count')
      .eq('event_id', eventId).eq('attendance_date', dateStr).eq('attendance_type', type)
      .single();
      
    if (finData) {
      let pDiff = 0, aDiff = 0;
      if (oldStatus === 'present') pDiff = -1;
      else if (oldStatus === 'absent') aDiff = -1;
      
      if (newStatus === 'present') pDiff += 1;
      else if (newStatus === 'absent') aDiff += 1;
      
      await sb.from('attendance_finalization').update({
        present_count: finData.present_count + pDiff,
        absent_count: finData.absent_count + aDiff
      }).eq('id', finData.id);
    }
    
    if (window.showToast) window.showToast(`Correction applied: ${memberName} → ${newStatus}`, 'success');
    
    // Reload UI
    const tbodyId = type === 'EVENT' ? 'attEvtMembersGrid' : 'attPrepMembersGrid';
    await loadAttendanceGrid(type, eventId, dateStr, tbodyId);
    
  } catch (err) {
    console.error('Correction error:', err);
    await customAlert('Failed to apply correction: ' + (err.message || 'Unknown error'), 'Error');
  }
};


// ─────────────────────────────────────────────
// HISTORY TAB
// ─────────────────────────────────────────────
async function loadHistoryTab() {
  // Populate event filter
  const eventFilter = document.getElementById('attHistoryEventFilter');
  if (eventFilter.options.length <= 1) {
    eventFilter.innerHTML = '<option value="">All Events</option>' +
      cachedAllEvents.map(e => `<option value="${e.id}">${escapeHTML(e.name)}</option>`).join('');
  }

  fetchHistory();
}

document.getElementById('attHistoryTypeFilter').addEventListener('change', fetchHistory);
document.getElementById('attHistoryEventFilter').addEventListener('change', fetchHistory);
document.getElementById('attHistoryStatusFilter').addEventListener('change', fetchHistory);

async function fetchHistory() {
  const typeFilter = document.getElementById('attHistoryTypeFilter').value;
  const eventFilter = document.getElementById('attHistoryEventFilter').value;
  const statusFilter = document.getElementById('attHistoryStatusFilter').value;

  const container = document.getElementById('attHistoryList');
  container.innerHTML = '<div class="att-loading"><div class="admin-spinner"></div><span>Loading history...</span></div>';

  try {
    let query = sb.from('attendance')
      .select('attendance_date, event_id, attendance_type, status, events(name, event_type, status)');
    if (typeFilter) query = query.eq('attendance_type', typeFilter);
    if (eventFilter) query = query.eq('event_id', eventFilter);

    const { data, error } = await query;
    if (error) throw error;

    // Fetch finalization records
    const { data: finData } = await sb.from('attendance_finalization')
      .select('event_id, attendance_date, attendance_type, status');

    const finMap = {};
    (finData || []).forEach(f => {
      finMap[`${f.event_id}_${f.attendance_date}_${f.attendance_type}`] = f.status;
    });

    // Group by event/date/type
    const groups = {};
    (data || []).forEach(r => {
      const key = `${r.attendance_date}_${r.event_id}_${r.attendance_type}`;
      if (!groups[key]) {
        groups[key] = {
          date: r.attendance_date,
          eventId: r.event_id,
          event: r.events?.name || 'Unknown',
          eventType: r.events?.event_type || '',
          eventStatus: r.events?.status || 'upcoming',
          type: r.attendance_type,
          present: 0,
          absent: 0
        };
      }
      if (r.status === 'present') groups[key].present++;
      if (r.status === 'absent') groups[key].absent++;
    });

    let arr = Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));

    // Apply status filter
    if (statusFilter) {
      arr = arr.filter(g => {
        let finStatus = finMap[`${g.eventId}_${g.date}_${g.type}`] || 'pending';
        return finStatus === statusFilter;
      });
    }

    if (arr.length === 0) {
      container.innerHTML = '<div class="att-empty-state"><div class="icon">📋</div><h4>No Attendance History</h4><p>No attendance records found.</p></div>';
      return;
    }

    container.innerHTML = arr.map(g => {
      const dateParts = formatDateParts(g.date);
      let finStatus = finMap[`${g.eventId}_${g.date}_${g.type}`] || 'pending';
      
      const total = g.present + g.absent;
      const badge = finStatus === 'completed'
        ? '<span class="att-badge att-badge-completed">Completed</span>'
        : '<span class="att-badge att-badge-pending">Pending</span>';
      const typeBadge = g.type === 'EVENT'
        ? '<span style="font-size:11px; color:var(--admin-primary);">EVENT</span>'
        : '<span style="font-size:11px; color:var(--admin-warning);">PREP</span>';
      const cancelledBadge = g.eventStatus === 'cancelled'
        ? ' <span class="att-badge att-badge-cancelled" style="font-size:9px;">Cancelled</span>' : '';

      return `
        <div class="att-event-row">
          <div class="att-event-row-info">
            <div class="att-event-row-date">
              <div class="day">${dateParts.day}</div>
              <div class="month">${dateParts.month}</div>
            </div>
            <div class="att-event-row-details">
              <div class="name">${escapeHTML(g.event)}${cancelledBadge}</div>
              <div class="type">${typeBadge} • ${escapeHTML(g.eventType)}</div>
            </div>
          </div>
          <div class="att-event-row-stats">
            <span class="count" style="color:var(--admin-success);">${g.present}P</span>
            <span class="count" style="color:var(--admin-danger);">${g.absent}A</span>
            ${badge}
            <button class="admin-action-btn delete" style="margin-left:8px; padding:4px 8px; font-size:11px;" onclick="deleteAttendanceHistory('${g.eventId}', '${g.date}', '${g.type}')">Delete</button>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    console.error('History error:', err);
    container.innerHTML = '<div class="att-empty-state"><div class="icon">⚠️</div><h4>Error</h4><p>Unable to load attendance history.</p><br><button class="admin-btn small" onclick="fetchHistory()">Retry</button></div>';
  }
}

window.deleteAttendanceHistory = async function(eventId, date, type) {
  if (!(await customConfirm('Are you sure you want to permanently delete this attendance record? This will remove all member attendance data for this specific day. This action cannot be undone.', 'Delete Record'))) return;

  try {
    // Delete individual attendance records
    let { error: err1 } = await sb.from('attendance')
      .delete()
      .eq('event_id', eventId)
      .eq('attendance_date', date)
      .eq('attendance_type', type);
    if (err1) throw err1;

    // Delete finalization record
    let { error: err2 } = await sb.from('attendance_finalization')
      .delete()
      .eq('event_id', eventId)
      .eq('attendance_date', date)
      .eq('attendance_type', type);
    if (err2) throw err2;

    await auditLog('delete_attendance_history', 'attendance', eventId, { type, date });
    
    if (window.showToast) window.showToast('Attendance record deleted', 'success');
    
    // Refresh history
    await fetchHistory();

  } catch (err) {
    console.error('Failed to delete history:', err);
    await customAlert('Failed to delete attendance record: ' + (err.message || 'Unknown error'), 'Error');
  }
};

// ─────────────────────────────────────────────
// AUDIT LOG HELPER (local to this module)
// ─────────────────────────────────────────────
async function auditLog(action, resourceType, resourceId, metadata) {
  try {
    await sb.from('audit_logs').insert({
      action, resource_type: resourceType || null,
      resource_id: resourceId || null,
      metadata: metadata || {}
    });
  } catch (err) {
    console.warn('Audit log failed:', err);
  }
}
