// ============================================================
// ZERO GRAVITY — FINANCE MANAGEMENT MODULE (FIXED)
// ============================================================

// Finance Tabs Logic
document.querySelectorAll('.finance-nav-item').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.finance-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.finance-tab-content').forEach(s => {
      s.style.display = 'none';
      s.classList.remove('active');
    });
    
    e.target.classList.add('active');
    const targetId = e.target.getAttribute('data-finance-target');
    const targetEl = document.getElementById(targetId);
    targetEl.style.display = 'block';
    targetEl.classList.add('active');
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
  
  // Populate event SELECT dropdowns (using event ID, not name string)
  const eventOptions = allEvents.map(e => `<option value="${e.id}">${escapeHTML(e.name)} (${e.event_date})</option>`).join('');
  
  const expenseEventSelect = document.getElementById('expenseEventSelect');
  if (expenseEventSelect) {
    expenseEventSelect.innerHTML = '<option value="">No Event (General)</option>' + eventOptions;
  }
  
  const incomeEventSelect = document.getElementById('incomeEventSelect');
  if (incomeEventSelect) {
    incomeEventSelect.innerHTML = '<option value="">No Event (General)</option>' + eventOptions;
  }
  
  // Member datalist for expense paid-by (keep as datalist since it's name → id resolution for member)
  const memberListEl = document.getElementById('memberListOptions');
  if (memberListEl) {
    memberListEl.innerHTML = allMembers.map(m => `<option value="${escapeHTML(m.name)}">`).join('');
  }
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
    renderFinanceSponsorships(),
    renderFinanceLedger()
  ]);
  calculateFinanceTotals();
};

let globalExpenses = [];
let globalIncome = [];
let globalSettlements = [];

