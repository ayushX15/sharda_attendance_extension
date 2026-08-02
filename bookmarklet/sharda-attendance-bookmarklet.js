/**
 * Sharda Attendance Helper - Bookmarklet Source
 * 
 * This is the readable version of the JavaScript bookmarklet logic.
 * It does not require Manifest injection and can run directly in mobile browsers.
 */

(function() {
  // 1. Inject Styles dynamically since bookmarklet runs standalone
  if (!document.getElementById('can-leave-bookmarklet-css')) {
    const style = document.createElement('style');
    style.id = 'can-leave-bookmarklet-css';
    style.textContent = `
      .can-leave-cell {
        text-align: center !important;
        vertical-align: middle !important;
      }
      .can-leave-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: bold;
        font-size: 0.85em;
        text-align: center;
        white-space: nowrap;
      }
      .can-leave-safe {
        color: #1b5e20;
        background-color: #e8f5e9;
        border: 1px solid #c8e6c9;
      }
      .can-leave-warning {
        color: #b71c1c;
        background-color: #ffebee;
        border: 1px solid #ffcdd2;
      }
      .can-leave-neutral {
        color: #616161;
        background-color: #f5f5f5;
        border: 1px solid #e0e0e0;
      }
    `;
    document.head.appendChild(style);
  }

  // 2. Pure Calculation Logic
  function calcCanLeave(delivered, attended) {
    if (delivered === 0) return '—';
    const ratio = attended / delivered;
    if (ratio >= 0.75) {
      return Math.floor(attended / 0.75 - delivered);
    } else {
      return -Math.ceil(3 * delivered - 4 * attended);
    }
  }

  try {
    const tables = document.querySelectorAll('table');
    let processedAny = false;

    tables.forEach(table => {
      const trs = Array.from(table.querySelectorAll('tr'));
      let headerRow = null;
      let deliveredIdx = -1;
      let attendedIdx = -1;

      // Find the row containing column title names
      for (const tr of trs) {
        const children = Array.from(tr.children);
        let foundDelivered = -1;
        let foundAttended = -1;

        children.forEach((cell, idx) => {
          const text = cell.textContent.trim().toLowerCase();
          if (text === 'delivered' || text.includes('delivered')) {
            foundDelivered = idx;
          } else if (text === 'attended' || text.includes('attended')) {
            foundAttended = idx;
          }
        });

        if (foundDelivered !== -1 && foundAttended !== -1) {
          headerRow = tr;
          deliveredIdx = foundDelivered;
          attendedIdx = foundAttended;
          break;
        }
      }

      if (!headerRow || deliveredIdx === -1 || attendedIdx === -1) return;

      const targetIdx = attendedIdx;

      // Update colspan for System ID / Term title rows
      trs.forEach(row => {
        const rowText = row.textContent.toLowerCase();
        if (rowText.includes('term:') || rowText.includes('system id')) {
          if (row.dataset.canLeaveColspanUpdated) return;
          const lastCell = row.lastElementChild;
          if (lastCell) {
            const currentColspan = parseInt(lastCell.getAttribute('colspan') || '1', 10);
            lastCell.setAttribute('colspan', (currentColspan + 1).toString());
          }
          row.dataset.canLeaveColspanUpdated = 'true';
        }
      });

      // Inject Header
      const headerCells = Array.from(headerRow.children);
      const hasHeader = headerCells.some(cell => cell.textContent.trim() === 'Can Leave');
      if (!hasHeader) {
        const newHeader = document.createElement(headerCells[0].tagName);
        newHeader.textContent = 'Can Leave';
        newHeader.classList.add('can-leave-cell');
        if (targetIdx + 1 < headerCells.length) {
          headerRow.insertBefore(newHeader, headerCells[targetIdx + 1]);
        } else {
          headerRow.appendChild(newHeader);
        }
      }

      // Inject cells in table rows
      trs.forEach(row => {
        if (row === headerRow || row.querySelector('th')) return;
        const rowText = row.textContent.toLowerCase();

        // Handle total row
        if (rowText.includes('total')) {
          if (row.dataset.canLeaveRowProcessed) return;
          const cells = Array.from(row.children);
          const percentCell = cells.find(c => c.textContent.includes('%'));
          if (percentCell) {
            row.appendChild(percentCell);
            const prevCell = percentCell.previousElementSibling;
            if (prevCell) {
              const currentColspan = parseInt(prevCell.getAttribute('colspan') || '1', 10);
              prevCell.setAttribute('colspan', (currentColspan + 1).toString());
            }
          }
          row.dataset.canLeaveRowProcessed = 'true';
          return;
        }

        if (rowText.includes('system id')) return;
        if (row.dataset.canLeaveRowProcessed) return;

        const cells = Array.from(row.children);
        if (cells.length <= Math.max(deliveredIdx, attendedIdx)) return;

        const deliveredText = cells[deliveredIdx].textContent.trim();
        const attendedText = cells[attendedIdx].textContent.trim();

        const deliveredMatch = deliveredText.match(/\d+/);
        const attendedMatch = attendedText.match(/\d+/);

        if (!deliveredMatch || !attendedMatch) return;

        const delivered = parseInt(deliveredMatch[0], 10);
        const attended = parseInt(attendedMatch[0], 10);

        const result = calcCanLeave(delivered, attended);
        let displayText = '—';
        let badgeClass = 'can-leave-neutral';

        if (result !== '—') {
          displayText = result > 0 ? `+${result}` : `${result}`;
          badgeClass = result >= 0 ? 'can-leave-safe' : 'can-leave-warning';
        }

        const newCell = document.createElement('td');
        newCell.classList.add('can-leave-cell');

        const badge = document.createElement('span');
        badge.textContent = displayText;
        badge.className = `can-leave-badge ${badgeClass}`;
        newCell.appendChild(badge);

        if (targetIdx + 1 < cells.length) {
          row.insertBefore(newCell, cells[targetIdx + 1]);
        } else {
          row.appendChild(newCell);
        }

        row.dataset.canLeaveRowProcessed = 'true';
        processedAny = true;
      });
    });

    if (!processedAny) {
      alert("No active Sharda course attendance table found on this page.");
    }
  } catch (e) {
    alert("Error executing bookmarklet: " + e.message);
  }
})();
