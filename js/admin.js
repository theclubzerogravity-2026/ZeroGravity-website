/**
 * ZeroGravity Admin — Supabase-backed implementation
 *
 * Security architecture:
 *   Browser → Supabase Auth (email/password) → MFA/TOTP (AAL2)
 *   → PostgreSQL RLS via is_admin_aal2() → data access
 *
 * The publishable key is the ONLY Supabase credential in this file.
 * All authorization is enforced by database RLS policies.
 * Client-side role checks are for UX routing only — never trusted for security.
 */

// ─────────────────────────────────────────────
// CUSTOM POPUPS
// ─────────────────────────────────────────────
window.customAlert = function(msg, title = 'Notice') {
  return new Promise((resolve) => {
    document.getElementById('customAlertTitle').textContent = title;
    document.getElementById('customAlertMessage').textContent = msg;
    openModal('modalCustomAlert');
    
    const btn = document.getElementById('btnCustomAlertOk');
    const onClick = () => {
      closeModal('modalCustomAlert');
      btn.removeEventListener('click', onClick);
      resolve();
    };
    btn.addEventListener('click', onClick);
  });
};

window.customConfirm = function(msg, title = 'Confirm') {
  return new Promise((resolve) => {
    document.getElementById('customConfirmTitle').textContent = title;
    document.getElementById('customConfirmMessage').textContent = msg;
    openModal('modalCustomConfirm');
    
    const btnOk = document.getElementById('btnCustomConfirmOk');
    const btnCancel = document.getElementById('btnCustomConfirmCancel');
    
    const cleanup = () => {
      closeModal('modalCustomConfirm');
      btnOk.removeEventListener('click', onOk);
      btnCancel.removeEventListener('click', onCancel);
    };
    
    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    
    btnOk.addEventListener('click', onOk);
    btnCancel.addEventListener('click', onCancel);
  });
};

const sb = window.supabaseClient;

// ─────────────────────────────────────────────
// TOAST NOTIFICATION SYSTEM
// ─────────────────────────────────────────────
window.showToast = function(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconMap = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  toast.innerHTML = `<span class="toast-icon">${iconMap[type] || 'ℹ'}</span><span class="toast-msg">${message}</span>`;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 400);
  }, duration);
};

// ─────────────────────────────────────────────
// SCREENS
// ─────────────────────────────────────────────
const screens = {
  loading:       document.getElementById('adminLoadingScreen'),
  login:         document.getElementById('adminLoginScreen'),
  forgot:        document.getElementById('adminForgotPasswordScreen'),
  recoveryOtp:   document.getElementById('adminRecoveryOtpScreen'),
  newPassword:   document.getElementById('adminNewPasswordScreen'),
  notAuthorized: document.getElementById('adminNotAuthorized'),
  dashboard:     document.getElementById('adminDashboardScreen'),
};

function showScreen(name) {
  Object.values(screens).forEach(el => {
    el.style.display = 'none';
  });
  if (screens[name]) {
    screens[name].style.display = name === 'dashboard' ? 'block' : 'flex';
  }
}

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.style.display = 'block';
}

function hideError(elementId) {
  const el = document.getElementById(elementId);
  el.style.display = 'none';
}

// ─────────────────────────────────────────────
// AUTH GUARD
// ─────────────────────────────────────────────
let currentUser = null;
let currentMfaFactorId = null;

