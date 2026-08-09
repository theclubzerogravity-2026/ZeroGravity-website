// Finance Tabs Logic
document.querySelectorAll('.finance-nav-item').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.finance-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.finance-tab-content').forEach(s => s.style.display = 'none');
    
    e.target.classList.add('active');
    const targetId = e.target.getAttribute('data-finance-target');
    document.getElementById(targetId).style.display = 'block';
    document.getElementById(targetId).classList.add('active');
  });
});

let allEvents = [];
let allMembers = [];
let allSponsors = [];

async function fetchFinanceDependencies() {
  const [resEvents, resMembers, resSponsors] = await Promise.all([
    sb.from('events').select('id, name, event_date').order('event_date', { ascending: false }),
    sb.from('members').select('id, name').order('name'),
    sb.from('sponsors').select('id, company_name').order('company_name')
  ]);
  
  if (resEvents.data) allEvents = resEvents.data;
  if (resMembers.data) allMembers = resMembers.data;
  if (resSponsors.data) allSponsors = resSponsors.data;
  
  // Populate dropdowns
  const eventOptions = allEvents.map(e => `<option value="${escapeHTML(e.name)}">`).join('');
  document.getElementById('eventListOptions').innerHTML = eventOptions;
  
  const memberOptions = allMembers.map(m => `<option value="${escapeHTML(m.name)}">`).join('');
  document.getElementById('memberListOptions').innerHTML = memberOptions;
}

// Show/hide member dropdown in Expense Modal
document.getElementById('expensePaidByMode')?.addEventListener('change', (e) => {
  document.getElementById('expenseMemberGroup').style.display = e.target.value === 'member' ? 'block' : 'none';
});

window.renderFinance = async function() {
  await fetchFinanceDependencies();
  await Promise.all([
    renderFinanceEvents(),
    renderFinanceExpenses(),
    renderFinanceSettlements(),
    renderFinanceIncome(),
    renderFinanceSponsorships()
  ]);
  calculateFinanceTotals();
};

let globalExpenses = [];
let globalIncome = [];
let globalSettlements = [];

