/* Updates section (REQ-UPD-001 to 012). Loaded after catalog.js and detail.js and uses their helpers.
   Sources are read only when "Check for updates" is pressed; a skill changes only after a confirmed "Update". */
(() => {
  'use strict';
  let S = null, polling = null, opener = null;
  const drawer = $('detail');
  const skillOf = id => D.skills.find(s => s.id === id) || { id, name: id, category: '', description: '' };
  const items = st => (S?.items || []).filter(i => i.status === st);
  const fmtTime = t => new Date(t).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const ver = v => v ? `${v.version ? `v${esc(v.version)} · ` : ''}<code>${esc(v.short)}</code>${v.date ? ` · ${esc(dateText(v.date))}` : ''}` : '';
  const yours = i => (i.files || []).filter(f => f.yours && f.yours !== 'deleted'); // his changes this update replaces
  const keptDeleted = i => (i.files || []).filter(f => f.yours === 'deleted').map(f => f.path); // he deleted them; they stay deleted
  const CHANGE = { added: 'Added', modified: 'Changed', removed: 'Removed' };
  const YOURS = { edited: 'you changed it', deleted: 'you deleted it; it stays deleted', added: 'you have your own file with this name' };
  window.updatesCount = () => (S ? items('update').length || '' : '');

  function secLine(i) {
    const s = i.security || {}, c = s.counts || {}, n = (c.revisar || 0) + (c.caducada || 0);
    if (s.status === 'done') {
      if (s.level === 'critico') return ['bad', `Security check: critical finding in the new version${S.blockCritical ? '. Update is blocked' : ''}`];
      if (s.level === 'revisar') return ['warn', `Security check: ${plural(n, 'finding')} to review before updating`];
      if (s.level === 'info') return ['ok', 'Security check: only minor notes, nothing to review'];
      return ['ok', 'Security check: nothing to review'];
    }
    if (s.status === 'pending') return ['warn', 'Security check: not run yet. Press Check for updates'];
    if (s.status === 'unavailable') return ['bad', 'Security check could not run: the scanner is not installed'];
    return ['bad', s.error || 'Security check could not run on the new version'];
  }
  const secHTML = i => { const [k, t] = secLine(i); return `<p class="upd-security ${k}">${svg(k === 'ok' ? 'shieldCheck' : 'shield')}${esc(t)}</p>`; };
  function actions(i, inDrawer) {
    const id = esc(i.id), c = esc(i.latest.commit), why = i.can && !i.can.ok ? i.can.why : '';
    return `<div class="watch-actions">${inDrawer ? '' : `<button type="button" class="outline" data-upd-review="${id}">Review changes</button>`}
      <button type="button" class="${inDrawer ? 'primary' : 'outline'}" data-upd-apply="${id}" data-commit="${c}"${why ? ` disabled aria-describedby="upd-why-${id}${inDrawer ? '-d' : ''}"` : ''}>Update</button>
      <button type="button" class="text-button" data-upd-skip="${id}" data-commit="${c}">Skip this version</button></div>
      ${why ? `<p class="upd-why" id="upd-why-${id}${inDrawer ? '-d' : ''}">Update is not available: ${esc(why)}</p>` : ''}`;
  }
  function row(i) {
    const s = skillOf(i.id), y = yours(i);
    return `<article class="update-row" style="--hue:${hue(s.category)}">${tile(s)}<div class="update-copy">
      <h2><button type="button" class="watch-name" data-upd-review="${esc(i.id)}">${esc(s.name)}</button></h2>
      <p class="update-version">Installed ${ver(i.base)} → <b>new ${ver(i.latest)}</b> · ${esc(i.repo)}</p>
      <p class="upd-summary">${esc(i.summary)}</p>${secHTML(i)}
      ${y.length ? `<p class="upd-warning">${svg('shield')}You changed ${plural(y.length, 'of these files', 'of these files')} by hand (${esc(y.map(f => f.path).join(', '))}). Update replaces ${y.length === 1 ? 'it' : 'them'}; your version is saved first.</p>` : ''}
      ${actions(i)}</div></article>`;
  }

  window.renderUpdates = function renderUpdates() {
    const box = $('other-view');
    if (!SRV) { box.innerHTML = '<p class="view-description">Updates need the local server. Open Skill Dex.app to use this section.</p>'; return; }
    if (!S) { box.innerHTML = '<p class="empty">Loading…</p>'; return; }
    const busy = S.busy, upd = items('update'), cant = [...items('unknown'), ...items('error')], ok = items('up-to-date'), skippedItems = items('skipped');
    const skippedList = Object.entries(S.skipped || {}).flatMap(([id, l]) => l.map(v => ({ id, ...v })));
    const checked = S.last_checked ? `Last checked: ${esc(fmtTime(S.last_checked))}` : 'Not checked yet';
    let h = `<div class="upd-toolbar"><p>${checked}<br><span class="muted">Sources are read only when you press the button. Nothing updates by itself.</span></p>
      <button type="button" class="outline" id="upd-check"${busy ? ' disabled' : ''}>${svg('refresh')}${busy?.kind === 'check' ? 'Checking…' : 'Check for updates'}</button></div>
      <p class="upd-progress" role="status" aria-live="polite">${busy ? `${esc(busy.step)}${busy.total ? ` (${busy.done} of ${busy.total})` : ''}…` : S.error ? esc(S.error) : ''}</p>`;
    if (!S.checked_at) h += `<section class="update-empty"><h2>No check yet</h2><p>Press <b>Check for updates</b> to compare your third-party skills with their source repositories. The check only reads; it changes nothing. New versions get a security check before you can apply them.</p></section>`;
    else if (!upd.length) h += `<section class="update-empty"><span class="icon-tile" style="--hue:${hue('SEO')}" aria-hidden="true">${svg('shieldCheck')}</span><h2>Everything is up to date</h2><p>${plural(ok.length, 'third-party skill')} checked against ${ok.length === 1 ? 'its source' : 'their sources'}${skippedItems.length ? `; ${plural(skippedItems.length, 'skipped version')} hidden` : ''}.${cant.length ? ` ${plural(cant.length, 'skill')} could not be checked (below).` : ''}</p></section>`;
    else h += `<h2 class="upd-heading">${plural(upd.length, 'update')} available</h2>${upd.map(row).join('')}`;
    if (cant.length) h += `<section class="upd-group" aria-labelledby="upd-cant"><h2 id="upd-cant">Could not be checked <span class="muted">${cant.length}</span></h2>
      <p class="muted small">These are not reported as up to date: Skill Dex could not compare them with a source.</p>
      <ul class="upd-plain">${cant.map(i => `<li><b>${esc(skillOf(i.id).name)}</b> <span class="status">${i.status === 'unknown' ? 'Source unknown' : 'Check failed'}</span><br><span class="muted">${esc(i.reason)}</span></li>`).join('')}</ul></section>`;
    const noSource = items('no-source');
    if (noSource.length) h += `<section class="upd-group"><h2>No update source <span class="muted">${noSource.length}</span></h2>
      <ul class="upd-plain">${noSource.map(i => `<li><b>${esc(skillOf(i.id).name)}</b> <span class="muted">${esc(i.reason)}</span></li>`).join('')}</ul></section>`;
    if (skippedList.length) h += `<details class="upd-group"><summary>Skipped versions <span class="muted">${skippedList.length}</span></summary>
      <p class="muted small">A skipped version is not listed again. A newer version of the same skill will be.</p>
      <ul class="upd-plain">${skippedList.map(v => `<li><b>${esc(skillOf(v.id).name)}</b> ${v.version ? `v${esc(v.version)} · ` : ''}<code>${esc(v.short)}</code>${v.date ? ` · ${esc(dateText(v.date))}` : ''} <button type="button" class="text-button" data-upd-unskip="${esc(v.id)}" data-commit="${esc(v.commit)}">Show again</button></li>`).join('')}</ul></details>`;
    if (ok.length) h += `<details class="upd-group"><summary>Up to date <span class="muted">${ok.length}</span></summary>
      <ul class="upd-plain upd-cols">${ok.map(i => `<li><b>${esc(skillOf(i.id).name)}</b> ${ver(i.base)}${i.backup ? ` · updated now, your previous version is in <code>${esc(i.backup)}</code>` : ''}</li>`).join('')}</ul></details>`;
    if (S.checked_at) h += `<p class="footer-note">Only skills that come from outside are checked. ${plural(S.own || 0, 'skill')} of your own and ${plural(S.selfLearned || 0, 'self-learned skill')} come from no repository and are left out.</p>`;
    h += `<p class="footer-note">Update saves a copy of your current version in ${esc(S.backupDir || `${D.dataDir}/backups`)} first, and only writes the files the new version changes.</p>`;
    box.innerHTML = h;
  };

  // ---------- Review changes (side panel) ----------
  function review(id, trigger) {
    const i = (S?.items || []).find(x => x.id === id && ['update', 'skipped'].includes(x.status));
    if (!i) return;
    const s = skillOf(id), y = yours(i), le = i.localEdits || { edited: [], added: [], missing: [] };
    const touched = new Set(i.files.map(f => f.path));
    const keptEdited = le.edited.filter(p => !touched.has(p)), keptAdded = le.added.filter(p => !touched.has(p));
    const sec = i.security || {}, findings = [...(sec.revisar || []), ...(sec.caducada || [])];
    const gh = i.github ? `https://github.com/${i.github}` : '';
    if (!drawer.open) opener = trigger || document.activeElement;
    $('detail-category').textContent = 'Updates / Review changes';
    $('detail-body').dataset.kind = 'u'; $('detail-body').dataset.id = id;
    $('detail-body').innerHTML = `${tile(s)}<h2 id="detail-title" tabindex="-1">${esc(s.name)}</h2><p class="full-description">${esc(shortLine(s))}</p>
      <section class="drawer-section"><h3>Versions</h3><dl class="upd-dl"><div><dt>Installed</dt><dd>${ver(i.base)}</dd></div><div><dt>New</dt><dd>${ver(i.latest)}</dd></div><div><dt>Source</dt><dd>${gh ? `<a href="${esc(gh)}" target="_blank" rel="noopener noreferrer">${esc(i.github)}<span class="sr-only"> (opens in a new tab)</span></a>` : esc(i.repo)}${i.path ? ` · <code>${esc(i.path)}</code>` : ''}</dd></div></dl>
        ${gh ? `<p><a class="text-button" href="${esc(`${gh}/compare/${i.base.commit}...${i.latest.commit}`)}" target="_blank" rel="noopener noreferrer">See every line that changed on GitHub<span class="sr-only"> (opens in a new tab)</span></a></p>` : ''}</section>
      <section class="drawer-section"><h3>What changes</h3><p>${esc(i.summary)}</p>
        <ul class="upd-files">${i.files.map(f => `<li><span class="badge ${f.change}">${CHANGE[f.change]}</span><code>${esc(f.path)}</code>${f.yours ? `<span class="upd-yours">${esc(YOURS[f.yours])}</span>` : ''}</li>`).join('')}</ul>
        ${i.commits?.length ? `<h4>Notes from the author${i.commitCount > i.commits.length ? ` (latest ${i.commits.length} of ${i.commitCount})` : ''}</h4><ul class="upd-commits">${i.commits.map(c => `<li><span class="muted">${esc(dateText(c.date))}</span> ${esc(c.subject)}</li>`).join('')}</ul>` : ''}</section>
      <section class="drawer-section"><h3>Your changes</h3>
        ${y.length ? `<p class="upd-warning">${svg('shield')}You changed ${esc(y.map(f => f.path).join(', '))} by hand. Updating replaces ${y.length === 1 ? 'that file' : 'those files'} with the new version. Skill Dex saves a copy of your whole current version first, so you can get your changes back.</p>` : '<p>None of your own changes are replaced by this update.</p>'}
        ${keptEdited.length || keptAdded.length ? `<p>Kept as you have them: ${esc([...keptEdited, ...keptAdded.map(p => `${p} (added by you)`)].join(', '))}.</p>` : ''}
        ${keptDeleted(i).length ? `<p>You deleted ${plural(keptDeleted(i).length, 'file')} that the new version changes (${esc(keptDeleted(i).join(', '))}). ${keptDeleted(i).length === 1 ? 'It stays' : 'They stay'} deleted.</p>` : ''}
        ${i.extraFiles ? '<p>Its ORIGEN.md says this skill also includes files copied from other places of the repository. Those stay as they are.</p>' : ''}</section>
      <section class="drawer-section"><h3>Security check of the new version</h3>${secHTML(i)}
        ${findings.length ? `<ul class="upd-findings">${findings.map(f => `<li><b>${esc(f.cat)}: ${esc(f.pattern)}</b> <code>${esc(f.file)}${f.line ? `:${esc(f.line)}` : ''}</code><br><span class="muted">“${esc(f.snippet)}”</span>${f.why ? `<br><span class="muted">${esc(f.why)}</span>` : ''}</li>`).join('')}</ul>` : ''}
        ${sec.status === 'done' ? `<p class="muted small">SkillSpector, static and without AI, with your false-positive criterion. ${sec.counts?.info ? `${plural(sec.counts.info, 'minor note')}. ` : ''}A clean scan is not a guarantee.</p>` : ''}</section>
      ${i.status === 'update' ? `<section class="drawer-section"><h3>Your decision</h3>${actions(i, true)}</section>` : '<section class="drawer-section"><p>You skipped this version.</p></section>'}`;
    if (!drawer.open) { drawer.showModal(); drawer.addEventListener('close', () => { if (opener?.isConnected) opener.focus(); opener = null; }, { once: true }); }
    drawer.scrollTop = 0;
    $('detail-title').focus({ preventScroll: true });
  }

  // ---------- Update with confirmation (REQ-UPD-010) ----------
  const confirmDlg = document.createElement('dialog');
  confirmDlg.className = 'analyse-dialog upd-confirm'; confirmDlg.id = 'upd-confirm'; confirmDlg.setAttribute('aria-labelledby', 'upd-confirm-title');
  document.body.appendChild(confirmDlg);
  let asked = null; // focus goes back to the skill's Update button when the confirmation closes
  confirmDlg.addEventListener('close', () => { document.querySelector(`.update-row [data-upd-apply="${CSS.escape(asked || '')}"]`)?.focus(); });
  function askUpdate(id, commit) {
    const i = (S?.items || []).find(x => x.id === id && x.latest?.commit === commit);
    if (!i || !i.can?.ok) return;
    const s = skillOf(id), y = yours(i), kd = new Set(keptDeleted(i));
    const writes = i.files.filter(f => f.change !== 'removed' && !kd.has(f.path)).length, removes = i.files.filter(f => f.change === 'removed').length;
    const sec = i.security, findings = [...(sec.revisar || []), ...(sec.caducada || [])];
    confirmDlg.innerHTML = `<form method="dialog" id="upd-form"><h2 id="upd-confirm-title">Update ${esc(s.name)}?</h2>
      <p>First, a copy of your current version is saved in <b>${esc(S.backupDir || `${D.dataDir}/backups`)}/${esc(id)}/</b>. Then Skill Dex writes ${plural(writes, 'file')}${removes ? ` and removes ${removes}` : ''} that the new version changes. Everything else in the skill stays as you have it.</p>
      ${y.length ? `<p class="upd-warning">${svg('shield')}Your changes to ${esc(y.map(f => f.path).join(', '))} will be replaced. They stay in the copy.</p>` : ''}
      ${i.can.needsAck ? `<div class="upd-ack"><p><b>${plural(findings.length, 'security finding')} to review:</b></p><ul class="upd-findings">${findings.slice(0, 5).map(f => `<li>${esc(f.cat)}: ${esc(f.pattern)} <code>${esc(f.file)}${f.line ? `:${esc(f.line)}` : ''}</code></li>`).join('')}</ul>
        <label><input type="checkbox" id="upd-ack"> I have read the security findings and still want to update</label></div>` : ''}
      <p class="upd-confirm-msg" role="status" aria-live="polite"></p>
      <div class="dialog-buttons"><button type="submit" class="outline" value="cancel" autofocus>Cancel</button><button type="button" class="primary" id="upd-go"${i.can.needsAck ? ' disabled' : ''}>Update</button></div></form>`;
    const go = $('upd-go'), ack = $('upd-ack');
    ack?.addEventListener('change', () => { go.disabled = !ack.checked; });
    go.addEventListener('click', async () => {
      go.disabled = true; confirmDlg.querySelectorAll('button').forEach(b => { b.disabled = true; });
      confirmDlg.querySelector('.upd-confirm-msg').textContent = 'Saving your version and updating…';
      const r = await post('/api/updates/apply', { id, commit, ack: !!ack?.checked });
      if (r?.ok) {
        try { sessionStorage.setItem('skilldex.upd-toast', `${s.name} is updated. Your previous version is in ${r.data.backup}.`); } catch {}
        reloadTo('updates');
      } else {
        confirmDlg.querySelector('.upd-confirm-msg').textContent = `Nothing was changed. ${r?.data?.error || ''}`;
        confirmDlg.querySelector('[value=cancel]').disabled = false;
      }
    });
    if (drawer.open) drawer.close();
    asked = id;
    confirmDlg.showModal();
  }

  async function skip(id, commit) {
    const r = await post('/api/updates/skip', { id, commit });
    if (!r) return;
    if (!r.ok) { alert(r.data.error || 'Could not skip'); return; }
    if (drawer.open) drawer.close();
    toast('Version skipped. The skill was not changed. You can show it again under Skipped versions.');
    await load();
  }
  async function unskip(id, commit) { const r = await post('/api/updates/unskip', { id, commit }); if (r && !r.ok) alert(r.data.error); await load(); }
  async function check() {
    const r = await post('/api/updates/check', {});
    if (!r) return;
    if (!r.ok) { alert(r.data.error || 'Could not start the check'); return; }
    await load();
    $('upd-check')?.focus();
  }

  async function load() {
    if (!SRV) return;
    try { S = await (await fetch('/api/updates')).json(); } catch { return; }
    renderNav();
    if (view === 'updates') { const f = document.activeElement?.id; renderUpdates(); if (f && $(f)) $(f).focus(); }
    if (S.busy && !polling) polling = setInterval(async () => {
      const was = S.busy;
      try { S = await (await fetch('/api/updates')).json(); } catch { return; }
      if (!S.busy) {
        clearInterval(polling); polling = null;
        if (was?.kind === 'check') toast(S.error ? S.error : items('update').length ? `Check finished: ${plural(items('update').length, 'update')} found.` : 'Check finished: everything is up to date.');
      }
      renderNav(); if (view === 'updates') { const f = document.activeElement?.id; renderUpdates(); if (f && $(f)) $(f).focus(); }
    }, 1500);
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (b.id === 'upd-check') check();
    else if (d.updReview) review(d.updReview, b);
    else if (d.updApply) askUpdate(d.updApply, d.commit);
    else if (d.updSkip) skip(d.updSkip, d.commit);
    else if (d.updUnskip) unskip(d.updUnskip, d.commit);
  });

  try { const m = sessionStorage.getItem('skilldex.upd-toast'); if (m) { sessionStorage.removeItem('skilldex.upd-toast'); setTimeout(() => toast(m), 300); } } catch {}
  load();
  if (view === 'updates') renderUpdates();
})();
