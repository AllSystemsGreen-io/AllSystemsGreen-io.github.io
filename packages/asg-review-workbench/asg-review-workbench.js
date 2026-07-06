(function () {
  const DEFAULT_ACTIONS = [
    { id: 'approve', label: 'Approve', key: 'a', tone: 'good' },
    { id: 'reject', label: 'Reject', key: 'r', tone: 'bad' },
    { id: 'flag', label: 'Flag', key: 'f', tone: 'warn' },
    { id: 'defer', label: 'Defer', key: 'd', tone: 'neutral' },
    { id: 'merge', label: 'Merge', key: 'm', tone: 'merge' },
  ];
  const RECENT_LIMIT = 100;

  function mount(root, options) {
    const config = normalizeConfig(options);
    const state = {
      mode: 'table',
      items: [],
      selectedId: null,
      checked: new Set(),
      query: '',
      status: 'Loading review queue...',
      busy: false,
      commentOpen: false,
      drawerOpen: false,
      recentOpen: false,
      comment: '',
      recent: readRecent(config.workflowId),
    };

    root.classList.add('asg-review-workbench');

    const setState = (patch) => {
      Object.assign(state, typeof patch === 'function' ? patch(state) : patch);
      render();
    };

    const selectedItem = () => state.items.find((item) => String(item.id) === String(state.selectedId)) || state.items[0] || null;
    const visibleItems = () => {
      const needle = state.query.trim().toLowerCase();
      if (!needle) return state.items;
      return state.items.filter((item) => [
        item.title,
        item.subtitle,
        item.summary,
        item.status,
        item.reason,
        item.batch,
        item.source,
        item.type,
      ].some((value) => String(value || '').toLowerCase().includes(needle)));
    };

    const load = async () => {
      setState({ status: 'Loading review queue...' });
      try {
        const payload = await config.load();
        const items = (payload.items || []).map(normalizeItem);
        state.items = items;
        state.selectedId = state.selectedId && items.some((item) => String(item.id) === String(state.selectedId))
          ? state.selectedId
          : items[0]?.id || null;
        state.checked = new Set([...state.checked].filter((id) => items.some((item) => String(item.id) === String(id))));
        state.status = payload.status || `${items.length} item${items.length === 1 ? '' : 's'} loaded`;
      } catch (err) {
        state.status = err.message || 'Review queue failed to load.';
      }
      state.busy = false;
      render();
    };

    const nextAfter = (id) => {
      const items = visibleItems();
      const index = Math.max(0, items.findIndex((item) => String(item.id) === String(id)));
      return items[index + 1]?.id || items[index - 1]?.id || items[0]?.id || null;
    };

    const applyAction = async (actionId, ids, { stay = false, comment = state.comment } = {}) => {
      if (state.busy) return;
      const targetIds = (ids && ids.length ? ids : [selectedItem()?.id]).filter(Boolean).map(String);
      if (!targetIds.length) return;
      const action = config.actions.find((entry) => entry.id === actionId);
      if (!action) return;

      let details = { comment: String(comment || '').trim() };
      if (actionId === 'merge') {
        details = await mergeDetails(targetIds, details);
        if (!details) return;
      }

      state.busy = true;
      state.status = `${action.label} ${targetIds.length} item${targetIds.length === 1 ? '' : 's'}...`;
      render();
      try {
        const payload = await config.decide({ action: actionId, ids: targetIds, details });
        const now = new Date().toISOString();
        targetIds.forEach((id) => addRecent(config.workflowId, {
          id,
          action: actionId,
          label: action.label,
          comment: details.comment || '',
          at: now,
          itemTitle: state.items.find((item) => String(item.id) === String(id))?.title || id,
        }));
        state.recent = readRecent(config.workflowId);
        state.checked.clear();
        state.comment = '';
        state.commentOpen = false;
        state.drawerOpen = false;
        state.status = payload.status || `${action.label} saved`;
        if (!stay && state.mode === 'single') state.selectedId = nextAfter(targetIds[targetIds.length - 1]);
        await load();
      } catch (err) {
        state.status = err.message || 'Action failed.';
        state.busy = false;
        render();
      }
    };

    const deleteSelected = async () => {
      const item = selectedItem();
      if (!item || !config.deleteItem) return;
      const label = item.title || item.id;
      const confirmation = window.prompt(`Type DELETE to permanently delete:\n${label}`);
      if (confirmation !== 'DELETE') return;
      state.busy = true;
      state.status = 'Deleting item...';
      render();
      try {
        await config.deleteItem({ id: item.id });
        addRecent(config.workflowId, {
          id: item.id,
          action: 'delete',
          label: 'Delete',
          at: new Date().toISOString(),
          itemTitle: label,
        });
        state.recent = readRecent(config.workflowId);
        state.selectedId = nextAfter(item.id);
        await load();
      } catch (err) {
        state.status = err.message || 'Delete failed.';
        state.busy = false;
        render();
      }
    };

    const mergeDetails = async (ids, base) => {
      if (ids.length > 1) {
        return { ...base, merge_group: ids };
      }
      const target = window.prompt('Merge target record/item ID');
      if (!target) return null;
      return { ...base, merge_target_id: target };
    };

    const render = () => {
      const items = visibleItems();
      const current = selectedItem();
      document.body?.classList.toggle('asg-review-focus-lock', state.mode === 'single' && root.isConnected);
      if (state.mode === 'single') {
        root.innerHTML = focusView(current, state, config, items);
        bind();
        return;
      }
      root.innerHTML = `
        <div class="rw-shell">
          <header class="rw-toolbar">
            <div>
              <p class="rw-eyebrow">${escape(config.kicker)}</p>
              <h3>${escape(config.title)}</h3>
            </div>
            <div class="rw-toolbar-controls">
              <input class="rw-search" data-rw-search placeholder="Search queue" value="${escapeAttr(state.query)}">
              <div class="rw-segment" role="group" aria-label="Review mode">
                <button type="button" data-rw-mode="table" class="${state.mode === 'table' ? 'active' : ''}">Table</button>
                <button type="button" data-rw-mode="single" class="${state.mode === 'single' ? 'active' : ''}">Single</button>
              </div>
            </div>
          </header>

          <div class="rw-queuebar">
            <div class="rw-actionbar">
              ${config.actions.map((action) => actionButton(action, state.checked.size > 0)).join('')}
              ${config.deleteItem ? '<button type="button" class="rw-button danger-ghost" data-rw-delete>Delete</button>' : ''}
              <button type="button" class="rw-button ghost" data-rw-comment>Comment</button>
            </div>
            <div class="rw-meta-line" aria-live="polite">
              <span>${escape(String(state.items.length))} loaded</span>
              <span>${escape(String(items.length))} visible</span>
              <span>${escape(String(state.checked.size))} selected</span>
              <span>${escape(String(state.recent.length))} recent</span>
              <strong>${escape(state.status)}</strong>
            </div>
          </div>

          ${state.commentOpen ? `<textarea class="rw-comment" data-rw-comment-box placeholder="Optional comment">${escape(state.comment)}</textarea>` : ''}

          ${tableView(items, current, state, config)}

          <details class="rw-recent" data-rw-recent ${state.recentOpen ? 'open' : ''}>
            <summary>
              <span>Recent decisions</span>
              <small>${escape(String(state.recent.length))}</small>
            </summary>
            <div class="rw-recent-list">
              ${state.recent.length ? state.recent.slice(0, 12).map((entry) => `
                <button type="button" class="rw-recent-row" data-rw-recent-id="${escapeAttr(entry.id)}">
                  <span>${escape(entry.label)} - ${escape(entry.itemTitle || entry.id)}</span>
                  <small>${escape(relativeTime(entry.at))}</small>
                </button>
              `).join('') : '<div class="rw-empty">No decisions yet.</div>'}
            </div>
          </details>
        </div>
      `;
      bind();
    };

    const bind = () => {
      root.querySelector('[data-rw-search]')?.addEventListener('input', (event) => {
        state.query = event.target.value;
        render();
      });
      root.querySelectorAll('[data-rw-mode]').forEach((button) => {
        button.addEventListener('click', () => {
          state.mode = button.getAttribute('data-rw-mode');
          state.drawerOpen = false;
          render();
        });
      });
      root.querySelector('[data-rw-back-table]')?.addEventListener('click', () => {
        state.mode = 'table';
        state.drawerOpen = false;
        state.commentOpen = false;
        render();
      });
      root.querySelector('[data-rw-drawer-toggle]')?.addEventListener('click', () => {
        state.drawerOpen = !state.drawerOpen;
        render();
      });
      root.querySelector('[data-rw-drawer-close]')?.addEventListener('click', () => {
        state.drawerOpen = false;
        render();
      });
      root.querySelectorAll('[data-rw-row]').forEach((row) => {
        row.addEventListener('click', (event) => {
          if (event.target.closest('input,button,a')) return;
          state.selectedId = row.getAttribute('data-rw-row');
          render();
        });
      });
      root.querySelectorAll('[data-rw-check]').forEach((box) => {
        box.addEventListener('change', () => {
          const id = box.getAttribute('data-rw-check');
          if (box.checked) state.checked.add(id);
          else state.checked.delete(id);
          render();
        });
      });
      root.querySelectorAll('[data-rw-action]').forEach((button) => {
        button.addEventListener('click', () => {
          const ids = state.checked.size ? [...state.checked] : [selectedItem()?.id].filter(Boolean);
          applyAction(button.getAttribute('data-rw-action'), ids, { stay: false });
        });
      });
      root.querySelector('[data-rw-delete]')?.addEventListener('click', deleteSelected);
      root.querySelector('[data-rw-comment]')?.addEventListener('click', () => {
        state.commentOpen = true;
        render();
        root.querySelector('[data-rw-comment-box]')?.focus();
      });
      root.querySelector('[data-rw-comment-box]')?.addEventListener('input', (event) => {
        state.comment = event.target.value;
      });
      root.querySelector('[data-rw-recent]')?.addEventListener('toggle', (event) => {
        state.recentOpen = event.target.open;
      });
      root.querySelectorAll('[data-rw-recent-id]').forEach((button) => {
        button.addEventListener('click', () => {
          const id = button.getAttribute('data-rw-recent-id');
          if (state.items.some((item) => String(item.id) === String(id))) {
            state.selectedId = id;
            state.mode = 'single';
            render();
          }
        });
      });
    };

    const keyHandler = (event) => {
      if (!root.isConnected || root.offsetParent === null) return;
      const tag = event.target?.tagName?.toLowerCase();
      if (event.key === 'Escape' && (state.drawerOpen || state.commentOpen || state.mode === 'single')) {
        event.preventDefault();
        if (state.drawerOpen || state.commentOpen) {
          state.drawerOpen = false;
          state.commentOpen = false;
        } else {
          state.mode = 'table';
        }
        render();
        return;
      }
      if (tag === 'textarea') return;
      if (event.key === 'Tab') {
        event.preventDefault();
        state.commentOpen = true;
        render();
        root.querySelector('[data-rw-comment-box]')?.focus();
        return;
      }
      if (tag === 'input' || tag === 'select') return;
      const key = event.key.toLowerCase();
      if (state.mode === 'single' && key === 'e') {
        event.preventDefault();
        state.drawerOpen = !state.drawerOpen;
        render();
        return;
      }
      const action = config.actions.find((entry) => entry.key === key);
      if (action) {
        event.preventDefault();
        applyAction(action.id, [selectedItem()?.id].filter(Boolean), { stay: event.shiftKey });
      }
      if (key === 'j' || key === 'k') {
        event.preventDefault();
        const items = visibleItems();
        const index = items.findIndex((item) => String(item.id) === String(state.selectedId));
        const nextIndex = key === 'j' ? Math.min(items.length - 1, index + 1) : Math.max(0, index - 1);
        state.selectedId = items[nextIndex]?.id || state.selectedId;
        render();
      }
    };

    document.addEventListener('keydown', keyHandler);
    root.__asgReviewUnmount = () => {
      document.removeEventListener('keydown', keyHandler);
      document.body?.classList.remove('asg-review-focus-lock');
    };
    load();
    return { reload: load, unmount: root.__asgReviewUnmount };
  }

  function tableView(items, current, state, config) {
    return `
      <div class="rw-main table-mode">
        <div class="rw-table-wrap">
          <table class="rw-table">
            <thead><tr>
              <th><span class="sr-only">Select</span></th>
              ${config.columns.map((column) => `<th>${escape(column.label)}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${items.map((item) => `<tr data-rw-row="${escapeAttr(item.id)}" class="${current && String(item.id) === String(current.id) ? 'active' : ''}">
                <td><input type="checkbox" data-rw-check="${escapeAttr(item.id)}" ${state.checked.has(String(item.id)) ? 'checked' : ''}></td>
                ${config.columns.map((column) => `<td>${cell(item, column)}</td>`).join('')}
              </tr>`).join('') || `<tr><td colspan="${config.columns.length + 1}">No matching review items.</td></tr>`}
            </tbody>
          </table>
        </div>
        ${detailPane(current)}
      </div>
    `;
  }

  function focusView(item, state, config, items) {
    if (!item) {
      return `
        <div class="rw-focus">
          <header class="rw-focus-topbar">
            <button type="button" class="rw-focus-back" data-rw-back-table>Back</button>
            <div class="rw-focus-titleline">
              <span class="rw-eyebrow">${escape(config.itemLabel)}</span>
              <strong>No review items</strong>
            </div>
          </header>
          <main class="rw-focus-stage">
            <div class="rw-focus-empty">No review items.</div>
          </main>
        </div>
      `;
    }
    const index = Math.max(0, items.findIndex((entry) => String(entry.id) === String(item.id))) + 1;
    const meta = [
      item.source && `Source: ${item.source}`,
      item.batch && `Batch: ${item.batch}`,
      item.reason && `Reason: ${item.reason}`,
    ].filter(Boolean).join(' | ');
    return `
      <div class="rw-focus">
        <header class="rw-focus-topbar">
          <button type="button" class="rw-focus-back" data-rw-back-table>Back</button>
          <div class="rw-focus-titleline">
            <span class="rw-eyebrow">${escape(item.type || config.itemLabel)} ${index}/${items.length || 1}</span>
            <strong>${escape(item.title)}</strong>
            ${item.subtitle ? `<small>${escape(item.subtitle)}</small>` : ''}
          </div>
          <div class="rw-focus-top-actions">
            ${statusPill(item.status)}
            <button type="button" class="rw-button ghost" data-rw-drawer-toggle title="E">Details</button>
          </div>
        </header>
        <main class="rw-focus-stage">
          <article class="rw-focus-item">
            ${item.summary ? `<section class="rw-focus-summary">${escape(item.summary)}</section>` : ''}
            ${meta ? `<div class="rw-focus-meta">${escape(meta)}</div>` : ''}
            ${focusMarkdown(item)}
          </article>
        </main>
        ${state.commentOpen ? commentSheet(state) : ''}
        ${state.drawerOpen ? drawerView(item) : ''}
      </div>
    `;
  }

  function focusMarkdown(item) {
    if (!item.evidence.length) {
      return '<article class="rw-focus-markdown"><section class="rw-focus-md-section"><h3>No Evidence</h3><p>No evidence attached.</p></section></article>';
    }
    return `
      <article class="rw-focus-markdown" aria-label="Review item dossier">
        ${orderedEvidence(item.evidence).map((entry) => markdownEvidenceSection(entry)).join('')}
      </article>
    `;
  }

  function orderedEvidence(evidence) {
    const preferred = new Map([
      ['record', 0],
      ['links', 1],
      ['metadata', 2],
    ]);
    return evidence.slice().sort((a, b) => {
      const left = preferred.get(String(a.label || '').toLowerCase());
      const right = preferred.get(String(b.label || '').toLowerCase());
      return (left ?? 99) - (right ?? 99);
    });
  }

  function markdownEvidenceSection(entry) {
    const label = entry.label || 'Evidence';
    const value = entry.value;
    return `
      <section class="rw-focus-md-section">
        <h3>${escape(label)}</h3>
        ${entry.url ? `<p><a href="${escapeAttr(entry.url)}" target="_blank" rel="noreferrer">${escape(entry.value || entry.url)}</a></p>` : markdownValue(value)}
      </section>
    `;
  }

  function markdownValue(value) {
    const text = formatValue(value).trim();
    if (!text) return '<p class="rw-empty">No value stored.</p>';
    if (typeof value === 'object' || looksJson(text)) {
      return `<pre><code>${escape(prettyJson(text))}</code></pre>`;
    }
    return text.split(/\n{2,}/).map((paragraph) => `<p>${escape(paragraph).replace(/\n/g, '<br>')}</p>`).join('');
  }

  function looksJson(value) {
    const text = String(value || '').trim();
    return (text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'));
  }

  function prettyJson(value) {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  function drawerView(item) {
    return `
      <aside class="rw-drawer" role="dialog" aria-modal="true" aria-label="Review item details">
        <div class="rw-drawer-head">
          <div>
            <p class="rw-eyebrow">Details</p>
            <h3>${escape(item.title)}</h3>
          </div>
          <button type="button" class="rw-button ghost" data-rw-drawer-close>Close</button>
        </div>
        ${detailSections(item)}
      </aside>
    `;
  }

  function commentSheet(state) {
    return `
      <div class="rw-comment-sheet">
        <textarea class="rw-comment" data-rw-comment-box placeholder="Optional comment">${escape(state.comment)}</textarea>
      </div>
    `;
  }

  function previewEvidence(item) {
    if (!item.evidence.length) {
      return '<div class="rw-empty">No evidence attached.</div>';
    }
    return item.evidence.slice(0, 4).map((entry) => `
      <section>
        <strong>${escape(entry.label)}</strong>
        ${entry.url
          ? `<a href="${escapeAttr(entry.url)}" target="_blank" rel="noreferrer">${escape(entry.value || entry.url)}</a>`
          : `<p>${escape(formatValue(entry.value))}</p>`}
      </section>
    `).join('');
  }

  function detailSections(item) {
    return `
      <div class="rw-detail-copy">
        <p>${escape(item.summary || item.subtitle || '')}</p>
      </div>
      <div class="rw-evidence">
        ${item.evidence.map((entry) => `
          <section>
            <strong>${escape(entry.label)}</strong>
            ${entry.url ? `<a href="${escapeAttr(entry.url)}" target="_blank" rel="noreferrer">${escape(entry.value || entry.url)}</a>` : `<pre>${escape(formatValue(entry.value))}</pre>`}
          </section>
        `).join('') || '<div class="rw-empty">No evidence attached.</div>'}
      </div>
    `;
  }

  function singleView(item, state, config) {
    if (!item) return '<div class="rw-empty">No review items.</div>';
    return `
      <div class="rw-single">
        <div class="rw-single-card">
          <div class="rw-single-head">
            <div>
              <p class="rw-eyebrow">${escape(item.type || config.itemLabel)}</p>
              <h3>${escape(item.title)}</h3>
              <p>${escape(item.subtitle || item.summary || '')}</p>
            </div>
            ${statusPill(item.status)}
          </div>
          ${detailPane(item)}
        </div>
      </div>
    `;
  }

  function detailPane(item) {
    if (!item) return '<aside class="rw-detail"><div class="rw-empty">Select an item.</div></aside>';
    return `
      <aside class="rw-detail">
        <div class="rw-section-title">Selected Item</div>
        <h4>${escape(item.title)}</h4>
        ${detailSections(item)}
      </aside>
    `;
  }

  function normalizeConfig(options) {
    const actions = (options.actions || DEFAULT_ACTIONS).map((action) => ({ ...action }));
    return {
      workflowId: options.workflowId || 'review-workbench',
      title: options.title || 'Review Workbench',
      kicker: options.kicker || 'Human review',
      itemLabel: options.itemLabel || 'Review item',
      actions,
      load: options.load,
      decide: options.decide,
      deleteItem: options.deleteItem,
      columns: options.columns || [
        { id: 'status', label: 'Status', type: 'status' },
        { id: 'title', label: 'Item' },
        { id: 'reason', label: 'Reason' },
        { id: 'source', label: 'Source' },
        { id: 'created_at', label: 'Created' },
      ],
    };
  }

  function normalizeItem(item) {
    return {
      ...item,
      id: String(item.id),
      title: item.title || item.summary || item.id,
      evidence: Array.isArray(item.evidence) ? item.evidence : [],
    };
  }

  function actionButton(action, bulk) {
    const label = bulk ? `${action.label} Selected` : action.label;
    return `<button type="button" class="rw-button ${escapeAttr(action.tone || '')}" data-rw-action="${escapeAttr(action.id)}" title="${escapeAttr((action.key || '').toUpperCase())}">${escape(label)}</button>`;
  }

  function cell(item, column) {
    const value = item[column.id];
    if (column.type === 'status') return statusPill(value);
    if (column.type === 'number') return escape(String(value ?? ''));
    if (column.id === 'title') {
      return `<strong>${escape(item.title)}</strong><small>${escape(item.subtitle || '')}</small>`;
    }
    return escape(String(value ?? ''));
  }

  function statusPill(value) {
    const text = String(value || 'unreviewed');
    const cls = text.includes('approved') ? 'good' : text.includes('reject') ? 'bad' : text.includes('flag') ? 'warn' : text.includes('defer') ? 'neutral' : '';
    return `<span class="rw-pill ${cls}">${escape(text)}</span>`;
  }

  function stat(label, value) {
    return `<span class="rw-stat"><strong>${escape(String(value))}</strong>${escape(label)}</span>`;
  }

  function addRecent(workflowId, entry) {
    const current = readRecent(workflowId);
    current.unshift(entry);
    localStorage.setItem(recentKey(workflowId), JSON.stringify(current.slice(0, RECENT_LIMIT)));
  }

  function readRecent(workflowId) {
    try {
      return JSON.parse(localStorage.getItem(recentKey(workflowId)) || '[]').slice(0, RECENT_LIMIT);
    } catch {
      return [];
    }
  }

  function recentKey(workflowId) {
    return `asg.reviewWorkbench.recent.${workflowId}`;
  }

  function relativeTime(value) {
    if (!value) return '';
    const diff = Math.round((Date.now() - new Date(value).getTime()) / 60000);
    if (diff < 1) return 'now';
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.round(diff / 60)}h`;
    return `${Math.round(diff / 1440)}d`;
  }

  function formatValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  function escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function escapeAttr(value) {
    return escape(value).replace(/`/g, '&#96;');
  }

  window.ASGReviewWorkbench = { mount };
})();