// ─────────────────────────────────────────────
// EVENT BUDGETS
// ─────────────────────────────────────────────
async function renderFinanceEvents() {
  const tbody = document.getElementById('financeEventsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><div class="att-loading"><div class="admin-spinner"></div><span>Loading budgets...</span></div></td></tr>';
  
  try {
    const { data: budgets, error } = await sb.from('event_budgets').select('*');
    const { data: expenses } = await sb.from('expenses').select('event_id, amount, status');
    
    if (error) throw error;
    
    if (allEvents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--admin-muted);">No events found. Create events first.</td></tr>';
      return;
    }
    
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
  } catch (err) {
    console.error('Finance events error:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red);">Error loading budgets: ${err.message}<br><br><button class="admin-btn small" onclick="renderFinanceEvents()">Retry</button></td></tr>`;
  }
}

window.promptSetBudget = async function(eventId, currentBudget) {
  const amt = prompt(`Enter new approved budget for this event (current: ₹${currentBudget}):`, currentBudget);
  if (amt === null || isNaN(parseFloat(amt)) || parseFloat(amt) < 0) return;
  
  try {
    const { data: existing } = await sb.from('event_budgets').select('id').eq('event_id', eventId).maybeSingle();
    
    if (existing) {
      const { error } = await sb.from('event_budgets').update({ approved_budget: parseFloat(amt) }).eq('id', existing.id);
      if (error) throw error;
      auditLog('updated', 'event_budgets', existing.id, { approved_budget: parseFloat(amt) });
    } else {
      const { data, error } = await sb.from('event_budgets').insert([{ event_id: eventId, approved_budget: parseFloat(amt) }]).select('id').single();
      if (error) throw error;
      auditLog('inserted', 'event_budgets', data.id, { event_id: eventId, approved_budget: parseFloat(amt) });
    }
    
    if (window.showToast) window.showToast('Budget updated successfully', 'success');
    renderFinanceEvents();
  } catch (err) {
    console.error('Budget update error:', err);
    await customAlert('Failed to update budget: ' + (err.message || 'Unknown error'), 'Error');
  }
};

// ─────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────
let editingExpenseId = null;

async function renderFinanceExpenses() {
  const filterSelect = document.getElementById('financeExpenseEventFilter');
  if (filterSelect && filterSelect.options.length <= 3) {
    try {
      const { data: events } = await sb.from('events').select('id, name').order('event_date', { ascending: false });
      if (events) {
        events.forEach(e => {
          const opt = document.createElement('option');
          opt.value = e.id;
          opt.textContent = e.name;
          filterSelect.appendChild(opt);
        });
      }
    } catch(err) {}
  }

  const tbody = document.getElementById('financeExpensesTableBody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;"><div class="att-loading"><div class="admin-spinner"></div><span>Loading expenses...</span></div></td></tr>';
  
  try {
    const { data, error } = await sb.from('expenses')
      .select('*, events(name), members(name)')
      .order('expense_date', { ascending: false });
      
    if (error) throw error;
    
    globalExpenses = data || [];
    renderFinanceExpensesList();
    
  } catch (err) {
    console.error('Expenses render error:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--red);">Error loading expenses<br><br><button class="admin-btn small" onclick="renderFinanceExpenses()">Retry</button></td></tr>`;
  }
}

window.renderFinanceExpensesList = function() {
  const tbody = document.getElementById('financeExpensesTableBody');
  const filterVal = document.getElementById('financeExpenseEventFilter').value;
  
  if (!filterVal) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--admin-muted); padding: 40px 0;">Please select an event to view expenditures.</td></tr>';
    return;
  }
  
  let filtered = globalExpenses;
  if (filterVal === 'GENERAL') {
    filtered = filtered.filter(e => !e.event_id);
  } else if (filterVal !== 'ALL') {
    filtered = filtered.filter(e => e.event_id === filterVal);
  }
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--admin-muted); padding: 40px 0;">No expenses recorded for this selection.</td></tr>';
    return;
  }
  
  tbody.innerHTML = filtered.map(e => `
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
        ${e.status !== 'voided' ? `
          <button class="admin-action-btn" onclick="editExpense('${e.id}')">Edit</button>
          <button class="admin-action-btn" style="color:var(--yellow);" onclick="voidExpense('${e.id}')">Void</button>
        ` : ''}
        <button class="admin-action-btn delete" onclick="deleteExpense('${e.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
};

// ─────────────────────────────────────────────
// INCOME
// ─────────────────────────────────────────────
let editingIncomeId = null;

async function renderFinanceIncome() {
  const tbody = document.getElementById('financeIncomeTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><div class="att-loading"><div class="admin-spinner"></div><span>Loading income...</span></div></td></tr>';
  
  try {
    const { data, error } = await sb.from('income_transactions')
      .select('*, events(name)')
      .order('income_date', { ascending: false });
      
    if (error) throw error;
    
    globalIncome = data || [];
    
    if (globalIncome.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--admin-muted);">No income recorded yet.</td></tr>';
      return;
    }
    
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
          ${i.status !== 'voided' ? `
            <button class="admin-action-btn" onclick="editIncome('${i.id}')">Edit</button>
            <button class="admin-action-btn" style="color:var(--yellow);" onclick="voidIncome('${i.id}')">Void</button>
          ` : ''}
          <button class="admin-action-btn delete" onclick="deleteIncome('${i.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Income render error:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red);">Error loading income<br><br><button class="admin-btn small" onclick="renderFinanceIncome()">Retry</button></td></tr>`;
  }
}

// ─────────────────────────────────────────────
// SETTLEMENTS
// ─────────────────────────────────────────────
async function renderFinanceSettlements() {
  const tbody = document.getElementById('financeSettlementsTableBody');
  
  try {
    const { data: settlements, error } = await sb.from('expense_settlements').select('expense_id, amount, status');
    if (error) throw error;
    globalSettlements = settlements || [];
    
    const memberExpenses = globalExpenses.filter(e => !e.paid_by_club && e.status === 'active');
    
    if (memberExpenses.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--admin-muted);">No pending settlements.</td></tr>';
      return;
    }
    
    const rows = memberExpenses.map(e => {
      const settledAmount = globalSettlements
        .filter(s => s.expense_id === e.id && s.status === 'completed')
        .reduce((sum, s) => sum + parseFloat(s.amount), 0);
        
      const due = parseFloat(e.amount) - settledAmount;
      
      if (due <= 0) return '';
      
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
    
    tbody.innerHTML = rows || '<tr><td colspan="5" style="text-align:center; color:var(--admin-muted);">All settlements completed.</td></tr>';
  } catch (err) {
    console.error('Settlements error:', err);
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--red);">Error loading settlements</td></tr>`;
  }
}

