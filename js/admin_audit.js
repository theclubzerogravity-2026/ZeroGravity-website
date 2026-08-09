window.renderAuditLogs = async function() {
  const tbody = document.getElementById('auditLogsTableBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading audit logs...</td></tr>';
  
  // Fetch profiles for mapping actor email securely
  const { data: profiles } = await sb.from('admin_profiles').select('user_id, email');
  const emailMap = {};
  if (profiles) {
    profiles.forEach(p => emailMap[p.user_id] = p.email);
  }
  
  const { data, error } = await sb.from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (error) {
    console.error("Audit Logs fetch error:", error);
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--red);">Failed to load audit logs.</td></tr>';
    return;
  }
  
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--admin-muted);">No audit logs found.</td></tr>';
    return;
  }
  
  tbody.innerHTML = data.map(log => {
    let dateStr = new Date(log.created_at).toLocaleString();
    let actorEmail = emailMap[log.actor_user_id] || log.actor_user_id || 'System';
    let actionStyle = 'color:var(--white);';
    if (log.action.includes('insert') || log.action.includes('created')) actionStyle = 'color:var(--green);';
    if (log.action.includes('update')) actionStyle = 'color:var(--blue);';
    if (log.action.includes('delete') || log.action.includes('voided')) actionStyle = 'color:var(--red);';
    
    return `
      <tr>
        <td style="font-size:12px; color:var(--admin-muted);">${dateStr}</td>
        <td>${escapeHTML(actorEmail)}</td>
        <td><strong style="${actionStyle}">${escapeHTML(log.action.toUpperCase())}</strong></td>
        <td>${escapeHTML(log.resource_type || '-')}</td>
        <td style="font-size:12px; color:var(--admin-muted); max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHTML(JSON.stringify(log.metadata || ''))}">
          ID: ${escapeHTML(log.resource_id || '-')}
        </td>
      </tr>
    `;
  }).join('');
};

window.renderSettings = async function() {
  const { data: { session } } = await sb.auth.getSession();
  if (session && session.user) {
    document.getElementById('settingsEmail').textContent = session.user.email;
  }
};

document.getElementById('btnRequestPasswordReset')?.addEventListener('click', async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (!session || !session.user) return;
  
  const msgEl = document.getElementById('settingsMessage');
  msgEl.textContent = 'Sending...';
  msgEl.style.color = 'var(--blue)';
  
  const { error } = await sb.auth.resetPasswordForEmail(session.user.email, {
    redirectTo: window.location.origin + '/admin.html'
  });
  
  if (error) {
    msgEl.textContent = 'Error: ' + error.message;
    msgEl.style.color = 'var(--red)';
  } else {
    msgEl.textContent = 'A password reset link has been sent to your email.';
    msgEl.style.color = 'var(--green)';
  }
});
