# Sharda Attendance Helper

A lightweight tool that runs on the Sharda Ezone Enrolled Course List page (`student.sharda.ac.in/admin/courses`). It reads the Delivered and Attended values already rendered in each subject row and injects a "Can Leave" column.

<img src="Sample Image of Attendance.png" alt="Sharda Attendance Helper Mockup" width="600">


This project offers two delivery mechanisms:
1. **Chrome Extension (Desktop)**: Auto-injects and reacts to term tab switching.
2. **Bookmarklet (Mobile)**: Since mobile Chrome doesn't support extensions, this runs the helper as a single-click bookmark on your phone.

---

## Features
- **Can Leave calculation**: 
  - If Attendance &ge; 75%: displays the number of upcoming classes you may safely skip.
  - If Attendance &lt; 75%: displays the number of consecutive upcoming classes you must attend to climb back to 75%.
- **Zero data edge-case handling**: displays `—` if Delivered classes are 0.
- **Privacy First**: Fully local, no login automation, no backend connection, no data storage.

---

## Formula
For a given subject row:
- Let $D$ = Delivered, $A$ = Attended
- If $\frac{A}{D} \ge 0.75$:
  $$\text{CanLeave} = \lfloor \frac{A}{0.75} - D \rfloor$$
- Else:
  $$\text{CanLeave} = -\lceil 3D - 4A \rceil$$
- Edge Case: if $D = 0$, display `—`.

---

## Installation & Setup

### 1. Desktop (Chrome Extension)
1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** (top-left button).
5. Select the `sharda-attendance-extension` folder.

### 2. Mobile (Bookmarklet)
To use the tool on your mobile browser (such as Chrome or Safari on iOS/Android):

- **Copy-Paste Code**: You can copy the minified code directly from the [bookmarklet-v2.txt](file:///e:/Sharda%20Attendance/sharda-attendance-extension/bookmarklet/bookmarklet-v2.txt) file, or copy the block below:
- **Source Code**: The readable source code is located at [can-leave-source-v2.js](file:///e:/Sharda%20Attendance/sharda-attendance-extension/bookmarklet/can-leave-source-v2.js).

```javascript
javascript:(function () { var TARGET = 0.75; var alerted = false; function warnOnce(msg) { if (!alerted) { alerted = true; alert(msg); } } function calcCanLeave(delivered, attended) { if (delivered === 0) return null; var pct = attended / delivered; if (pct >= TARGET) return Math.floor(attended / TARGET - delivered); return -Math.ceil(3 * delivered - 4 * attended); } function findTable() { var tables = document.querySelectorAll('table'); for (var i = 0; i < tables.length; i++) { var text = tables[i].innerText; if (text.indexOf('Delivered') > -1 && text.indexOf('Attended') > -1) return tables[i]; } return null; } function findHeaderRowIndex(rows) { for (var i = 0; i < rows.length; i++) { var cells = Array.prototype.slice.call(rows[i].children); for (var j = 0; j < cells.length; j++) { if (cells[j].textContent.trim() === 'Delivered') return i; } } return -1; } function colIndex(headerRow, label) { var cells = Array.prototype.slice.call(headerRow.children); for (var i = 0; i < cells.length; i++) { if (cells[i].textContent.trim().toLowerCase() === label.toLowerCase()) return i; } return -1; } function isTotalRow(row) { var cells = Array.prototype.slice.call(row.children); for (var i = 0; i < cells.length; i++) { if (cells[i].textContent.trim().toLowerCase() === 'total') return true; } return false; } function injectColumn(table) { if (table.dataset.clInjected === 'true') return; var rows = Array.prototype.slice.call(table.querySelectorAll('tr')); var hIdx = findHeaderRowIndex(rows); if (hIdx === -1) { warnOnce('Can Leave: header row not found — send a screenshot to fix this.'); return; } var headerRow = rows[hIdx]; var dIdx = colIndex(headerRow, 'Delivered'); var aIdx = colIndex(headerRow, 'Attended'); if (dIdx === -1 || aIdx === -1) { warnOnce('Can Leave: Delivered/Attended columns not found — send a screenshot to fix this.'); return; } var th = document.createElement('th'); th.textContent = 'Can Leave'; th.style.fontWeight = 'bold'; var insertAfterIdx = Math.max(dIdx, aIdx); var headerCells = Array.prototype.slice.call(headerRow.children); headerRow.insertBefore(th, headerCells[insertAfterIdx + 1] || null); for (var i = hIdx + 1; i < rows.length; i++) { var row = rows[i]; if (isTotalRow(row)) continue; var cells = Array.prototype.slice.call(row.children); if (cells.length <= Math.max(dIdx, aIdx)) continue; var delivered = parseInt(cells[dIdx].textContent.trim(), 10); var attended = parseInt(cells[aIdx].textContent.trim(), 10); if (isNaN(delivered) || isNaN(attended)) continue; var val = calcCanLeave(delivered, attended); var td = document.createElement('td'); td.style.textAlign = 'center'; td.style.fontWeight = 'bold'; if (val === null) { td.textContent = '—'; td.style.color = '#888888'; } else { td.textContent = (val > 0 ? '+' : '') + val; td.style.color = val >= 0 ? '#1a7f37' : '#c0392b'; } row.insertBefore(td, cells[insertAfterIdx + 1] || null); } table.dataset.clInjected = 'true'; } function run() { var table = findTable(); if (table) injectColumn(table); else warnOnce('Can Leave: no table with Delivered/Attended found on this page.'); } run(); var observer = new MutationObserver(run); observer.observe(document.body, { childList: true, subtree: true }); setTimeout(function () { observer.disconnect(); }, 120000); })();
```

#### How to Add and Run the Bookmarklet:
1. Bookmark any webpage on your mobile browser.
2. Edit the bookmark:
   - **Name**: `Sharda Attendance`
   - **URL/Address**: Paste the entire `javascript:...` block copied from above.
3. Log in to the Sharda portal on your mobile browser and navigate to the Enrolled Course List.
4. Tap the browser address bar, type `Sharda Attendance`, and tap the bookmark suggestion that appears in the autocomplete list to execute the script on the page.