async function checkSession() {
  showScreen('loading');

  try {
    const { data: { session }, error } = await sb.auth.getSession();

    if (error || !session) {
      showScreen('login');
      return;
    }

    currentUser = session.user;

    // Check admin profile (UX routing only — RLS is the real guard)
    const { data: profile, error: profileError } = await sb.from('admin_profiles')
      .select('role, is_active')
      .eq('user_id', currentUser.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin' || !profile.is_active) {
      showScreen('notAuthorized');
      return;
    }

    // Authorized — show dashboard
    document.getElementById('adminUserEmail').textContent = currentUser.email;
    showScreen('dashboard');
    initDashboard();

  } catch (err) {
    console.error('Session check failed:', err);
    showScreen('login');
  }
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
document.getElementById('btnAdminLogin').addEventListener('click', async () => {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  hideError('adminErrorMsg');

  if (!email || !password) {
    showError('adminErrorMsg', 'Please enter your email and password.');
    return;
  }

  const btn = document.getElementById('btnAdminLogin');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      showError('adminErrorMsg', 'Authentication failed. Check your credentials.');
      btn.disabled = false;
      btn.textContent = 'Sign In';
      return;
    }

    currentUser = data.user;

    // Proceed (RLS will enforce standard admin role)
    await checkSession();

  } catch (err) {
    showError('adminErrorMsg', 'An unexpected error occurred.');
    console.error('Login error:', err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});

// Enter key on password field
document.getElementById('adminPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btnAdminLogin').click();
});

// ─────────────────────────────────────────────
// FORGOT PASSWORD FLOW
// ─────────────────────────────────────────────
let recoveryEmail = null;
const AUTHORIZED_ADMIN_EMAIL = 'theclubzerogravity@gmail.com';

document.getElementById('linkForgotPassword').addEventListener('click', (e) => {
  e.preventDefault();
  showScreen('forgot');
  document.getElementById('forgotPasswordEmail').value = '';
});

document.getElementById('btnCancelForgot').addEventListener('click', () => {
  showScreen('login');
});

document.getElementById('btnSendRecoveryCode').addEventListener('click', async () => {
  const email = document.getElementById('forgotPasswordEmail').value.trim();
  hideError('forgotPasswordErrorMsg');
  
  if (!email) {
    showError('forgotPasswordErrorMsg', 'Please enter your email.');
    return;
  }
  
  if (email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    showError('forgotPasswordErrorMsg', 'Email is not authorized for password recovery.');
    return;
  }
  
  const btn = document.getElementById('btnSendRecoveryCode');
  btn.disabled = true;
  btn.textContent = 'Sending...';
  
  try {
    const { error } = await sb.auth.resetPasswordForEmail(email);
    if (error) throw error;
    
    recoveryEmail = email;
    showScreen('recoveryOtp');
    document.getElementById('recoveryOtpCode').value = '';
    
  } catch (err) {
    console.error('Reset password error:', err);
    showError('forgotPasswordErrorMsg', 'Failed to send recovery code. Try again later.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Verification Code';
  }
});

document.getElementById('btnCancelRecovery').addEventListener('click', () => {
  showScreen('login');
  recoveryEmail = null;
});

document.getElementById('btnVerifyRecoveryCode').addEventListener('click', async () => {
  const code = document.getElementById('recoveryOtpCode').value.trim();
  hideError('recoveryOtpErrorMsg');
  
  if (!code || code.length !== 6) {
    showError('recoveryOtpErrorMsg', 'Please enter a valid 6-digit code.');
    return;
  }
  
  const btn = document.getElementById('btnVerifyRecoveryCode');
  btn.disabled = true;
  btn.textContent = 'Verifying...';
  
  try {
    const { error } = await sb.auth.verifyOtp({
      email: recoveryEmail,
      token: code,
      type: 'recovery'
    });
    
    if (error) throw error;
    
    showScreen('newPassword');
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    
  } catch (err) {
    console.error('Verify OTP error:', err);
    showError('recoveryOtpErrorMsg', 'Invalid or expired code. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Verify Code';
  }
});

document.getElementById('btnUpdatePassword').addEventListener('click', async () => {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;
  hideError('newPasswordErrorMsg');
  
  if (newPassword !== confirmPassword) {
    showError('newPasswordErrorMsg', 'Passwords do not match.');
    return;
  }
  
  // Strong password regex: 12+ chars, uppercase, lowercase, number, special char
  const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{12,})");
  if (!strongRegex.test(newPassword)) {
    showError('newPasswordErrorMsg', 'Password must be at least 12 characters and contain uppercase, lowercase, numbers, and special characters.');
    return;
  }
  
  const btn = document.getElementById('btnUpdatePassword');
  btn.disabled = true;
  btn.textContent = 'Updating...';
  
  try {
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) throw error;
    
    // Success — sign out and return to login
    await sb.auth.signOut();
    currentUser = null;
    recoveryEmail = null;
    
    showScreen('login');
    await customAlert();
    
  } catch (err) {
    console.error('Update password error:', err);
    showError('newPasswordErrorMsg', 'Failed to update password. Try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update Password';
  }
});



// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
document.getElementById('btnLogout').addEventListener('click', async () => {
  await sb.auth.signOut();
  currentUser = null;
  showScreen('login');
});

document.getElementById('btnNotAuthLogout').addEventListener('click', async () => {
  await sb.auth.signOut();
  currentUser = null;
  showScreen('login');
});

// ─────────────────────────────────────────────
// AUTH STATE LISTENER
// ─────────────────────────────────────────────
sb.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    currentUser = null;
    showScreen('login');
  }
});