async function renderFinanceSponsorships() {
  document.getElementById('financeSponsorshipsTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--admin-muted);">Sponsorship finances coming soon in next update.</td></tr>';
}

function calculateFinanceTotals() {
  const totalInc = globalIncome.filter(i => i.status === 'active').reduce((sum, i) => sum + parseFloat(i.amount), 0);
  const totalExp = globalExpenses.filter(e => e.status === 'active').reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  const memberExpTotal = globalExpenses.filter(e => e.status === 'active' && !e.paid_by_club).reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const settledTotal = globalSettlements.filter(s => s.status === 'completed').reduce((sum, s) => sum + parseFloat(s.amount), 0);
  const pending = Math.max(0, memberExpTotal - settledTotal);
  
  const clubPaidExpTotal = globalExpenses.filter(e => e.status === 'active' && e.paid_by_club).reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const actualCashBalance = totalInc - clubPaidExpTotal - settledTotal;
  
  document.getElementById('statTotalIncome').textContent = `₹${totalInc.toFixed(2)}`;
  document.getElementById('statTotalExpenses').textContent = `₹${totalExp.toFixed(2)}`;
  document.getElementById('statCurrentBalance').textContent = `₹${actualCashBalance.toFixed(2)}`;
  document.getElementById('statCurrentBalance').style.color = actualCashBalance >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('statPendingSettlements').textContent = `₹${pending.toFixed(2)}`;
}

// ─────────────────────────────────────────────
// SAVE EXPENSE (FIXED — no duplicate execution)
// ─────────────────────────────────────────────
document.getElementById('btnSaveExpense')?.addEventListener('click', async () => {
  const eventId = document.getElementById('expenseEventSelect').value || null;
  const item = document.getElementById('expenseItem').value.trim();
  const cat = document.getElementById('expenseCategory').value;
  const amt = parseFloat(document.getElementById('expenseAmount').value);
  const date = document.getElementById('expenseDate').value;
  const mode = document.getElementById('expensePaidByMode').value;
  const memName = document.getElementById('expensePaidByMember').value.trim();
  const memId = allMembers.find(m => m.name === memName)?.id || null;
  const method = document.getElementById('expensePaymentMethod').value;
  
  if (!item) { await customAlert('Please enter an expense item/title.', 'Missing Field'); return; }
  if (isNaN(amt) || amt <= 0) { await customAlert('Please enter a valid positive amount.', 'Invalid Amount'); return; }
  if (!date) { await customAlert('Please select a date.', 'Missing Field'); return; }
  if (mode === 'member' && !memId) { await customAlert('Please select the member who paid.', 'Missing Field'); return; }
  
  const btn = document.getElementById('btnSaveExpense');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  
  try {
    let receiptUrl = null;
    const receiptInput = document.getElementById('expenseReceipt');
    if (receiptInput && receiptInput.files[0]) {
      receiptUrl = await uploadReceipt(receiptInput.files[0]);
    }
    
    const payload = {
      event_id: eventId,
      expense_item: item,
      category: cat,
      amount: amt,
      expense_date: date,
      paid_by_club: mode === 'club',
      paid_by_member_id: mode === 'member' ? memId : null,
      payment_method: method,
      receipt_url: receiptUrl
    };
    
    if (editingExpenseId) {
      // Edit mode
      const { error } = await sb.from('expenses').update(payload).eq('id', editingExpenseId);
      if (error) throw error;
      auditLog('updated', 'expenses', editingExpenseId, { expense_item: item, amount: amt });
      if (window.showToast) window.showToast('Expense updated successfully', 'success');
    } else {
      // Create mode
      const { data: resData, error } = await sb.from('expenses').insert([payload]).select('id').single();
      if (error) throw error;
      auditLog('inserted', 'expenses', resData.id, { expense_item: item, amount: amt });
      if (window.showToast) window.showToast('Expense recorded successfully', 'success');
    }
    
    editingExpenseId = null;
    closeModal('modalAddExpense');
    window.renderFinance();
    if (receiptInput) receiptInput.value = '';
  } catch (err) {
    console.error('Expense save error:', err);
    await customAlert('Failed to save expense: ' + (err.message || 'Unknown error'), 'Error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Expenditure';
  }
});

// Edit Expense
window.editExpense = async function(id) {
  const expense = globalExpenses.find(e => e.id === id);
  if (!expense) return;
  
  editingExpenseId = id;
  document.getElementById('expenseEventSelect').value = expense.event_id || '';
  document.getElementById('expenseItem').value = expense.expense_item || '';
  document.getElementById('expenseCategory').value = expense.category || 'Miscellaneous';
  document.getElementById('expenseAmount').value = expense.amount || '';
  document.getElementById('expenseDate').value = expense.expense_date || '';
  document.getElementById('expensePaidByMode').value = expense.paid_by_club ? 'club' : 'member';
  document.getElementById('expenseMemberGroup').style.display = expense.paid_by_club ? 'none' : 'block';
  
  if (!expense.paid_by_club && expense.members?.name) {
    document.getElementById('expensePaidByMember').value = expense.members.name;
  }
  document.getElementById('expensePaymentMethod').value = expense.payment_method || 'Cash';
  
  document.querySelector('#modalAddExpense .admin-modal-title').textContent = 'Edit Expenditure';
  openModal('modalAddExpense');
};

// ─────────────────────────────────────────────
// SETTLEMENT MODAL
// ─────────────────────────────────────────────
let currentSettlementExpenseId = null;
window.openSettlementModal = function(expenseId, due) {
  currentSettlementExpenseId = expenseId;
  document.getElementById('settlementDueAmount').textContent = `₹${due.toFixed(2)}`;
  document.getElementById('settlementAmount').value = due.toFixed(2);
  document.getElementById('settlementDate').value = new Date().toISOString().split('T')[0];
  openModal('modalAddSettlement');
};

// SAVE SETTLEMENT (FIXED — no duplicate execution)
document.getElementById('btnSaveSettlement')?.addEventListener('click', async () => {
  if (!currentSettlementExpenseId) return;
  const amt = parseFloat(document.getElementById('settlementAmount').value);
  const date = document.getElementById('settlementDate').value;
  const method = document.getElementById('settlementPaymentMethod').value;
  
  if (isNaN(amt) || amt <= 0) { await customAlert('Please enter a valid positive amount.', 'Invalid Amount'); return; }
  if (!date) { await customAlert('Please select a date.', 'Missing Field'); return; }
  
  const btn = document.getElementById('btnSaveSettlement');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  
  try {
    let receiptUrl = null;
    const receiptInput = document.getElementById('settlementReceipt');
    if (receiptInput && receiptInput.files[0]) {
      receiptUrl = await uploadReceipt(receiptInput.files[0]);
    }
    
    const { data: resData, error } = await sb.from('expense_settlements').insert([{
      expense_id: currentSettlementExpenseId,
      amount: amt,
      payment_date: date,
      payment_method: method,
      receipt_url: receiptUrl
    }]).select('id').single();
    
    if (error) throw error;
    
    auditLog('inserted', 'expense_settlements', resData.id, { expense_id: currentSettlementExpenseId, amount: amt });
    
    if (window.showToast) window.showToast('Settlement recorded successfully', 'success');
    closeModal('modalAddSettlement');
    window.renderFinance();
    if (receiptInput) receiptInput.value = '';
  } catch(err) {
    console.error('Settlement save error:', err);
    await customAlert('Failed to save settlement: ' + (err.message || 'Unknown error'), 'Error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Record Settlement';
  }
});

// ─────────────────────────────────────────────
// SAVE INCOME (FIXED — no duplicate execution)
// ─────────────────────────────────────────────
document.getElementById('btnSaveIncome')?.addEventListener('click', async () => {
  const type = document.getElementById('incomeType').value;
  const src = document.getElementById('incomeSource').value.trim();
  const eventId = document.getElementById('incomeEventSelect').value || null;
  const amt = parseFloat(document.getElementById('incomeAmount').value);
  const date = document.getElementById('incomeDate').value;
  
  if (!src) { await customAlert('Please enter a source/description.', 'Missing Field'); return; }
  if (isNaN(amt) || amt <= 0) { await customAlert('Please enter a valid positive amount.', 'Invalid Amount'); return; }
  if (!date) { await customAlert('Please select a date.', 'Missing Field'); return; }
  
  const btn = document.getElementById('btnSaveIncome');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  
  try {
    let receiptUrl = null;
    const receiptInput = document.getElementById('incomeReceipt');
    if (receiptInput && receiptInput.files[0]) {
      receiptUrl = await uploadReceipt(receiptInput.files[0]);
    }
    
    const payload = {
      income_type: type,
      source: src,
      event_id: eventId,
      amount: amt,
      income_date: date,
      payment_method: 'Other',
      receipt_url: receiptUrl
    };
    
    if (editingIncomeId) {
      const { error } = await sb.from('income_transactions').update(payload).eq('id', editingIncomeId);
      if (error) throw error;
      auditLog('updated', 'income_transactions', editingIncomeId, { source: src, amount: amt });
      if (window.showToast) window.showToast('Income updated successfully', 'success');
    } else {
      const { data: resData, error } = await sb.from('income_transactions').insert([payload]).select('id').single();
      if (error) throw error;
      auditLog('inserted', 'income_transactions', resData.id, { source: src, amount: amt });
      if (window.showToast) window.showToast('Income recorded successfully', 'success');
    }
    
    editingIncomeId = null;
    closeModal('modalAddIncome');
    window.renderFinance();
    if (receiptInput) receiptInput.value = '';
  } catch(err) {
    console.error('Income save error:', err);
    await customAlert('Failed to save income: ' + (err.message || 'Unknown error'), 'Error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Income';
  }
});

// Edit Income
window.editIncome = async function(id) {
  const income = globalIncome.find(i => i.id === id);
  if (!income) return;
  
  editingIncomeId = id;
  document.getElementById('incomeType').value = income.income_type || 'Other Income';
  document.getElementById('incomeSource').value = income.source || '';
  document.getElementById('incomeEventSelect').value = income.event_id || '';
  document.getElementById('incomeAmount').value = income.amount || '';
  document.getElementById('incomeDate').value = income.income_date || '';
  
  document.querySelector('#modalAddIncome .admin-modal-title').textContent = 'Edit Income';
  openModal('modalAddIncome');
};

// ─────────────────────────────────────────────
// VOID / DELETE ACTIONS
// ─────────────────────────────────────────────
window.voidExpense = async function(id) {
  if (!(await customConfirm('Are you sure you want to void this expense? The record will be kept but marked as voided.', 'Void Expense'))) return;
  try {
    const { error } = await sb.from('expenses').update({ status: 'voided' }).eq('id', id);
    if (error) throw error;
    auditLog('voided', 'expenses', id, { status: 'voided' });
    if (window.showToast) window.showToast('Expense voided', 'success');
    window.renderFinance();
  } catch (err) {
    await customAlert('Failed to void expense: ' + (err.message || 'Unknown error'), 'Error');
  }
};

window.deleteExpense = async function(id) {
  if (!(await customConfirm('Are you sure you want to permanently delete this expense? This action cannot be undone. Any related settlements will also be removed.', 'Delete Expense'))) return;
  try {
    const { error } = await sb.from('expenses').delete().eq('id', id);
    if (error) throw error;
    auditLog('deleted', 'expenses', id);
    if (window.showToast) window.showToast('Expense deleted', 'success');
    window.renderFinance();
  } catch (err) {
    await customAlert('Failed to delete expense: ' + (err.message || 'Unknown error'), 'Error');
  }
};

window.voidIncome = async function(id) {
  if (!(await customConfirm('Are you sure you want to void this income entry? The record will be kept but marked as voided.', 'Void Income'))) return;
  try {
    const { error } = await sb.from('income_transactions').update({ status: 'voided' }).eq('id', id);
    if (error) throw error;
    auditLog('voided', 'income_transactions', id, { status: 'voided' });
    if (window.showToast) window.showToast('Income voided', 'success');
    window.renderFinance();
  } catch (err) {
    await customAlert('Failed to void income: ' + (err.message || 'Unknown error'), 'Error');
  }
};

window.deleteIncome = async function(id) {
  if (!(await customConfirm('Are you sure you want to permanently delete this income entry? This action cannot be undone.', 'Delete Income'))) return;
  try {
    const { error } = await sb.from('income_transactions').delete().eq('id', id);
    if (error) throw error;
    auditLog('deleted', 'income_transactions', id);
    if (window.showToast) window.showToast('Income deleted', 'success');
    window.renderFinance();
  } catch (err) {
    await customAlert('Failed to delete income: ' + (err.message || 'Unknown error'), 'Error');
  }
};

// ─────────────────────────────────────────────
// RECEIPTS & LEDGER
// ─────────────────────────────────────────────
async function uploadReceipt(file) {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  
  const { error } = await sb.storage.from('receipts').upload(fileName, file);
  if (error) throw error;
  
  const { data } = sb.storage.from('receipts').getPublicUrl(fileName);
  return data.publicUrl;
}

async function renderFinanceLedger() {
  const tbody = document.getElementById('financeLedgerTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><div class="att-loading"><div class="admin-spinner"></div><span>Loading ledger...</span></div></td></tr>';
  
  const ledger = [];
  
  globalExpenses.forEach(e => {
    ledger.push({
      date: e.expense_date,
      type: 'Expense',
      desc: e.expense_item,
      amount: -parseFloat(e.amount),
      status: e.status,
      receipt: e.receipt_url || null,
      created_at: e.created_at
    });
  });
  
  globalIncome.forEach(i => {
    ledger.push({
      date: i.income_date,
      type: 'Income',
      desc: i.source,
      amount: parseFloat(i.amount),
      status: i.status,
      receipt: i.receipt_url || null,
      created_at: i.created_at
    });
  });
  
  globalSettlements.forEach(s => {
    ledger.push({
      date: s.payment_date || (s.created_at ? s.created_at.split('T')[0] : ''),
      type: 'Settlement',
      desc: 'Expense Reimbursement',
      amount: -parseFloat(s.amount),
      status: s.status,
      receipt: s.receipt_url || null,
      created_at: s.created_at
    });
  });
  
  ledger.sort((a, b) => {
    if (a.date === b.date) {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    return new Date(b.date) - new Date(a.date);
  });
  
  if (ledger.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--admin-muted);">No transactions found.</td></tr>';
    return;
  }
  
  tbody.innerHTML = ledger.map(t => {
    const isVoided = t.status === 'voided';
    const amtColor = isVoided ? 'var(--admin-muted)' : (t.amount >= 0 ? 'var(--green)' : 'var(--red)');
    const sign = t.amount >= 0 ? '+' : '';
    
    return `
      <tr style="${isVoided ? 'opacity:0.5; text-decoration:line-through;' : ''}">
        <td>${t.date}</td>
        <td><strong>${t.type}</strong></td>
        <td>${escapeHTML(t.desc)}</td>
        <td style="color:${amtColor}">${sign}₹${Math.abs(t.amount).toFixed(2)}</td>
        <td>
          <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:var(--panel-2); color:${isVoided?'var(--red)':'var(--admin-text)'}">
            ${t.status ? t.status.toUpperCase() : 'COMPLETED'}
          </span>
        </td>
        <td>
          ${t.receipt ? `<a href="${t.receipt}" target="_blank" style="color:var(--blue); font-size:12px;">View</a>` : '<span style="color:var(--admin-muted); font-size:12px;">None</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

// Reset expense modal on open for Add mode
const originalOpenModalFinance = window.openModal;
window.openModal = function(id) {
  if (id === 'modalAddExpense' && !editingExpenseId) {
    document.getElementById('expenseEventSelect').value = '';
    document.getElementById('expenseItem').value = '';
    document.getElementById('expenseCategory').value = 'Food';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('expensePaidByMode').value = 'club';
    document.getElementById('expenseMemberGroup').style.display = 'none';
    document.getElementById('expensePaidByMember').value = '';
    document.getElementById('expensePaymentMethod').value = 'Cash';
    document.querySelector('#modalAddExpense .admin-modal-title').textContent = 'Record Expenditure';
  }
  if (id === 'modalAddIncome' && !editingIncomeId) {
    document.getElementById('incomeType').value = 'Event Registration Fees';
    document.getElementById('incomeSource').value = '';
    document.getElementById('incomeEventSelect').value = '';
    document.getElementById('incomeAmount').value = '';
    document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
    document.querySelector('#modalAddIncome .admin-modal-title').textContent = 'Record Income';
  }
  originalOpenModalFinance(id);
};

// ─────────────────────────────────────────────
// MISSING CRUD FOR FINANCE
// ─────────────────────────────────────────────

window.editExpense = async function(id) {
  const expense = globalExpenses.find(e => e.id === id);
  if (!expense) return;
  editingExpenseId = id;
  
  document.getElementById('expenseEventSelect').value = expense.event_id || '';
  document.getElementById('expenseItem').value = expense.expense_item;
  document.getElementById('expenseCategory').value = expense.category;
  document.getElementById('expenseAmount').value = expense.amount;
  document.getElementById('expenseDate').value = expense.expense_date;
  
  document.getElementById('expensePaidByMode').value = expense.paid_by_club ? 'club' : 'member';
  if (!expense.paid_by_club) {
    document.getElementById('expenseMemberGroup').style.display = 'block';
    document.getElementById('expensePaidByMember').value = expense.paid_by_member_id || '';
  } else {
    document.getElementById('expenseMemberGroup').style.display = 'none';
  }
  
  document.getElementById('expensePaymentMethod').value = expense.payment_method;
  document.querySelector('#modalAddExpense .admin-modal-title').textContent = 'Edit Expenditure';
  openModal('modalAddExpense');
};

window.voidExpense = async function(id) {
  if (!await customConfirm('Are you sure you want to void this expense? It will remain in the database for auditing but will not affect balances.')) return;
  try {
    const { error } = await sb.from('expenses').update({ status: 'voided' }).eq('id', id);
    if (error) throw error;
    showToast('Expense voided successfully', 'success');
    renderFinanceData();
  } catch(err) {
    showToast(err.message, 'error');
  }
};

window.deleteExpense = async function(id) {
  if (!await customConfirm('Are you sure you want to permanently delete this expense? This action cannot be undone.')) return;
  try {
    const { error } = await sb.from('expenses').delete().eq('id', id);
    if (error) throw error;
    showToast('Expense deleted successfully', 'success');
    renderFinanceData();
  } catch(err) {
    showToast(err.message, 'error');
  }
};

window.editIncome = async function(id) {
  const income = globalIncome.find(i => i.id === id);
  if (!income) return;
  editingIncomeId = id;
  
  document.getElementById('incomeType').value = income.income_type;
  document.getElementById('incomeSource').value = income.source;
  document.getElementById('incomeEventSelect').value = income.event_id || '';
  document.getElementById('incomeAmount').value = income.amount;
  document.getElementById('incomeDate').value = income.income_date;
  
  document.querySelector('#modalAddIncome .admin-modal-title').textContent = 'Edit Income';
  openModal('modalAddIncome');
};

window.voidIncome = async function(id) {
  if (!await customConfirm('Are you sure you want to void this income? It will remain in the database for auditing but will not affect balances.')) return;
  try {
    const { error } = await sb.from('income_transactions').update({ status: 'voided' }).eq('id', id);
    if (error) throw error;
    showToast('Income voided successfully', 'success');
    renderFinanceData();
  } catch(err) {
    showToast(err.message, 'error');
  }
};

window.deleteIncome = async function(id) {
  if (!await customConfirm('Are you sure you want to permanently delete this income? This action cannot be undone.')) return;
  try {
    const { error } = await sb.from('income_transactions').delete().eq('id', id);
    if (error) throw error;
    showToast('Income deleted successfully', 'success');
    renderFinanceData();
  } catch(err) {
    showToast(err.message, 'error');
  }
};
