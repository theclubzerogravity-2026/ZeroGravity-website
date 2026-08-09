const fs = require('fs');

const htmlPath = 'd:\\Desktop\\zerogravity\\zerogravity-site\\admin.html';
let html = fs.readFileSync(htmlPath, 'utf8');

const modals = `
  <!-- Add Sponsor Modal -->
  <div class="admin-modal-overlay" id="modalAddSponsor">
    <div class="admin-modal">
      <div class="admin-modal-header">
        <div class="admin-modal-title">Add / Edit Sponsor</div>
        <button class="admin-modal-close" onclick="closeModal('modalAddSponsor')">&times;</button>
      </div>
      <div class="admin-form-group">
        <label>Company Name</label>
        <input type="text" id="sponsorName" class="admin-input">
      </div>
      <div class="admin-form-group">
        <label>Contact Email</label>
        <input type="email" id="sponsorEmail" class="admin-input">
      </div>
      <div class="admin-form-group">
        <label>Contact Mobile</label>
        <input type="text" id="sponsorMobile" class="admin-input">
      </div>
      <div class="admin-form-group">
        <label>Domain</label>
        <input type="text" id="sponsorDomain" class="admin-input">
      </div>
      <button class="admin-btn" id="btnSaveSponsor">Save Sponsor</button>
    </div>
  </div>

  <!-- Add Expense Modal -->
  <div class="admin-modal-overlay" id="modalAddExpense">
    <div class="admin-modal">
      <div class="admin-modal-header">
        <div class="admin-modal-title">Record Expenditure</div>
        <button class="admin-modal-close" onclick="closeModal('modalAddExpense')">&times;</button>
      </div>
      <div class="admin-form-group">
        <label>Event (Optional)</label>
        <select id="expenseEvent" class="admin-select"></select>
      </div>
      <div class="admin-form-group">
        <label>Expense Item / Title</label>
        <input type="text" id="expenseItem" class="admin-input">
      </div>
      <div class="admin-form-group">
        <label>Category</label>
        <select id="expenseCategory" class="admin-select">
          <option value="Food">Food</option>
          <option value="Decoration">Decoration</option>
          <option value="Printing">Printing</option>
          <option value="Transportation">Transportation</option>
          <option value="Venue">Venue</option>
          <option value="Equipment">Equipment</option>
          <option value="Marketing">Marketing</option>
          <option value="Merchandise">Merchandise</option>
          <option value="Prizes">Prizes</option>
          <option value="Certificates">Certificates</option>
          <option value="Speaker">Speaker</option>
          <option value="Photography">Photography</option>
          <option value="Miscellaneous">Miscellaneous</option>
        </select>
      </div>
      <div class="admin-form-group">
        <label>Amount (₹)</label>
        <input type="number" id="expenseAmount" class="admin-input" step="0.01">
      </div>
      <div class="admin-form-group">
        <label>Date</label>
        <input type="date" id="expenseDate" class="admin-input">
      </div>
      <div class="admin-form-group">
        <label>Paid By (Club or Member?)</label>
        <select id="expensePaidByMode" class="admin-select">
          <option value="club">Club Funds</option>
          <option value="member">Club Member (Reimbursement Pending)</option>
        </select>
      </div>
      <div class="admin-form-group" id="expenseMemberGroup" style="display:none;">
        <label>Select Member</label>
        <select id="expensePaidByMember" class="admin-select"></select>
      </div>
      <div class="admin-form-group">
        <label>Payment Method</label>
        <select id="expensePaymentMethod" class="admin-select">
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Card">Card</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <button class="admin-btn" id="btnSaveExpense">Save Expenditure</button>
    </div>
  </div>
  
  <!-- Add Settlement Modal -->
  <div class="admin-modal-overlay" id="modalAddSettlement">
    <div class="admin-modal">
      <div class="admin-modal-header">
        <div class="admin-modal-title">Record Settlement</div>
        <button class="admin-modal-close" onclick="closeModal('modalAddSettlement')">&times;</button>
      </div>
      <div class="admin-form-group">
        <p style="color:var(--admin-muted); margin-bottom:12px;">Amount Due: <strong id="settlementDueAmount" style="color:var(--white);">₹0.00</strong></p>
      </div>
      <div class="admin-form-group">
        <label>Settlement Amount (₹)</label>
        <input type="number" id="settlementAmount" class="admin-input" step="0.01">
      </div>
      <div class="admin-form-group">
        <label>Date</label>
        <input type="date" id="settlementDate" class="admin-input">
      </div>
      <div class="admin-form-group">
        <label>Payment Method</label>
        <select id="settlementPaymentMethod" class="admin-select">
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
      </div>
      <button class="admin-btn" id="btnSaveSettlement">Record Settlement</button>
    </div>
  </div>

  <!-- Add Income Modal -->
  <div class="admin-modal-overlay" id="modalAddIncome">
    <div class="admin-modal">
      <div class="admin-modal-header">
        <div class="admin-modal-title">Record Income</div>
        <button class="admin-modal-close" onclick="closeModal('modalAddIncome')">&times;</button>
      </div>
      <div class="admin-form-group">
        <label>Income Type</label>
        <select id="incomeType" class="admin-select">
          <option value="Event Registration Fees">Event Registration Fees</option>
          <option value="Membership Fees">Membership Fees</option>
          <option value="Merchandise">Merchandise</option>
          <option value="Donations">Donations</option>
          <option value="Grants">Grants</option>
          <option value="Other Income">Other Income</option>
        </select>
      </div>
      <div class="admin-form-group">
        <label>Source / Description</label>
        <input type="text" id="incomeSource" class="admin-input">
      </div>
      <div class="admin-form-group">
        <label>Event (Optional)</label>
        <select id="incomeEvent" class="admin-select"></select>
      </div>
      <div class="admin-form-group">
        <label>Amount (₹)</label>
        <input type="number" id="incomeAmount" class="admin-input" step="0.01">
      </div>
      <div class="admin-form-group">
        <label>Date</label>
        <input type="date" id="incomeDate" class="admin-input">
      </div>
      <button class="admin-btn" id="btnSaveIncome">Save Income</button>
    </div>
  </div>
`;

if (!html.includes('id="modalAddSponsor"')) {
  html = html.replace('<!-- ==================== MODALS ==================== -->', '<!-- ==================== MODALS ==================== -->\n' + modals);
}

const scriptTags = `
  <script src="js/admin_sponsors.js"></script>
  <script src="js/admin_finance.js"></script>
  <script src="js/admin_audit.js"></script>
`;

if (!html.includes('admin_sponsors.js')) {
  html = html.replace('<script src="js/admin.js"></script>', '<script src="js/admin.js"></script>\n' + scriptTags);
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('admin.html patched');
