// ============================================================
// ZERO GRAVITY — EVENT DETAIL HUB
// Central entity view for events: overview, attendance, finance, tasks, registrations
// ============================================================

let currentEdhEventId = null;

// Tab Navigation inside EDH
document.querySelectorAll('.edh-nav-item').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.edh-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.edh-tab-content').forEach(c => c.style.display = 'none');
    
    e.target.classList.add('active');
    const targetId = e.target.getAttribute('data-edh-target');
    document.getElementById(targetId).style.display = 'block';
    
    if(targetId === 'edh-attendance') {
      // Migrate attendance UI to this container if not already done, or just trigger an update
      loadEdhAttendance();
    } else if(targetId === 'edh-finance') {
      loadEdhFinance();
    } else if(targetId === 'edh-registrations') {
      loadEdhRegistrations();
    } else if(targetId === 'edh-tasks') {
      loadEdhTasks();
    }
  });
});

window.showEventDetail = async function(eventId) {
  currentEdhEventId = eventId;
  
  // Hide all main sections
  document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
  document.getElementById('section-event-detail').classList.add('active');
  document.getElementById('section-event-detail').style.display = 'block';
  
  try {
    const { data, error } = await sb.from('events').select('*').eq('id', eventId).single();
    if (error) throw error;
    
    document.getElementById('edhEventTitle').textContent = data.name;
    
    // Dynamic Status Calculation
    const today = new Date().toISOString().split('T')[0];
    let dynStatus = 'upcoming';
    if (data.event_date < today) dynStatus = 'completed';
    else if (data.event_date === today) dynStatus = 'ongoing';
    if (data.status === 'cancelled') dynStatus = 'cancelled';
    
    document.getElementById('edhEventMeta').textContent = `Date: ${new Date(data.event_date).toLocaleDateString()} | Status: ${dynStatus.toUpperCase()}`;
    
    // Reset tabs to Overview
    document.querySelector('.edh-nav-item[data-edh-target="edh-overview"]').click();
    
    loadEdhOverview(data);
  } catch(err) {
    console.error('Error loading event detail:', err);
    showToast('Failed to load event details', 'error');
  }
};

window.closeEventDetail = function() {
  currentEdhEventId = null;
  document.getElementById('section-event-detail').style.display = 'none';
  document.getElementById('section-event-detail').classList.remove('active');
  
  // Go back to events list
  document.getElementById('section-events').classList.add('active');
};

async function loadEdhOverview(eventData) {
  const container = document.getElementById('edh-overview');
  container.innerHTML = `
    <div class="admin-form-group">
      <label>Description</label>
      <p>${eventData.description || 'No description provided.'}</p>
    </div>
    <div class="admin-form-group">
      <label>Venue</label>
      <p>${eventData.venue || 'TBA'}</p>
    </div>
    <div class="admin-form-group">
      <label>Event Type</label>
      <p>${eventData.event_type}</p>
    </div>
  `;
}

async function loadEdhRegistrations() {
  if (!currentEdhEventId) return;
  const tbody = document.getElementById('edhRegistrationsBody');
  tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
  
  try {
    const { data, error } = await sb.from('registrations').select('*').eq('event_id', currentEdhEventId);
    if (error) throw error;
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No registrations found.</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${escapeHTML(r.name)}</td>
        <td>${escapeHTML(r.email || '-')}</td>
        <td>${escapeHTML(r.phone || '-')}</td>
        <td><span class="att-badge ${r.status === 'registered' ? 'present' : ''}">${r.status}</span></td>
        <td>
          <button class="admin-btn small secondary" onclick="editRegistration('${r.id}')">Edit</button>
          <button class="admin-btn small secondary" style="color:var(--admin-danger)" onclick="deleteRegistration('${r.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch(err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="5">Error loading registrations.</td></tr>';
  }
}

async function loadEdhTasks() {
  if (!currentEdhEventId) return;
  const tbody = document.getElementById('edhTasksBody');
  tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
  
  try {
    const { data, error } = await sb.from('tasks').select('*, members(name)').eq('event_id', currentEdhEventId);
    if (error) throw error;
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No tasks found.</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(t => `
      <tr>
        <td>${escapeHTML(t.title)}</td>
        <td>${t.members ? escapeHTML(t.members.name) : 'Unassigned'}</td>
        <td>${t.due_date || '-'}</td>
        <td><span class="att-badge">${t.status}</span></td>
        <td>
          <button class="admin-btn small secondary" onclick="editTask('${t.id}')">Edit</button>
          <button class="admin-btn small secondary" style="color:var(--admin-danger)" onclick="deleteTask('${t.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch(err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="5">Error loading tasks.</td></tr>';
  }
}

async function loadEdhFinance() {
  if (!currentEdhEventId) return;
  const tbody = document.getElementById('edhFinanceBody');
  tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
  
  try {
    const [incRes, expRes] = await Promise.all([
      sb.from('income_transactions').select('*').eq('event_id', currentEdhEventId),
      sb.from('expenses').select('*').eq('event_id', currentEdhEventId)
    ]);
    
    const income = incRes.data || [];
    const expenses = expRes.data || [];
    
    let totalInc = income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    let totalExp = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    document.getElementById('edhStatIncome').textContent = '₹' + totalInc.toFixed(2);
    document.getElementById('edhStatExpenses').textContent = '₹' + totalExp.toFixed(2);
    document.getElementById('edhStatBalance').textContent = '₹' + (totalInc - totalExp).toFixed(2);
    
    const allTx = [
      ...income.map(i => ({...i, type: 'Income', sourceStr: i.source, date: i.income_date})),
      ...expenses.map(e => ({...e, type: 'Expense', sourceStr: e.expense_item, date: e.expense_date}))
    ].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    if (allTx.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No transactions found.</td></tr>';
      return;
    }
    
    tbody.innerHTML = allTx.map(t => `
      <tr>
        <td>${new Date(t.date).toLocaleDateString()}</td>
        <td><span class="att-badge ${t.type==='Income'?'present':'absent'}">${t.type}</span></td>
        <td>${escapeHTML(t.sourceStr)}</td>
        <td>₹${parseFloat(t.amount).toFixed(2)}</td>
        <td>${escapeHTML(t.payment_method)}</td>
        <td>
          <button class="admin-btn small secondary" style="color:var(--admin-danger)" onclick="deleteTransaction('${t.id}', '${t.type}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch(err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="6">Error loading finance.</td></tr>';
  }
}

async function loadEdhAttendance() {
  if (!currentEdhEventId) return;
  const container = document.getElementById('edhAttendanceContainer');
  // For now, we will link to the main attendance tab and auto-select this event
  container.innerHTML = `
    <div style="padding: 24px; text-align: center; background: var(--bg-card); border-radius: 8px;">
      <p style="margin-bottom: 16px;">Attendance is managed in the main Attendance module.</p>
      <button class="admin-btn" onclick="jumpToAttendance('${currentEdhEventId}')">Go to Attendance</button>
    </div>
  `;
}

window.jumpToAttendance = function(eventId) {
  closeEventDetail();
  document.querySelector('.admin-nav-item[data-target="section-attendance"]').click();
  setTimeout(() => {
    const select = document.getElementById('attEventSelect');
    if (select) {
      select.value = eventId;
      select.dispatchEvent(new Event('change'));
    }
  }, 100);
};

// Deletion helpers with confirmation
window.deleteTransaction = async function(id, type) {
  if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return;
  const table = type === 'Income' ? 'income_transactions' : 'expenses';
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) showToast(error.message, 'error');
  else {
    showToast(`${type} deleted successfully`, 'success');
    loadEdhFinance();
  }
};