// ─────────────────────────────────────────────
// UI NAVIGATION
// ─────────────────────────────────────────────
document.querySelectorAll('.admin-nav-item').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    e.target.classList.add('active');
    document.getElementById(e.target.getAttribute('data-target')).classList.add('active');
    refreshCurrentSection(e.target.getAttribute('data-target'));
  });
});

function refreshCurrentSection(sectionId) {
  if (sectionId === 'section-overview') renderOverview();
  if (sectionId === 'section-members') renderMembers();
  if (sectionId === 'section-events') renderEvents();
  if (sectionId === 'section-attendance' && window.renderAttendance) window.renderAttendance();
  if (sectionId === 'section-sponsors' && window.renderSponsors) window.renderSponsors();
  if (sectionId === 'section-finance' && window.renderFinance) window.renderFinance();
  if (sectionId === 'section-audit' && window.renderAuditLogs) window.renderAuditLogs();
  if (sectionId === 'section-settings' && window.renderSettings) window.renderSettings();
}

function initDashboard() {
  renderOverview();
}

// ─────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function openModal(id) { document.getElementById(id).classList.add('active'); }

window.addEventListener('click', async (e) => {
  if (e.target.classList.contains('admin-modal-overlay') && e.target.classList.contains('active')) {
    if (e.target.id === 'modalCustomAlert' || e.target.id === 'modalCustomConfirm') return; // Do not trigger on our custom popups
    if (await customConfirm("Are you sure you want to close this? Any unsaved changes will be lost.")) {
      closeModal(e.target.id);
    }
  }
});
// Expose for inline onclick handlers
window.closeModal = closeModal;

// ─────────────────────────────────────────────
// AUDIT LOGGING HELPER
// ─────────────────────────────────────────────
async function auditLog(action, resourceType, resourceId, metadata) {
  try {
    await sb.from('audit_logs').insert({
      // actor_user_id is automatically populated by a secure database trigger
      action: action,
      resource_type: resourceType || null,
      resource_id: resourceId || null,
      metadata: metadata || {}
    });
  } catch (err) {
    // Audit logging should never block the user — fail silently
    console.warn('Audit log failed:', err);
  }
}