async function renderFinanceEvents() {
  const tbody = document.getElementById('financeEventsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';
  
  // We need to fetch event_budgets and aggregate expenses per event
  const { data: budgets, error } = await sb.from('event_budgets').select('*');
  const { data: expenses } = await sb.from('expenses').select('event_id, amount, status');
  
  if (error) return tbody.innerHTML = '<tr><td colspan="6" style="color:var(--red);">Error loading budgets</td></tr>';
  
  tbody.innerHTML = allEvents.map(event => {
    const budget = budgets?.find(b => b.event_id === event.id);
    const approved = budget ? parseFloat(budget.approved_budget) : 0;
    
    const eventExpenses = expenses?.filter(e => e.event_id === event.id && e.status !== 'voided') || [];
    const spent = eventExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    const remaining = approved - spent;
    let utilColor = 'var(--admin-text)';
    if (spent > approved && approved > 0) utilColor = 'var(--red)';
    else if (approved > 0 && spent / approved > 0.8) utilColor = 'var(--yellow)';
    
    return `
      <tr>
        <td><strong>${escapeHTML(event.name)}</strong></td>
        <td>₹${approved.toFixed(2)}</td>
        <td>₹${spent.toFixed(2)}</td>
        <td style="color:${remaining < 0 ? 'var(--red)' : 'var(--green)'}">₹${remaining.toFixed(2)}</td>
        <td style="color:${utilColor}">${approved > 0 ? ((spent / approved) * 100).toFixed(1) + '%' : 'N/A'}</td>
        <td>
          <button class="admin-btn small secondary" onclick="promptSetBudget('${event.id}', ${approved})">Set Budget</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.promptSetBudget = async function(eventId, currentBudget) {
  const amt = prompt(`Enter new approved budget for this event (current: ₹${currentBudget}):`, currentBudget);
  if (amt === null || isNaN(parseFloat(amt)) || parseFloat(amt) < 0) return;
  
  const { error: checkErr, data: existing } = await sb.from('event_budgets').select('id').eq('event_id', eventId).maybeSingle();
  
  let error;
  if (existing) {
    const res = await sb.from('event_budgets').update({ approved_budget: parseFloat(amt) }).eq('id', existing.id);
    error = res.error;
    if (!error) auditLog('updated', 'event_budgets', existing.id, { approved_budget: parseFloat(amt) });
  } else {
    const res = await sb.from('event_budgets').insert([{ event_id: eventId, approved_budget: parseFloat(amt) }]).select('id').single();
    error = res.error;
    if (!error && res.data) auditLog('inserted', 'event_budgets', res.data.id, { event_id: eventId, approved_budget: parseFloat(amt) });
  }
  
  if (error) await customAlert();
  else renderFinanceEvents();
};

async function renderFinanceExpenses() {
  const tbody = document.getElementById('financeExpensesTableBody');
  const { data, error } = await sb.from('expenses')
    .select('*, events(name), members(name)')
    .order('expense_date', { ascending: false });
    
  if (error) return tbody.innerHTML = '<tr><td colspan="7" style="color:var(--red);">Error</td></tr>';
  
  globalExpenses = data || [];
  
  tbody.innerHTML = globalExpenses.map(e => `
    <tr style="${e.status === 'voided' ? 'opacity:0.5; text-decoration:line-through;' : ''}">
      <td style="font-size:12px;">${e.expense_date}</td>
      <td>
        <strong>${escapeHTML(e.expense_item)}</strong>
        <div style="font-size:11px; color:var(--admin-muted);">${e.events ? escapeHTML(e.events.name) : 'General / No Event'}</div>
      </td>
      <td>${escapeHTML(e.category)}</td>
      <td>₹${parseFloat(e.amount).toFixed(2)}</td>
      <td>
        ${e.paid_by_club ? '<span style="color:var(--blue)">Club</span>' : `<span style="color:var(--yellow)">Member: ${escapeHTML(e.members?.name || 'Unknown')}</span>`}
      </td>
      <td>
        <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:var(--panel-2); color:${e.status==='voided'?'var(--red)':'var(--green)'}">${e.status.toUpperCase()}</span>
      </td>
      <td>
        ${e.status !== 'voided' ? `<button class="admin-btn small secondary" style="color:var(--yellow); border-color:var(--yellow); margin-right:4px;" onclick="voidExpense('${e.id}')">Void</button>` : ''}
        <button class="admin-btn small secondary" style="color:var(--red); border-color:var(--red);" onclick="deleteExpense('${e.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function renderFinanceIncome() {
  const tbody = document.getElementById('financeIncomeTableBody');
  const { data, error } = await sb.from('income_transactions')
    .select('*, events(name)')
    .order('income_date', { ascending: false });
    
  if (error) return tbody.innerHTML = '<tr><td colspan="6" style="color:var(--red);">Error</td></tr>';
  
  globalIncome = data || [];
  
  tbody.innerHTML = globalIncome.map(i => `
    <tr style="${i.status === 'voided' ? 'opacity:0.5; text-decoration:line-through;' : ''}">
      <td style="font-size:12px;">${i.income_date}</td>
      <td>
        <strong>${escapeHTML(i.source)}</strong>
        <div style="font-size:11px; color:var(--admin-muted);">${i.events ? escapeHTML(i.events.name) : 'General / No Event'}</div>
      </td>
      <td>${escapeHTML(i.income_type)}</td>
      <td style="color:var(--green)">+₹${parseFloat(i.amount).toFixed(2)}</td>
      <td>
        <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:var(--panel-2); color:${i.status==='voided'?'var(--red)':'var(--green)'}">${i.status.toUpperCase()}</span>
      </td>
      <td>
        ${i.status !== 'voided' ? `<button class="admin-btn small secondary" style="color:var(--red); border-color:var(--red);" onclick="voidIncome('${i.id}')">Void</button>` : ''}
      </td>
    </tr>
  `).join('');
}

async function renderFinanceSettlements() {
  const tbody = document.getElementById('financeSettlementsTableBody');
  const { data: settlements, error: err1 } = await sb.from('expense_settlements').select('expense_id, amount, status');
  
  if (err1) return tbody.innerHTML = '<tr><td colspan="5">Error loading settlements</td></tr>';
  globalSettlements = settlements || [];
  
  // Find all active expenses paid by member
  const memberExpenses = globalExpenses.filter(e => !e.paid_by_club && e.status === 'active');
  
  if (memberExpenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--admin-muted);">No pending settlements.</td></tr>';
    return;
  }
  
  tbody.innerHTML = memberExpenses.map(e => {
    const settledAmount = globalSettlements
      .filter(s => s.expense_id === e.id && s.status === 'completed')
      .reduce((sum, s) => sum + parseFloat(s.amount), 0);
      
    const due = parseFloat(e.amount) - settledAmount;
    
    if (due <= 0) return ''; // Fully settled
    
    return `
      <tr>
        <td><strong>${escapeHTML(e.members?.name || 'Unknown')}</strong></td>
        <td>
          ${escapeHTML(e.expense_item)}
          <div style="font-size:11px; color:var(--admin-muted);">${e.expense_date} | Total Exp: ₹${parseFloat(e.amount).toFixed(2)}</div>
        </td>
        <td style="color:var(--yellow)">₹${due.toFixed(2)}</td>
        <td><span style="font-size:11px; padding:2px 6px; border-radius:4px; background:var(--panel-2); color:var(--yellow)">PENDING</span></td>
        <td>
          <button class="admin-btn small inline" onclick="openSettlementModal('${e.id}', ${due})">Settle</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function renderFinanceSponsorships() {
  // Simple implementation for now
  document.getElementById('financeSponsorshipsTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--admin-muted);">Sponsorship finances coming soon in next update.</td></tr>';
}

function calculateFinanceTotals() {
  const totalInc = globalIncome.filter(i => i.status === 'active').reduce((sum, i) => sum + parseFloat(i.amount), 0);
  const totalExp = globalExpenses.filter(e => e.status === 'active').reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  // Pending settlements = (member expenses) - (completed settlements)
  const memberExpTotal = globalExpenses.filter(e => e.status === 'active' && !e.paid_by_club).reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const settledTotal = globalSettlements.filter(s => s.status === 'completed').reduce((sum, s) => sum + parseFloat(s.amount), 0);
  const pending = Math.max(0, memberExpTotal - settledTotal);
  
  const balance = totalInc - totalExp; // Actually club balance = Total Income - (Club paid expenses + Member reimbursements paid)
  // Wait, totalExp includes member expenses. The club hasn't lost that money YET if it's pending settlement.
  // Club Cash Balance = Income - ClubPaidExpenses - CompletedSettlements
  const clubPaidExpTotal = globalExpenses.filter(e => e.status === 'active' && e.paid_by_club).reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const actualCashBalance = totalInc - clubPaidExpTotal - settledTotal;
  
  document.getElementById('statTotalIncome').textContent = `₹${totalInc.toFixed(2)}`;
  document.getElementById('statTotalExpenses').textContent = `₹${totalExp.toFixed(2)}`;
  document.getElementById('statCurrentBalance').textContent = `₹${actualCashBalance.toFixed(2)}`;
  document.getElementById('statCurrentBalance').style.color = actualCashBalance >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('statPendingSettlements').textContent = `₹${pending.toFixed(2)}`;
}

// ─────────────────────────────────────────────
// SAVE HANDLERS
// ─────────────────────────────────────────────

document.getElementById('btnSaveExpense')?.addEventListener('click', async () => {
  const evName = document.getElementById('expenseEvent').value.trim();
  const eventId = allEvents.find(e => e.name === evName)?.id || null;
  const item = document.getElementById('expenseItem').value.trim();
  const cat = document.getElementById('expenseCategory').value;
  const amt = parseFloat(document.getElementById('expenseAmount').value);
  const date = document.getElementById('expenseDate').value;
  const mode = document.getElementById('expensePaidByMode').value;
  const memName = document.getElementById('expensePaidByMember').value.trim();
  const memId = allMembers.find(m => m.name === memName)?.id || null;
  const method = document.getElementById('expensePaymentMethod').value;
  
  if (!item || isNaN(amt) || !date) { await customAlert(); return; }
  if (mode === 'member' && !memId) { await customAlert(); return; }
  
  const payload = {
    event_id: eventId,
    expense_item: item,
    category: cat,
    amount: amt,
    expense_date: date,
    paid_by_club: mode === 'club',
    paid_by_member_id: mode === 'member' ? memId : null,
    payment_method: method
  };
  
  const { data: resData, error } = await sb.from('expenses').insert([payload]).select('id').single();
  if (error) {
    await customAlert();
    return;
  }
  
  auditLog('inserted', 'expenses', resData.id, { expense_item: item, amount: amt });
  
  closeModal('modalAddExpense');
  window.renderFinance();
});

let currentSettlementExpenseId = null;
window.openSettlementModal = function(expenseId, due) {
  currentSettlementExpenseId = expenseId;
  document.getElementById('settlementDueAmount').textContent = `₹${due.toFixed(2)}`;
  document.getElementById('settlementAmount').value = due.toFixed(2);
  document.getElementById('settlementDate').value = new Date().toISOString().split('T')[0];
  openModal('modalAddSettlement');
}

document.getElementById('btnSaveSettlement')?.addEventListener('click', async () => {
  if (!currentSettlementExpenseId) return;
  const amt = parseFloat(document.getElementById('settlementAmount').value);
  const date = document.getElementById('settlementDate').value;
  const method = document.getElementById('settlementPaymentMethod').value;
  
  if (isNaN(amt) || !date) { await customAlert(); return; }
  
  const { data: resData, error } = await sb.from('expense_settlements').insert([{
    expense_id: currentSettlementExpenseId,
    amount: amt,
    payment_date: date,
    payment_method: method
  }]).select('id').single();
  
  if (error) {
    await customAlert();
    return;
  }
  
  auditLog('inserted', 'expense_settlements', resData.id, { expense_id: currentSettlementExpenseId, amount: amt });
  
  closeModal('modalAddSettlement');
  window.renderFinance();
});

document.getElementById('btnSaveIncome')?.addEventListener('click', async () => {
  const type = document.getElementById('incomeType').value;
  const src = document.getElementById('incomeSource').value.trim();
  const evName = document.getElementById('incomeEvent').value.trim();
  const eventId = allEvents.find(e => e.name === evName)?.id || null;
  const amt = parseFloat(document.getElementById('incomeAmount').value);
  const date = document.getElementById('incomeDate').value;
  
  if (!src || isNaN(amt) || !date) { await customAlert(); return; }
  
  const payload = {
    income_type: type,
    source: src,
    event_id: eventId,
    amount: amt,
    income_date: date,
    payment_method: 'Other' // Default for now unless added to UI
  };
  
  const { data: resData, error } = await sb.from('income_transactions').insert([payload]).select('id').single();
  if (error) {
    await customAlert();
    return;
  }
  
  auditLog('inserted', 'income_transactions', resData.id, { source: src, amount: amt });
  
  closeModal('modalAddIncome');
  window.renderFinance();
});

window.voidExpense = async function(id) {
  if (!(await customConfirm())) return;
  const { error } = await sb.from('expenses').update({ status: 'voided' }).eq('id', id);
  if (error) {
    await customAlert();
  } else {
    auditLog('voided', 'expenses', id, { status: 'voided' });
    window.renderFinance();
  }
};

window.deleteExpense = async function(id) {
  if (!(await customConfirm())) return;
  const { error } = await sb.from('expenses').delete().eq('id', id);
  if (error) {
    await customAlert();
  } else {
    auditLog('deleted', 'expenses', id, { status: 'deleted' });
    window.renderFinance();
  }
};

window.voidIncome = async function(id) {
  if (!(await customConfirm())) return;
  const { error } = await sb.from('income_transactions').update({ status: 'voided' }).eq('id', id);
  if (error) {
    await customAlert();
  } else {
    auditLog('voided', 'income_transactions', id, { status: 'voided' });
    window.renderFinance();
  }
};
