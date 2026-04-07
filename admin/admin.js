const formatSeconds = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}m ${remaining}s`;
};

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-admin-dashboard]');
  if (!root) return;

  const endpoint = root.dataset.analyticsEndpoint || 'https://jenanggemi.com/analytics.php';
  const summaryViews = document.querySelector('[data-summary-total-views]');
  const summaryOrderClicks = document.querySelector('[data-summary-order-clicks]');
  const summaryCheckoutClicks = document.querySelector('[data-summary-checkout-clicks]');
  const summaryTimeSpent = document.querySelector('[data-summary-time-spent]');
  const urlTableBody = document.querySelector('[data-url-table-body]');
  const sourceTableBody = document.querySelector('[data-source-table-body]');
  const recentEvents = document.querySelector('[data-recent-events]');
  const endpointLabel = document.querySelector('[data-endpoint-label]');

  if (endpointLabel) endpointLabel.textContent = endpoint;

  const renderRows = (items, emptyColspan, formatter) => {
    if (!items.length) {
      return `<tr><td colspan="${emptyColspan}" class="landing-admin-empty">Belum ada data.</td></tr>`;
    }
    return items.map(formatter).join('');
  };

  const loadDashboard = async () => {
    try {
      const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const summary = data.summary || {};

      if (summaryViews) summaryViews.textContent = Number(summary.total_views || 0).toLocaleString('id-ID');
      if (summaryOrderClicks) summaryOrderClicks.textContent = Number(summary.order_now_clicks || 0).toLocaleString('id-ID');
      if (summaryCheckoutClicks) summaryCheckoutClicks.textContent = Number(summary.checkout_clicks || 0).toLocaleString('id-ID');
      if (summaryTimeSpent) summaryTimeSpent.textContent = formatSeconds(Number(summary.avg_time_spent_seconds || 0));

      if (urlTableBody) {
        urlTableBody.innerHTML = renderRows(data.by_url || [], 6, (item) => `
          <tr>
            <td><strong>${item.page_path || '-'}</strong></td>
            <td>${item.source || '-'}</td>
            <td>${Number(item.views || 0).toLocaleString('id-ID')}</td>
            <td>${Number(item.order_now_clicks || 0).toLocaleString('id-ID')}</td>
            <td>${Number(item.checkout_clicks || 0).toLocaleString('id-ID')}</td>
            <td>${formatSeconds(Number(item.avg_time_spent_seconds || 0))}</td>
          </tr>
        `);
      }

      if (sourceTableBody) {
        sourceTableBody.innerHTML = renderRows(data.by_source || [], 5, (item) => `
          <tr>
            <td><strong>${item.source || '-'}</strong></td>
            <td>${Number(item.views || 0).toLocaleString('id-ID')}</td>
            <td>${Number(item.order_now_clicks || 0).toLocaleString('id-ID')}</td>
            <td>${Number(item.checkout_clicks || 0).toLocaleString('id-ID')}</td>
            <td>${formatSeconds(Number(item.avg_time_spent_seconds || 0))}</td>
          </tr>
        `);
      }

      if (recentEvents) {
        const items = data.recent_events || [];
        recentEvents.innerHTML = items.length
          ? items.map((item) => `
              <div class="landing-admin-feed-item">
                <strong>${item.event_type || 'event'} • ${item.source || 'unknown'}</strong>
                <span>${item.page_path || '-'} • ${item.occurred_at || ''}</span>
              </div>
            `).join('')
          : '<p class="landing-admin-empty">Belum ada aktivitas.</p>';
      }
    } catch (error) {
      if (recentEvents) {
        recentEvents.innerHTML = `<p class="landing-admin-empty">Gagal memuat dashboard: ${error.message}</p>`;
      }
    }
  };

  document.querySelector('[data-admin-refresh]')?.addEventListener('click', loadDashboard);
  loadDashboard();
});