// ─────────────────────────────────────────────
// OVERVIEW
// ─────────────────────────────────────────────
async function renderOverview() {
  try {
    const { data: members } = await sb.from('members').select('id, member_type');
    const { data: events } = await sb.from('events').select('id, name, event_date, status').order('event_date', { ascending: false });
    // Fetch only EVENT type attendance for the dashboard rate
    const { data: attendance } = await sb.from('attendance')
      .select('event_id, member_id, status')
      .eq('attendance_type', 'EVENT');

    const memberCount = members?.length || 0;
    const eventCount = events?.length || 0;
    const coreCount = members?.filter(m => m.member_type === 'Core Committee').length || 0;

    document.getElementById('statTotalEvents').textContent = eventCount;
    document.getElementById('statTotalMembers').textContent = memberCount;
    document.getElementById('statCoreMembers').textContent = coreCount;

    // Overall attendance rate — only non-cancelled events with attendance
    const activeEvents = (events || []).filter(e => e.status !== 'cancelled');
    let totalRate = 0;
    let eventsWithAttendance = 0;
    
    activeEvents.forEach(evt => {
        const evtAtt = attendance?.filter(a => a.event_id === evt.id) || [];
        if (evtAtt.length > 0) {
            const present = evtAtt.filter(a => a.status === 'present').length;
            totalRate += (present / evtAtt.length) * 100;
            eventsWithAttendance++;
        }
    });
    
    const overallRate = eventsWithAttendance > 0 ? Math.round(totalRate / eventsWithAttendance) : 0;
    document.getElementById('statAttendanceRate').textContent = eventsWithAttendance > 0 ? `${overallRate}%` : 'N/A';

    // Recent events
    const recent = (events || []).slice(0, 5);
    const tbody = document.getElementById('overviewRecentEventsTable');
    tbody.innerHTML = recent.map(evt => {
      const evtAtt = attendance?.filter(a => a.event_id === evt.id) || [];
      const present = evtAtt.filter(a => a.status === 'present').length;
      const total = evtAtt.length;
      const statusBadge = evt.status === 'cancelled' ? '<span class="att-badge att-badge-cancelled">Cancelled</span>' : '';
      return `<tr>
        <td>${escapeHTML(evt.name)} ${statusBadge}</td>
        <td>${evt.event_date}</td>
        <td>${evt.status === 'cancelled' ? 'N/A' : (total > 0 ? `${present} / ${total} Present` : 'Not Marked')}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="3" style="text-align:center; color:var(--admin-muted);">No events yet</td></tr>';

  } catch (err) {
    console.error('Overview render error:', err);
  }
}

// ─────────────────────────────────────────────
// MEMBERS
// ─────────────────────────────────────────────
let editingMemberId = null;
let cachedMembers = [];
let cachedAttendance = [];

async function renderMembers() {
  try {
    const { data: members, error } = await sb.from('members').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    cachedMembers = members || [];

    // Only fetch EVENT type attendance for member stats (fixes 200% bug)
    const { data: attendance } = await sb.from('attendance')
      .select('member_id, status, attendance_type, event_id')
      .eq('attendance_type', 'EVENT');
    cachedAttendance = attendance || [];

    // Get non-cancelled events for eligible day calculation
    const { data: activeEvts } = await sb.from('events').select('id, event_date, status');
    const eligibleEventDates = new Set(
      (activeEvts || []).filter(e => e.status !== 'cancelled').map(e => e.event_date)
    );
    const eligibleDays = eligibleEventDates.size;

    const tbody = document.getElementById('membersTableBody');
    tbody.innerHTML = cachedMembers.map(m => {
      const stats = getMemberStatsFromCache(m.id, eligibleDays);
      let badgeClass = 'badge-general';
      if (m.member_type === 'Core Committee') badgeClass = 'badge-core';
      if (m.member_type === 'Volunteer') badgeClass = 'badge-volunteer';

      return `<tr onclick="showMemberDetails('${m.id}')">
        <td><strong>${escapeHTML(m.name)}</strong></td>
        <td>${escapeHTML(m.role || '—')}</td>
        <td><span class="admin-badge ${badgeClass}">${escapeHTML(m.member_type)}</span></td>
        <td>${stats.attended}</td>
        <td onclick="event.stopPropagation()">
          <button class="admin-action-btn" onclick="editMember('${m.id}')">Edit</button>
          <button class="admin-action-btn delete" onclick="deleteMember('${m.id}')">Delete</button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" style="text-align:center; color:var(--admin-muted);">No members yet</td></tr>';

  } catch (err) {
    console.error('Members render error:', err);
  }
}

function getMemberStatsFromCache(memberId, eligibleDays) {
  // Only count EVENT attendance (not PREP)
  const memberAtt = cachedAttendance.filter(a => a.member_id === memberId);
  const attended = memberAtt.filter(a => a.status === 'present').length;
  const missed = memberAtt.filter(a => a.status === 'absent').length;
  // Rate is based on eligible event days, not just records
  const denom = eligibleDays || (attended + missed);
  const rate = denom > 0 ? Math.round((attended / denom) * 100) : 0;
  const rateDisplay = denom > 0 ? `${rate}%` : 'N/A';
  return { attended, missed, rate, rateDisplay };
}

document.getElementById('btnAddMember').addEventListener('click', () => {
  editingMemberId = null;
  document.getElementById('memName').value = '';
  document.getElementById('memType').value = 'General Member';
  document.getElementById('memRole').value = '';
  document.getElementById('memDept').value = '';
  openModal('modalAddMember');
});

document.getElementById('btnSaveMember').addEventListener('click', async () => {
  const name = document.getElementById('memName').value.trim();
  const member_type = document.getElementById('memType').value;
  const role = document.getElementById('memRole').value.trim();
  const department = document.getElementById('memDept').value.trim();

  if (!name) { await customAlert('Please enter a member name.', 'Missing Field'); return; }

  try {
    if (editingMemberId) {
      const { error } = await sb.from('members')
        .update({ name, member_type, role: role || null, department: department || null })
        .eq('id', editingMemberId);
      if (error) throw error;
      await auditLog('update_member', 'members', editingMemberId, { name });
    } else {
      const { data, error } = await sb.from('members')
        .insert({ name, member_type, role: role || null, department: department || null })
        .select('id')
        .single();
      if (error) throw error;
      await auditLog('create_member', 'members', data.id, { name });
    }
    closeModal('modalAddMember');
    renderMembers();
  } catch (err) {
    await customAlert('Failed to save member. Check the console for details.', 'Error');
    console.error("MEMBER SAVE ERROR", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint
    });
  }
});

window.editMember = async function(id) {
  const m = cachedMembers.find(x => x.id === id);
  if (!m) return;
  editingMemberId = m.id;
  document.getElementById('memName').value = m.name;
  document.getElementById('memType').value = m.member_type;
  document.getElementById('memRole').value = m.role || '';
  document.getElementById('memDept').value = m.department || '';
  openModal('modalAddMember');
};

window.deleteMember = async function(id) {
  if (!(await customConfirm('Are you sure you want to delete this member? Their attendance history will also be removed. This action cannot be undone.', 'Delete Member'))) return;
  try {
    const { error } = await sb.from('members').delete().eq('id', id);
    if (error) throw error;
    await auditLog('delete_member', 'members', id);
    renderMembers();
  } catch (err) {
    await customAlert('Failed to delete member.', 'Error');
    console.error('Delete member error:', err);
  }
};

window.showMemberDetails = async function(id) {
  try {
    const { data: m } = await sb.from('members').select('*').eq('id', id).single();
    if (!m) return;

    document.getElementById('detMemName').textContent = m.name;
    document.getElementById('detMemRole').textContent = `${m.role || '—'} — ${m.department || '—'} | ${m.member_type}`;

    // Fetch EVENT attendance only for this member (separate from PREP)
    const { data: attRecords } = await sb.from('attendance')
      .select('status, event_id, attendance_type, events(name, event_date, status)')
      .eq('member_id', id)
      .eq('attendance_type', 'EVENT');

    // Filter out cancelled events
    const validRecords = (attRecords || []).filter(a => a.events?.status !== 'cancelled');
    const attended = validRecords.filter(a => a.status === 'present').length;
    const missed = validRecords.filter(a => a.status === 'absent').length;
    
    // Get eligible event days (unique non-cancelled event dates)
    const { data: allEvts } = await sb.from('events').select('event_date, status');
    const eligibleDays = new Set(
      (allEvts || []).filter(e => e.status !== 'cancelled').map(e => e.event_date)
    ).size;
    
    const rate = eligibleDays > 0 ? Math.round((attended / eligibleDays) * 100) : 0;

    document.getElementById('detAttended').textContent = attended;
    document.getElementById('detMissed').textContent = missed;
    document.getElementById('detRate').textContent = eligibleDays > 0 ? `${rate}%` : 'N/A';

    const historyTbody = document.getElementById('detHistoryTable');
    historyTbody.innerHTML = (attRecords || []).map(a => {
      const statusColor = a.status === 'present' ? 'var(--admin-success)' : 'var(--admin-danger)';
      const statusText = a.status === 'present' ? 'Present' : 'Absent';
      const cancelled = a.events?.status === 'cancelled';
      return `<tr>
        <td>${escapeHTML(a.events?.name || '—')} ${cancelled ? '<span class="att-badge att-badge-cancelled" style="font-size:9px;">Cancelled</span>' : ''}</td>
        <td>${a.events?.event_date || '—'}</td>
        <td><span style="color:${cancelled ? 'var(--admin-muted)' : statusColor}">${cancelled ? 'N/A' : statusText}</span></td>
      </tr>`;
    }).join('') || '<tr><td colspan="3" style="text-align:center;">No attendance history</td></tr>';

    openModal('modalMemberDetails');
  } catch (err) {
    console.error('Member details error:', err);
  }
};

// ─────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────
let editingEventId = null;
let cachedEvents = [];

async function renderEvents() {
  try {
    const { data: events, error } = await sb.from('events').select('*').order('event_date', { ascending: false });
    if (error) throw error;
    cachedEvents = events || [];

    const tbody = document.getElementById('eventsTableBody');
    tbody.innerHTML = cachedEvents.map(e => {
      const derivedStatus = deriveEventStatus(e);
      const statusBadge = derivedStatus === 'cancelled' ? 'att-badge-cancelled'
        : derivedStatus === 'completed' ? 'att-badge-completed'
        : derivedStatus === 'ongoing' ? 'att-badge-pending'
        : derivedStatus === 'upcoming' ? 'att-badge-upcoming'
        : 'att-badge-locked';
      return `<tr>
      <td><a href="#" onclick="showEventDetail('${e.id}'); return false;" style="color:var(--admin-primary); text-decoration:none;"><strong>${escapeHTML(e.name)}</strong></a></td>
      <td>${e.event_date}</td>
      <td>${escapeHTML(e.event_type)}</td>
      <td><span class="att-badge ${statusBadge}">${escapeHTML(derivedStatus)}</span></td>
      <td>${escapeHTML(e.venue || '—')}</td>
      <td>
        <button class="admin-action-btn" onclick="editEvent('${e.id}')">Edit</button>
        <button class="admin-action-btn delete" onclick="deleteEvent('${e.id}')">Delete</button>
      </td>
    </tr>`;
    }).join('') || '<tr><td colspan="6" style="text-align:center; color:var(--admin-muted);">No events yet</td></tr>';

  } catch (err) {
    console.error('Events render error:', err);
  }
}

document.getElementById('btnAddEvent').addEventListener('click', () => {
  editingEventId = null;
  document.getElementById('evtName').value = '';
  document.getElementById('evtDate').value = '';
  document.getElementById('evtEndDate').value = '';
  document.getElementById('evtType').value = 'Workshop';
  document.getElementById('evtStatus').value = 'upcoming';
  document.getElementById('evtVenue').value = '';
  document.getElementById('evtPrepDates').value = '';
  openModal('modalAddEvent');
});

document.getElementById('btnSaveEvent').addEventListener('click', async () => {
  const name = document.getElementById('evtName').value.trim();
  const event_date = document.getElementById('evtDate').value;
  const end_date = document.getElementById('evtEndDate').value || event_date;
  const event_type = document.getElementById('evtType').value;
  const status = document.getElementById('evtStatus').value;
  const venue = document.getElementById('evtVenue').value.trim();
  const prepDatesRaw = document.getElementById('evtPrepDates').value.trim();

  if (!name || !event_date) { await customAlert('Please enter event name and date.', 'Missing Fields'); return; }

  // Parse prep dates
  const prep_dates = prepDatesRaw
    ? prepDatesRaw.split(',').map(d => d.trim()).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
    : [];

  try {
    const payload = {
      name, event_date, end_date, event_type, status,
      venue: venue || null,
      prep_dates: prep_dates
    };

    if (editingEventId) {
      const { error } = await sb.from('events')
        .update(payload)
        .eq('id', editingEventId);
      if (error) throw error;
      await auditLog('update_event', 'events', editingEventId, { name, event_date, status });
    } else {
      const { data, error } = await sb.from('events')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      await auditLog('create_event', 'events', data.id, { name, event_date, status });
    }
    closeModal('modalAddEvent');
    renderEvents();
  } catch (err) {
    await customAlert('Failed to save event. Check the console for details.', 'Error');
    console.error("Event save failed:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint
    });
  }
});

