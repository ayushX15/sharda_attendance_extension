/**
 * Sharda Attendance Helper - Content Script
 * Runs on student.sharda.ac.in/admin/courses
 */

// Isolated pure calculation logic
function calcCanLeave(delivered, attended) {
  if (delivered === 0) {
    return '—';
  }
  const ratio = attended / delivered;
  if (ratio >= 0.75) {
    // Can skip upcoming classes
    return Math.floor(attended / 0.75 - delivered);
  } else {
    // Must attend consecutively
    return -Math.ceil(3 * delivered - 4 * attended);
  }
}

function injectCanLeave() {
  const tables = document.querySelectorAll('table');
  
  tables.forEach(table => {
    // 1. Find the specific <tr> header row that actually contains 'Delivered' and 'Attended'
    const trs = Array.from(table.querySelectorAll('tr'));
    let headerRow = null;
    let deliveredIdx = -1;
    let attendedIdx = -1;

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

    // If no valid header row is found in this table, skip it
    if (!headerRow || deliveredIdx === -1 || attendedIdx === -1) {
      return;
    }

    // Target position: Place "Can Leave" right after "Attended" (before "Event")
    const targetIdx = attendedIdx;

    // 2. Adjust top title header rows (e.g. "System ID: ... | Term: 2601") to expand colspan for the new column
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

    // 3. Check if the "Can Leave" header is already present in headerRow
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

    // 4. Process body rows & summary/total rows
    trs.forEach(row => {
      try {
        if (row === headerRow || row.querySelector('th')) return;
        
        const rowText = row.textContent.toLowerCase();
        
        // Handle summary/total row at the bottom
        if (rowText.includes('total')) {
          if (row.dataset.canLeaveRowProcessed) return;

          const cells = Array.from(row.children);
          // Find the percentage cell (e.g. 97.50%)
          const percentCell = cells.find(c => c.textContent.includes('%'));

          if (percentCell) {
            // Ensure the percentage cell is the very last element in the row
            row.appendChild(percentCell);

            // Get the cell right before the percentage cell
            const prevCell = percentCell.previousElementSibling;
            if (prevCell) {
              const currentColspan = parseInt(prevCell.getAttribute('colspan') || '1', 10);
              prevCell.setAttribute('colspan', (currentColspan + 1).toString());
            }
          } else {
            // Fallback: insert empty cell if percentage cell is not found
            const emptyCell = document.createElement(cells[0].tagName || 'td');
            emptyCell.classList.add('can-leave-cell');
            if (targetIdx + 1 < cells.length) {
              row.insertBefore(emptyCell, cells[targetIdx + 1]);
            } else {
              row.appendChild(emptyCell);
            }
          }

          row.dataset.canLeaveRowProcessed = 'true';
          return;
        }

        if (rowText.includes('system id')) return;

        // Skip already processed rows
        if (row.dataset.canLeaveRowProcessed) return;

        const cells = Array.from(row.children);
        if (cells.length <= Math.max(deliveredIdx, attendedIdx)) return;

        const deliveredText = cells[deliveredIdx].textContent.trim();
        const attendedText = cells[attendedIdx].textContent.trim();

        // Extract numbers only
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

        // Insert after targetIdx (Attended column)
        if (targetIdx + 1 < cells.length) {
          row.insertBefore(newCell, cells[targetIdx + 1]);
        } else {
          row.appendChild(newCell);
        }

        row.dataset.canLeaveRowProcessed = 'true';
      } catch (error) {
        console.error('Error injecting Can Leave badge for row:', error, row);
      }
    });
  });
}

// Reactivity setup: observe table container for dynamic updates (e.g. term tab clicks)
let tableObserver = null;
let observedParent = null;

function setupTableObserver() {
  const table = document.querySelector('table');
  if (table && table.parentElement) {
    const parent = table.parentElement;
    if (observedParent === parent) return;
    
    if (tableObserver) {
      tableObserver.disconnect();
    }
    
    observedParent = parent;
    tableObserver = new MutationObserver(() => {
      injectCanLeave();
    });
    
    tableObserver.observe(parent, { childList: true, subtree: true });
    injectCanLeave();
  }
}

// Observe body to detect table load/swaps
const bodyObserver = new MutationObserver(() => {
  setupTableObserver();
});
bodyObserver.observe(document.body, { childList: true, subtree: true });

// Initial run
setupTableObserver();
