/* Detail side panel. Loaded after catalog.js; exposes openDetail(kind, id) with kind 's' (installed) or 'w' (watchlist). */
(() => {
  'use strict';
  const drawer = $('detail'), body = $('detail-body');
  const text = v => esc(v == null ? '' : v);
  const num = v => Number(v || 0).toLocaleString('en-US');
  const metric = (value, label) => `<div><dt>${text(label)}</dt><dd>${text(value)}</dd></div>`;
  let opener = null;

  // Minimal markdown renderer for the analysis reports (escapes everything first).
  function md(src) {
    const e = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const inl = s => e(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    const L = String(src).replace(/<!--[\s\S]*?-->/g, '').split('\n'), LI = /^\s*([-*]|\d+\.)\s+/;
    let o = '', i = 0;
    while (i < L.length) {
      const l = L[i];
      if (/^```/.test(l)) { const c = []; i++; while (i < L.length && !/^```/.test(L[i])) c.push(L[i++]); i++; o += `<pre>${e(c.join('\n'))}</pre>`; continue; }
      const m = l.match(/^(#{1,4})\s+(.*)/);
      if (m) { const n = m[1].length + 1; o += `<h${n}>${inl(m[2])}</h${n}>`; i++; continue; }
      if (LI.test(l)) { const t = /^\s*\d+\./.test(l) ? 'ol' : 'ul', it = []; while (i < L.length && LI.test(L[i])) it.push(inl(L[i++].replace(LI, ''))); o += `<${t}>${it.map(x => `<li>${x}</li>`).join('')}</${t}>`; continue; }
      if (/^\s*\|/.test(l)) {
        const rows = []; while (i < L.length && /^\s*\|/.test(L[i])) rows.push(L[i++]);
        const cl = r => r.trim().replace(/^\||\|$/g, '').split('|').map(x => x.trim()), hd = cl(rows[0]), bd = rows.slice(/^[\s|:-]+$/.test(rows[1] || '') ? 2 : 1);
        o += `<table><thead><tr>${hd.map(x => `<th>${inl(x)}</th>`).join('')}</tr></thead><tbody>${bd.map(r => `<tr>${cl(r).map(x => `<td>${inl(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`; continue;
      }
      if (/^>/.test(l)) { const q = []; while (i < L.length && /^>/.test(L[i])) q.push(L[i++].replace(/^>\s?/, '')); o += `<blockquote>${inl(q.join(' '))}</blockquote>`; continue; }
      if (/^---+\s*$/.test(l)) { o += '<hr>'; i++; continue; }
      if (!l.trim()) { i++; continue; }
      const p = [L[i++]];
      while (i < L.length && L[i].trim() && !/^(#{1,4}\s|```|\s*([-*]|\d+\.)\s|\s*\||>|---+\s*$)/.test(L[i])) p.push(L[i++]);
      o += `<p>${inl(p.join(' '))}</p>`;
    }
    return o;
  }

  // Whole sections of a report by heading; the full report stays available below.
  function reportSection(report, name) {
    const lines = String(report || '').split('\n');
    let start = -1, level = 0;
    for (let i = 0; i < lines.length; i++) {
      const h = lines[i].match(/^(#{2,6})\s+(.+)$/);
      if (!h) continue;
      if (start !== -1 && h[1].length <= level) return lines.slice(start, i).join('\n').trim();
      if (start === -1 && name.test(h[2])) { start = i + 1; level = h[1].length; }
    }
    return start === -1 ? '' : lines.slice(start).join('\n').trim();
  }

  function fullReport(s, installed) {
    return `<section class="drawer-section" aria-labelledby="detail-report-title"><h3 id="detail-report-title">Full analysis</h3>${s.report
      ? `<details class="disclosure"${installed ? '' : ' open'}><summary>Read the full report<span>Sources, reviews, activation and recommendation</span></summary><div class="md">${md(s.report)}</div></details>`
      : `<p>${installed ? 'This skill has no analysis report of its own.' : s.status === 'analizando' ? 'The report will appear here when the analysis finishes. Analysing never installs the skill.' : 'No report for this entry yet.'}</p>`}</section>`;
  }

  function finding(f) {
    return `<li class="finding"><p class="finding-label">${text([f.sev, f.cat].filter(Boolean).join(' · '))}</p><p><strong>${text(f.pattern)}</strong></p><p>${text(f.file)}${f.line ? ':' + text(f.line) : ''}${f.conf != null ? ` · Confidence ${text(Math.round(f.conf * 100))}%` : ''}</p>${f.snippet ? `<pre><code>${text(f.snippet)}</code></pre>` : ''}${f.why ? `<p>${text(f.why)}</p>` : ''}${f.why2 && f.why2 !== f.why ? `<p>${text(f.why2)}</p>` : ''}</li>`;
  }

  // A closed false positive with the condition of the approved criterion that justifies it (REQ-SEC-005, D-056).
  function closedFinding(f) {
    const who = f.by === 'auto' ? 'closed automatically' : f.by === 'owner' ? 'decided by you' : 'closed after review';
    const head = [f.cond ? `Condition ${f.cond}` : '', who, f.closed ? longDate(f.closed) : ''].filter(Boolean).join(' · ');
    return `<li class="finding reviewed"><p class="finding-label">${text(head)}</p>${f.condText ? `<p><strong>${text(f.condText)}</strong></p>` : ''}<p>${text([f.sev, f.cat, f.pattern].filter(Boolean).join(' · '))}</p><p>${text(f.file)}${f.line ? ':' + text(f.line) : ''}${f.conf != null ? ` · Confidence ${text(Math.round(f.conf * 100))}%` : ''}</p>${f.snippet ? `<pre><code>${text(f.snippet)}</code></pre>` : ''}${f.by !== 'auto' && f.why2 ? `<p>Review note: ${text(f.why2)}</p>` : ''}</li>`;
  }

  // Security after triage (REQ-SEC-003, REQ-SEC-005, REQ-SEC-006, REQ-SEC-009, REQ-SEC-010).
  function security(s, installed) {
    const x = s.security, fromReport = reportSection(s.report, /seguridad|security|riesgos|risks/i);
    let content;
    if (!x) content = `<div class="sec-summary"><strong>No security scan</strong><p>${installed ? 'This skill has not been scanned yet. Not having a scan does not mean it is safe.' : 'No SkillSpector scan is attached to this entry. Check the security part of the report before considering it.'}</p></div>`;
    else {
      const c = x.counts || {}, pend = (x.revisar || []).concat(x.caducada || []), info = x.info || [];
      const closed = (x.revisada || []).concat(x.ruido || []), nClosed = (c.revisada || 0) + (c.ruido || 0), nPend = (c.revisar || 0) + (c.caducada || 0);
      const labels = { limpia: 'No security alerts', info: 'Minor notices only', revisar: 'Needs your review', critico: 'Critical findings' };
      const attention = pend.length > 0 || ['revisar', 'critico'].includes(x.level);
      content = `<div class="sec-summary ${attention ? 'attention-box' : x.level === 'limpia' ? 'clean' : ''}"><strong>${text(labels[x.level] || 'Scan recorded')}</strong><p>${num(nPend)} to check · ${num(c.info)} minor notices · ${num(nClosed)} closed as false positives. A static scan is not a guarantee of safety.</p></div>
        ${pend.length ? `<ul class="findings" aria-label="Findings waiting for your decision">${pend.map(finding).join('')}</ul>` : ''}
        <details class="disclosure"><summary>Scan and triage data<span>SkillSpector · coverage ${text(x.coverage ?? '?')}%</span></summary><dl class="facts">${metric(x.level || 'None', 'Level after triage')}${metric(x.raw || 'Not recorded', 'Raw result')}${metric(num(x.rawIssues), 'Raw findings')}${metric(`${x.coverage ?? '?'}%`, 'Coverage')}${metric(longDate(x.scanned), 'Scanned')}</dl><p>The raw result does not include triage. Findings still pending need your decision.</p></details>
        ${info.length ? `<details class="disclosure"><summary>Minor notices (${num(c.info)})</summary><ul class="findings">${info.map(finding).join('')}</ul></details>` : ''}
        ${closed.length ? `<details class="disclosure"><summary>Closed as false positives (${num(nClosed)})<span>Each one names the condition of your approved criterion that justifies it</span></summary><ul class="findings">${closed.map(closedFinding).join('')}</ul><p>Never closed without showing you: anything critical, anything that may send your data to the internet, delete files outside its folder, ask for passwords or keys, or install programs.</p></details>` : ''}`;
    }
    return `<section class="drawer-section" aria-labelledby="detail-security-title"><h3 id="detail-security-title">Security</h3>${content}${fromReport ? `<details class="disclosure"><summary>What the report says about security</summary><div class="md">${md(fromReport)}</div></details>` : ''}</section>`;
  }

  function usage(s) {
    const values = days.map(d => s.usage?.days?.[d] || 0);
    const recorded = Object.entries(s.usage?.days || {}).sort(([a], [b]) => b.localeCompare(a));
    const note = total(s) === 0 ? 'Still untried. Consider whether it could help on a current project. Reviewing never removes it.'
      : season(s) === 0 ? 'No uses this season yet. It may simply be waiting for the right task. Earlier uses stay as history and earn no XP.'
      : 'Already helping this season. Each season use earns 10 XP.';
    return `<section class="drawer-section" aria-labelledby="detail-usage-title"><h3 id="detail-usage-title">How you use it</h3>
      <div class="detail-stats"><div><b>${season(s)}</b><span>This season · ${season(s) * 10} XP</span></div><div><b>${before(s)}</b><span>Before season · no XP</span></div><div><b>${total(s)}</b><span>All time</span></div></div>
      <p>Last used: ${text(dateText(s.usage?.last))}.</p>
      <div class="chart" role="img" aria-label="Daily uses over the last 30 days: ${days.map((d, i) => dateText(d) + ': ' + values[i]).join('; ')}">${chartHTML(values)}</div>
      <div class="chart-axis" aria-hidden="true"><span>${dateText(days[0])}</span><span>${dateText(days[29])}</span></div>
      <p>${note}</p>
      ${levelLine(s)}
      <details class="disclosure"><summary>Uses by date<span>Full recorded history, not only the last 30 days</span></summary>${recorded.length ? `<div class="table-wrap"><table><caption>Recorded uses per day</caption><thead><tr><th scope="col">Date</th><th scope="col">Uses</th></tr></thead><tbody>${recorded.map(([d, n]) => `<tr><th scope="row">${text(longDate(d))}</th><td>${num(n)}</td></tr>`).join('')}</tbody></table></div>` : '<p>No uses recorded yet.</p>'}</details>
    </section>`;
  }

  // The skill's own level from its season uses, and its rarity from its size (REQ-USE-009, REQ-USE-013).
  function levelLine(s) {
    const lv = skillLevel(s), next = (lv + 1) ** 2 - season(s);
    return `<p class="skill-level"><span class="skill-mark">${rarityDot(s)}Level ${lv} · ${rarity(s)}</span> ${plural(next, 'more season use')} to level ${lv + 1}. Rarity comes from its size: ${num(s.lines)} lines, ${plural(s.files || 0, 'file')}.</p>`;
  }

  const favouriteAction = s => {
    const on = !!g(s.id).f;
    return `<div class="detail-actions" role="group" aria-label="Organise this skill"><button type="button" class="outline" data-detail-favourite aria-pressed="${on}">${on ? 'In favourites' : 'Add to favourites'}</button></div><p class="feedback" role="status" aria-live="polite"></p>`;
  };

  function installedDetail(s) {
    return `${tile(s)}<h2 id="detail-title" tabindex="-1">${text(s.name)}</h2><p class="full-description">${text(s.description || 'No description recorded.')}</p>
      <div class="badges">${s.project ? `<span class="badge">Project: ${text(s.project)}</span>` : `<span class="badge">Installed</span><span class="badge">${text(ORIGINS[s.origin] || s.origin)}</span>`}${s.version ? `<span class="badge">v${text(s.version)}</span>` : ''}</div>
      ${s.project ? `<p class="project-note">Lives in the ${text(s.project)} project. omp loads it only in sessions opened there. Skill Dex only reads it.</p>` : ''}
      ${favouriteAction(s)}${usage(s)}${security(s, true)}${fullReport(s, true)}
      <section class="drawer-section"><details class="disclosure"><summary>Technical sheet<span>Context, files and local path</span></summary><dl class="facts">${metric('~' + num(s.descTokens), 'Description tokens, every session')}${metric('~' + num(s.bodyTokens), 'Tokens when activated')}${metric(num(s.lines), 'Lines')}${metric(num(s.files), 'Files')}${s.author ? metric(s.author, 'Author') : ''}</dl><p class="path"><strong>Local path</strong><code>${text(s.path)}</code></p></details></section>`;
  }

  // Earlier discards kept when an entry was recovered or analysed again (REQ-ANA-024), newest first.
  function discardHistory(s) {
    const list = Array.isArray(s.discard_history) ? s.discard_history : [];
    if (!list.length) return '';
    const ended = h => ({ recovered: 'Recovered to the watchlist', reanalysed: 'Analysed again', replaced: 'Discarded again with a new reason' }[h.ended] || 'Closed') + (h.ended_at ? ' on ' + text(longDate(h.ended_at)) : '') + '.';
    return `<section class="drawer-section" aria-labelledby="detail-history-title"><h3 id="detail-history-title">Earlier discards</h3><ul class="discard-history">${list.slice().reverse().map(h => `<li><strong>${h.discarded_at ? 'Discarded on ' + text(longDate(h.discarded_at)) : 'Discarded (date not recorded)'}</strong><p>${text(h.reason || 'No reason recorded.')}${h.reason_from === 'verdict' ? ' <span class="muted">(the report verdict at the time)</span>' : ''}</p><p class="muted">${ended(h)}</p></li>`).join('')}</ul></section>`;
  }

  function watchDetail(s) {
    const reviews = reportSection(s.report, /reseñas|reviews|puntuación|score/i);
    const activation = reportSection(s.report, /activa|cómo se usa|activation|trigger/i);
    const discarded = s.status === 'descartada';
    return `${tile(s)}<h2 id="detail-title" tabindex="-1">${text(s.name)}</h2><p class="full-description">${text(s.description || s.note || 'No description recorded.')}</p>
      <div class="badges"><span class="badge">${text(statusName(s))}</span><span class="badge">Not installed</span>${s.analyzed_at ? `<span class="badge">Analysed ${text(longDate(s.analyzed_at))}</span>` : ''}</div>
      ${discarded ? `<div class="notice-box"><strong>Discarded${s.discarded_at ? ' on ' + text(longDate(s.discarded_at)) : ''}</strong><p>${text(s.discard_reason || s.verdict || 'No reason recorded.')}</p><p>The investigation is kept so you do not repeat it.</p></div>` : ''}
      ${s.status === 'error' ? `<div class="notice-box error" role="alert"><strong>The analysis could not be completed</strong><p>${text(s.error || '')}</p></div>` : ''}
      ${discardHistory(s)}
      <div class="detail-actions">${wlActs(s, true)}</div>
      <section class="drawer-section" aria-labelledby="detail-reviews-title"><h3 id="detail-reviews-title">Reviews &amp; score</h3><p><strong>${s.score != null ? text(s.score) + ' / 10' : 'No score yet'}</strong>${s.score != null ? ' · the analysis score, not an average of community reviews.' : ''}</p>${reviews ? `<details class="disclosure"><summary>Reviews and the reasons for the score</summary><div class="md">${md(reviews)}</div></details>` : ''}</section>
      ${activation ? `<section class="drawer-section" aria-labelledby="detail-activation-title"><h3 id="detail-activation-title">How it runs</h3><details class="disclosure"><summary>Automatic or manual, and how it is used</summary><div class="md">${md(activation)}</div></details></section>` : ''}
      <section class="drawer-section" aria-labelledby="detail-verdict-title"><h3 id="detail-verdict-title">Recommendation</h3>${s.verdict ? `<p class="verdict">${text(s.verdict)}</p>` : '<p>No recommendation recorded yet.</p>'}${s.note && s.note !== s.description ? `<p>${text(s.note)}</p>` : ''}<p>Analysing or recommending a skill never installs it. Installation happens only when you ask for it.</p></section>
      ${security(s, false)}${fullReport(s, false)}
      ${safeSource(s.source) ? `<p class="source"><strong>Original source</strong><a href="${text(s.source)}" target="_blank" rel="noopener noreferrer">${text(s.source)}<span class="sr-only"> (opens in a new tab)</span></a></p>` : ''}`;
  }

  window.openDetail = function openDetail(kind, id) {
    const installed = kind !== 'w', s = (installed ? D.skills : D.watchlist).find(x => x.id === id);
    if (!s) return;
    if (!drawer.open) opener = document.activeElement;
    $('detail-category').textContent = `${catName(s.category)} / ${installed ? (s.project ? `Project ${s.project}` : 'Installed') : s.status === 'descartada' ? 'Discarded' : 'Watchlist'}`;
    body.dataset.kind = installed ? 's' : 'w'; body.dataset.id = s.id;
    body.innerHTML = installed ? installedDetail(s) : watchDetail(s);
    if (!drawer.open) drawer.showModal();
    drawer.scrollTop = 0;
    $('detail-title').focus({ preventScroll: true });
  };

  $('detail-close').addEventListener('click', () => drawer.close());
  // Esc closes natively; a click on the backdrop closes too (REQ-CAT-010).
  drawer.addEventListener('click', e => { if (e.target === drawer) drawer.close(); });
  drawer.addEventListener('close', () => { if (opener?.isConnected) opener.focus(); opener = null; });
  body.addEventListener('click', e => {
    const b = e.target.closest('[data-detail-favourite]');
    if (!b) return;
    const s = D.skills.find(x => x.id === body.dataset.id);
    if (!s) return;
    g(s.id).f = !g(s.id).f; save();
    const on = !!g(s.id).f;
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? 'In favourites' : 'Add to favourites';
    body.querySelector('.feedback').textContent = on ? 'Added to favourites.' : 'Removed from favourites.';
    renderLibrary();
  });
})();
