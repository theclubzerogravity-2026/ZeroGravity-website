let currentSponsorId = null;

window.renderSponsors = async function() {
  const tbody = document.getElementById('sponsorsTableBody');
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
  
  const { data, error } = await sb.from('sponsors').select('*').order('created_at', { ascending: false });
  
  if (error) {
    console.error("Sponsors fetch error:", error);
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--red);">Failed to load sponsors.</td></tr>';
    return;
  }
  
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--admin-muted);">No sponsors found.</td></tr>';
    return;
  }
  
  tbody.innerHTML = data.map(s => `
    <tr>
      <td><strong>${escapeHTML(s.company_name)}</strong></td>
      <td>
        <div>${escapeHTML(s.email || '-')}</div>
        <div style="font-size:12px; color:var(--admin-muted);">${escapeHTML(s.mobile || '-')}</div>
      </td>
      <td>${escapeHTML(s.domain || '-')}</td>
      <td>
        <button class="admin-btn small secondary" onclick="editSponsor('${s.id}')">Edit</button>
        <button class="admin-btn small danger" style="margin-left:4px;" onclick="deleteSponsor('${s.id}', '${escapeHTML(s.company_name).replace(/'/g, "\\'")}')" >Delete</button>
      </td>
    </tr>
  `).join('');
};

window.editSponsor = async function(id) {
  currentSponsorId = id;
  const { data, error } = await sb.from('sponsors').select('*').eq('id', id).single();
  if (error) {
    await customAlert('Failed to load sponsor details.', 'Error');
    return;
  }
  
  document.getElementById('sponsorName').value = data.company_name || '';
  document.getElementById('sponsorEmail').value = data.email || '';
  document.getElementById('sponsorMobile').value = data.mobile || '';
  document.getElementById('sponsorDomain').value = data.domain || '';
  
  document.querySelector('#modalAddSponsor .admin-modal-title').textContent = 'Edit Sponsor';
  openModal('modalAddSponsor');
};

document.getElementById('btnSaveSponsor')?.addEventListener('click', async () => {
  const name = document.getElementById('sponsorName').value.trim();
  const email = document.getElementById('sponsorEmail').value.trim();
  const mobile = document.getElementById('sponsorMobile').value.trim();
  const domain = document.getElementById('sponsorDomain').value.trim();
  
  if (!name) { await customAlert('Please enter a company name.', 'Missing Field'); return; }
  
  const payload = {
    company_name: name,
    email: email || null,
    mobile: mobile || null,
    domain: domain || null
  };
  
  try {
    let result;
    if (currentSponsorId) {
      result = await sb.from('sponsors').update(payload).eq('id', currentSponsorId);
      if (!result.error) auditLog('updated', 'sponsors', currentSponsorId, { company_name: name });
    } else {
      result = await sb.from('sponsors').insert([payload]).select('id').single();
      if (!result.error && result.data) auditLog('inserted', 'sponsors', result.data.id, { company_name: name });
    }
    
    if (result.error) throw result.error;
    
    closeModal('modalAddSponsor');
    window.renderSponsors();
  } catch (err) {
    await customAlert('Failed to save sponsor. Check the console for details.', 'Error');
    console.error("Sponsor save error:", err);
  }
});

// Override openModal for Add Sponsor
const originalOpenModalSponsor = window.openModal;
window.openModal = function(id) {
  if (id === 'modalAddSponsor') {
    currentSponsorId = null;
    document.getElementById('sponsorName').value = '';
    document.getElementById('sponsorEmail').value = '';
    document.getElementById('sponsorMobile').value = '';
    document.getElementById('sponsorDomain').value = '';
    document.querySelector('#modalAddSponsor .admin-modal-title').textContent = 'Add Sponsor';
  }
  originalOpenModalSponsor(id);
};
window.deleteSponsor = async function(id, name) {
  if (!(await customConfirm(`Are you sure you want to delete sponsor "${name}"? Any associated sponsorship records will also be removed.`, 'Delete Sponsor'))) return;

  try {
    const { error } = await sb.from('sponsors').delete().eq('id', id);
    if (error) throw error;
    auditLog('deleted', 'sponsors', id, { company_name: name });
    if (window.showToast) window.showToast('Sponsor deleted', 'success');
    window.renderSponsors();
  } catch (err) {
    console.error('Sponsor delete error:', err);
    await customAlert('Failed to delete sponsor: ' + (err.message || 'Unknown error'), 'Error');
  }
};
