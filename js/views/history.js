/**
 * views/history.js - Historical Data Logs View
 * Source of Truth: Uploaded Reference Image 3 (Bottom-Left quadrant)
 */

import { Icons } from '../icons.js';
import { appStore } from '../state.js';
import { renderAppShell, attachShellEvents } from './shell.js';

export function renderHistory(container, router) {
  let currentPage = 1;
  const pageSize = 5;
  let filters = {
    fromDate: '',
    toDate: '',
    mode: 'All',
    status: 'All'
  };

  function getFilteredRecords() {
    const allHistory = appStore.get().history;
    return allHistory.filter(item => {
      // Date filter
      if (filters.fromDate) {
        const itemDate = item.timestamp.split(' ')[0];
        if (itemDate < filters.fromDate) return false;
      }
      if (filters.toDate) {
        const itemDate = item.timestamp.split(' ')[0];
        if (itemDate > filters.toDate) return false;
      }
      // Mode filter
      if (filters.mode !== 'All' && item.controlMode !== filters.mode) {
        return false;
      }
      // Status filter
      if (filters.status !== 'All' && item.fanStatus !== filters.status) {
        return false;
      }
      return true;
    });
  }

  function renderTableRows(records) {
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = records.slice(startIndex, startIndex + pageSize);

    if (paginated.length === 0) {
      return `
        <tr>
          <td colspan="6" class="cell-empty">
            No telemetry records found matching the selected filter criteria.
          </td>
        </tr>
      `;
    }

    return paginated.map(row => `
      <tr>
        <td class="cell-id" data-label="ID">${row.id}</td>
        <td class="cell-time" data-label="Timestamp">${row.timestamp}</td>
        <td class="cell-strong" data-label="Temperature (°C)">${row.temperature.toFixed(1)}</td>
        <td class="cell-strong" data-label="Fan Speed (%)">${row.fanSpeed}</td>
        <td data-label="Fan Status">
          <span class="${row.fanStatus === 'ON' ? 'badge-pill-on' : 'badge-pill-off'}">
            ${row.fanStatus}
          </span>
        </td>
        <td data-label="Control Mode">${row.controlMode}</td>
      </tr>
    `).join('');
  }

  function renderPagination(totalCount) {
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const pageItems = [];
    if (totalPages <= 7) {
      for (let p = 1; p <= totalPages; p++) pageItems.push(p);
    } else {
      const visible = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
      [...visible]
        .filter(p => p >= 1 && p <= totalPages)
        .sort((a, b) => a - b)
        .forEach((p, index, pages) => {
          if (index > 0 && p - pages[index - 1] > 1) pageItems.push('ellipsis');
          pageItems.push(p);
        });
    }

    const pagesHtml = pageItems.map(item => item === 'ellipsis'
      ? '<span class="page-ellipsis" aria-hidden="true">…</span>'
      : `<button class="page-num-btn ${item === currentPage ? 'active' : ''}" data-page="${item}">${item}</button>`
    ).join('');

    return `
      <div class="pagination-summary">Showing ${Math.min((currentPage - 1) * pageSize + 1, totalCount)}–${Math.min(currentPage * pageSize, totalCount)} of ${totalCount} records</div>
      <div class="pagination-controls">
        <button class="page-num-btn page-nav-btn" id="btnPagePrev" aria-label="Previous page" ${currentPage === 1 ? 'disabled' : ''}>${Icons.chevronLeft}</button>
        ${pagesHtml}
        <button class="page-num-btn page-nav-btn" id="btnPageNext" aria-label="Next page" ${currentPage === totalPages ? 'disabled' : ''}>${Icons.chevronRight}</button>
      </div>
    `;
  }

  function updateView() {
    const filtered = getFilteredRecords();
    const tbody = container.querySelector('#historyTableBody');
    const footer = container.querySelector('#historyPaginationFooter');

    if (tbody) tbody.innerHTML = renderTableRows(filtered);
    if (footer) {
      footer.innerHTML = renderPagination(filtered.length);
      attachPaginationEvents(filtered.length);
    }
  }

  function attachPaginationEvents(totalCount) {
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    container.querySelectorAll('.page-num-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.getAttribute('data-page'), 10);
        updateView();
      });
    });

    const btnPrev = container.querySelector('#btnPagePrev');
    if (btnPrev && currentPage > 1) {
      btnPrev.addEventListener('click', () => {
        currentPage--;
        updateView();
      });
    }

    const btnNext = container.querySelector('#btnPageNext');
    if (btnNext && currentPage < totalPages) {
      btnNext.addEventListener('click', () => {
        currentPage++;
        updateView();
      });
    }
  }

  const initialRecords = getFilteredRecords();

  const contentHTML = `
    <div class="history-view">
    <!-- Filter Bar Card -->
    <div class="history-filter-card">
      <form id="historyFilterForm" class="filter-inputs-grid">
        <!-- From Date -->
        <div class="filter-field">
          <label for="filterFromDate">From Date</label>
          <input type="date" id="filterFromDate" class="input-light" placeholder="mm/dd/yyyy">
        </div>

        <!-- To Date -->
        <div class="filter-field">
          <label for="filterToDate">To Date</label>
          <input type="date" id="filterToDate" class="input-light" placeholder="mm/dd/yyyy">
        </div>

        <!-- Control Mode -->
        <div class="filter-field">
          <label for="filterControlMode">Control Mode</label>
          <select id="filterControlMode" class="input-light">
            <option value="All">All Modes</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </div>

        <!-- Fan Status -->
        <div class="filter-field">
          <label for="filterFanStatus">Fan Status</label>
          <select id="filterFanStatus" class="input-light">
            <option value="All">All Status</option>
            <option value="ON">ON</option>
            <option value="OFF">OFF</option>
          </select>
        </div>

        <!-- Action Buttons -->
        <div class="filter-buttons-wrap">
          <button type="submit" class="btn-filter-primary" id="btnApplyFilter">${Icons.filter}<span>Filter</span></button>
          <button type="button" class="btn-filter-outline" id="btnResetFilter">Reset</button>
          <div class="range-quick-switch" role="group" aria-label="Quick date range">
            <button type="button" class="range-quick-btn" id="btnTodayFilter">Today</button>
            <button type="button" class="range-quick-btn active" id="btnAllTimeFilter">All Time</button>
          </div>
        </div>
      </form>
    </div>

    <!-- Data Table Card -->
    <div class="history-table-card">
      <div class="table-responsive-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 60px;">ID</th>
              <th>Timestamp</th>
              <th>Temperature (°C)</th>
              <th>Fan Speed (%)</th>
              <th>Fan Status</th>
              <th>Control Mode</th>
            </tr>
          </thead>
          <tbody id="historyTableBody">
            ${renderTableRows(initialRecords)}
          </tbody>
        </table>
      </div>

      <div class="table-footer-pagination" id="historyPaginationFooter">
        ${renderPagination(initialRecords.length)}
      </div>
    </div>
    </div>
  `;

  container.innerHTML = renderAppShell(
    '/history',
    'History',
    'View past temperature logs and system activity',
    contentHTML,
    router
  );

  const cleanupShell = attachShellEvents(container, router);
  attachPaginationEvents(initialRecords.length);

  // Highlights the quick range (Today / All Time) that matches the applied dates
  function syncQuickRange() {
    const today = new Date().toISOString().split('T')[0];
    const isToday = filters.fromDate === today && filters.toDate === today;
    const isAllTime = !filters.fromDate && !filters.toDate;
    container.querySelector('#btnTodayFilter').classList.toggle('active', isToday);
    container.querySelector('#btnAllTimeFilter').classList.toggle('active', isAllTime);
  }

  // Form Filter Event
  const form = container.querySelector('#historyFilterForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    filters.fromDate = container.querySelector('#filterFromDate').value;
    filters.toDate = container.querySelector('#filterToDate').value;
    filters.mode = container.querySelector('#filterControlMode').value;
    filters.status = container.querySelector('#filterFanStatus').value;
    currentPage = 1;
    syncQuickRange();
    updateView();
  });

  // Reset Event
  container.querySelector('#btnResetFilter').addEventListener('click', () => {
    container.querySelector('#filterFromDate').value = '';
    container.querySelector('#filterToDate').value = '';
    container.querySelector('#filterControlMode').value = 'All';
    container.querySelector('#filterFanStatus').value = 'All';
    filters = { fromDate: '', toDate: '', mode: 'All', status: 'All' };
    currentPage = 1;
    syncQuickRange();
    updateView();
  });

  // Today Event
  container.querySelector('#btnTodayFilter').addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    container.querySelector('#filterFromDate').value = today;
    container.querySelector('#filterToDate').value = today;
    filters.fromDate = today;
    filters.toDate = today;
    currentPage = 1;
    syncQuickRange();
    updateView();
  });

  // All Time Event
  container.querySelector('#btnAllTimeFilter').addEventListener('click', () => {
    container.querySelector('#filterFromDate').value = '';
    container.querySelector('#filterToDate').value = '';
    filters.fromDate = '';
    filters.toDate = '';
    currentPage = 1;
    syncQuickRange();
    updateView();
  });

  // Re-render when new readings are logged from simulator
  const unsubscribe = appStore.subscribe((newState, event) => {
    if (event === 'telemetry') {
      updateView();
    }
  });

  return () => {
    unsubscribe();
    cleanupShell();
  };
}