window.editEvent = function(id) {
  const e = cachedEvents.find(x => x.id === id);
  if (!e) return;
  editingEventId = e.id;
  document.getElementById('evtName').value = e.name;
  document.getElementById('evtDate').value = e.event_date;
  document.getElementById('evtEndDate').value = e.end_date || e.event_date;
  document.getElementById('evtType').value = e.event_type;
  document.getElementById('evtStatus').value = e.status || 'upcoming';
  document.getElementById('evtVenue').value = e.venue || '';
  document.getElementById('evtPrepDates').value = (e.prep_dates || []).join(', ');
  openModal('modalAddEvent');
};

window.deleteEvent = async function(id) {
  if (!(await customConfirm('Are you sure you want to delete this event? Attendance records will also be removed.', 'Delete Event'))) return;
  try {
    const { error } = await sb.from('events').delete().eq('id', id);
    if (error) throw error;
    await auditLog('delete_event', 'events', id);
    renderEvents();
  } catch (err) {
    await customAlert('Failed to delete event.', 'Error');
    console.error('Delete event error:', err);
  }
};

// ─────────────────────────────────────────────
// DERIVED EVENT STATUS
// ─────────────────────────────────────────────
function deriveEventStatus(event) {
  // Manual overrides take priority
  if (event.status === 'cancelled') return 'cancelled';
  if (event.status === 'draft') return 'draft';

  // Date-based derivation using IST
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(new Date());
  let y, m, d;
  for (let p of parts) {
    if (p.type === 'year') y = p.value;
    if (p.type === 'month') m = p.value;
    if (p.type === 'day') d = p.value;
  }
  const todayStr = `${y}-${m}-${d}`;

  const endDate = event.end_date || event.event_date;
  
  if (endDate < todayStr) return 'completed';
  if (event.event_date > todayStr) return 'upcoming';
  return 'ongoing';
}
window.deriveEventStatus = deriveEventStatus;

