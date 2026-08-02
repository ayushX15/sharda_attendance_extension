# Sharda Attendance Helper

A lightweight tool that runs on the Sharda Ezone Enrolled Course List page (`student.sharda.ac.in/admin/courses`). It reads the Delivered and Attended values already rendered in each subject row and injects a "Can Leave" column.

This project offers two delivery mechanisms:
1. **Chrome Extension (Desktop)**: Auto-injects and reacts to term tab switching.
2. **Bookmarklet (Mobile)**: Since mobile Chrome doesn't support extensions, this runs the helper as a single-click bookmark on your phone.

---

## Features
- **Can Leave calculation**: 
  - If Attendance &ge; 75%: displays the number of upcoming classes you may safely skip.
  - If Attendance &lt; 75%: displays the number of consecutive upcoming classes you must attend to climb back to 75%.
- **Zero data edge-case handling**: displays `—` if Delivered classes are 0.
- **Dynamic Layout Alignment**: 
  - Top header (`Term: 2601`) stretches to the edge of the table.
  - Bottom summary row (`97.50%`) aligns perfectly under the Percentage column.
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
Copy the code below to use on Chrome or Safari on Android/iOS:

```javascript
javascript:(function(){if(!document.getElementById('cl-css')){var s=document.createElement('style');s.id='cl-css';s.textContent='.can-leave-cell{text-align:center!important;vertical-align:middle!important;}.can-leave-badge{display:inline-block;padding:4px 10px;border-radius:12px;font-weight:bold;font-size:0.85em;text-align:center;white-space:nowrap;}.can-leave-safe{color:#1b5e20;background-color:#e8f5e9;border:1px solid #c8e6c9;}.can-leave-warning{color:#b71c1c;background-color:#ffebee;border:1px solid #ffcdd2;}.can-leave-neutral{color:#616161;background-color:#f5f5f5;border:1px solid #e0e0e0;}';document.head.appendChild(s);}function calc(d,a){if(d===0)return'—';return(a/d>=0.75)?Math.floor(a/0.75-d):-Math.ceil(3*d-4*a);}try{var ts=document.querySelectorAll('table'),any=false;ts.forEach(function(t){var rs=Array.from(t.querySelectorAll('tr')),hr=null,di=-1,ai=-1;for(var i=0;i<rs.length;i++){var cs=Array.from(rs[i].children),fd=-1,fa=-1;cs.forEach(function(c,x){var tx=c.textContent.trim().toLowerCase();if(tx==='delivered'||tx.includes('delivered'))fd=x;else if(tx==='attended'||tx.includes('attended'))fa=x;});if(fd!==-1&&fa!==-1){hr=rs[i];di=fd;ai=fa;break;}}if(!hr||di===-1||ai===-1)return;rs.forEach(function(r){var rt=r.textContent.toLowerCase();if(rt.includes('term:')||rt.includes('system id')){if(r.dataset.canLeaveColspanUpdated)return;var lc=r.lastElementChild;if(lc){lc.setAttribute('colspan',(parseInt(lc.getAttribute('colspan')||'1',10)+1).toString());}r.dataset.canLeaveColspanUpdated='true';}});var hc=Array.from(hr.children);if(!hc.some(function(c){return c.textContent.trim()==='Can Leave';})){var nh=document.createElement(hc[0].tagName);nh.textContent='Can Leave';nh.classList.add('can-leave-cell');if(ai+1<hc.length)hr.insertBefore(nh,hc[ai+1]);else hr.appendChild(nh);}rs.forEach(function(r){if(r===hr||r.querySelector('th'))return;var rt=r.textContent.toLowerCase();if(rt.includes('total')){if(r.dataset.canLeaveRowProcessed)return;var cs=Array.from(r.children),pc=cs.find(function(c){return c.textContent.includes('%');});if(pc){r.appendChild(pc);var pr=pc.previousElementSibling;if(pr){pr.setAttribute('colspan',(parseInt(pr.getAttribute('colspan')||'1',10)+1).toString());}}r.dataset.canLeaveRowProcessed='true';return;}if(rt.includes('system id'))return;if(r.dataset.canLeaveRowProcessed)return;var cs=Array.from(r.children);if(cs.length<=Math.max(di,ai))return;var dt=cs[di].textContent.trim().match(/\d+/),at=cs[ai].textContent.trim().match(/\d+/);if(!dt||!at)return;var d=parseInt(dt[0],10),a=parseInt(at[0],10);var res=calc(d,a);var txt=res==='—'?'—':(res>0?'+'+res:''+res);var cl=res==='—'?'can-leave-neutral':(res>=0?'can-leave-safe':'can-leave-warning');var td=document.createElement('td');td.classList.add('can-leave-cell');var bd=document.createElement('span');bd.textContent=txt;bd.className='can-leave-badge '+cl;td.appendChild(bd);if(ai+1<cs.length)r.insertBefore(td,cs[ai+1]);else r.appendChild(td);r.dataset.canLeaveRowProcessed='true';any=true;});});if(!any)alert("No active Sharda course attendance table found.");}catch(e){alert("Error: "+e.message);}})();
```

#### How to Add the Bookmarkleto on Mobile Chrome:
1. Bookmark any random page.
2. Edit the bookmark. Name it `Sharda Attendance` and paste the entire JavaScript block above into the **URL/Address** field.
3. Log in to the Sharda portal on your mobile browser and navigate to the Enrolled Course List.
4. Type `Sharda Attendance` in the address bar and tap the bookmark autocomplete suggestion to run it on the active tab.