// ─────────────────────────────────────────────
// DUPLICATE EVENT
// ─────────────────────────────────────────────
window.duplicateEvent = async function(id) {
  const e = cachedEvents.find(x => x.id === id);
  if (!e) return;
  if (!(await customConfirm(`Create a duplicate of "${e.name}"? You can edit the copy after creation.`, 'Duplicate Event'))) return;

  try {
    const payload = {
      name: e.name + ' (Copy)',
      event_date: e.event_date,
      end_date: e.end_date || e.event_date,
      event_type: e.event_type,
      status: 'upcoming',
      venue: e.venue || null,
      prep_dates: e.prep_dates || [],
      description: e.description || null
    };
    const { data, error } = await sb.from('events').insert(payload).select('id').single();
    if (error) throw error;
    await auditLog('duplicate_event', 'events', data.id, { original_id: id, name: payload.name });
    showToast(`Event duplicated: ${payload.name}`, 'success');
    renderEvents();
  } catch (err) {
    await customAlert('Failed to duplicate event: ' + (err.message || 'Unknown error'), 'Error');
  }
};

// ─────────────────────────────────────────────
// ATTENDANCE MOVED TO admin_attendance.js
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// UTILITY: HTML ESCAPE
// ─────────────────────────────────────────────
window.escapeHTML = function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─────────────────────────────────────────────
// HAMBURGER MENU (Mobile)
// ─────────────────────────────────────────────
const hamburgerBtn = document.getElementById('btnHamburger');
const adminNav = document.querySelector('.admin-nav');
if (hamburgerBtn && adminNav) {
  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('active');
    adminNav.classList.toggle('mobile-open');
  });

  // Close mobile nav when a nav item is clicked
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      hamburgerBtn.classList.remove('active');
      adminNav.classList.remove('mobile-open');
    });
  });
}

// ─────────────────────────────────────────────
// MISSING CRUD FOR MEMBERS & EVENTS
// ─────────────────────────────────────────────
window.editMember = async function(id) {
  const member = cachedMembers.find(m => m.id === id);
  if (!member) return;
  editingMemberId = id;
  document.getElementById('memName').value = member.name;
  document.getElementById('memType').value = member.member_type;
  document.getElementById('memRole').value = member.role || '';
  document.getElementById('memDept').value = member.department || '';
  openModal('modalAddMember');
};

window.deleteMember = async function(id) {
  if (!await customConfirm('Are you sure you want to soft-delete this member? This will mark them inactive rather than breaking attendance history.')) return;
  try {
    const { error } = await sb.from('members').update({ status: 'inactive' }).eq('id', id);
    if (error) throw error;
    showToast('Member marked inactive', 'success');
    renderMembers();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.editEvent = async function(id) {
  const evt = cachedEvents.find(e => e.id === id);
  if (!evt) return;
  editingEventId = id;
  document.getElementById('evtName').value = evt.name;
  document.getElementById('evtDate').value = evt.event_date;
  document.getElementById('evtEndDate').value = evt.end_date || evt.event_date;
  document.getElementById('evtType').value = evt.event_type;
  document.getElementById('evtStatus').value = evt.status;
  document.getElementById('evtVenue').value = evt.venue || '';
  document.getElementById('evtPrepDates').value = (evt.prep_dates || []).join(', ');
  openModal('modalAddEvent');
};

window.duplicateEvent = async function(id) {
  const evt = cachedEvents.find(e => e.id === id);
  if (!evt) return;
  editingEventId = null; // Create new
  document.getElementById('evtName').value = evt.name + ' (Copy)';
  document.getElementById('evtDate').value = evt.event_date;
  document.getElementById('evtEndDate').value = evt.end_date || evt.event_date;
  document.getElementById('evtType').value = evt.event_type;
  document.getElementById('evtStatus').value = 'upcoming';
  document.getElementById('evtVenue').value = evt.venue || '';
  document.getElementById('evtPrepDates').value = '';
  openModal('modalAddEvent');
};

window.deleteEvent = async function(id) {
  if (!await customConfirm('Are you sure you want to permanently delete this event? This action cannot be undone and will delete all related records.')) return;
  try {
    const { error } = await sb.from('events').delete().eq('id', id);
    if (error) throw error;
    showToast('Event completely deleted successfully', 'success');
    renderEvents();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
checkSession();
