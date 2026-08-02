# Sharda Attendance Helper

A lightweight Chrome Extension that runs on the Sharda Ezone Enrolled Course List page (`student.sharda.ac.in/admin/courses`). It reads the Delivered and Attended values already rendered in each subject row and injects a "Can Leave" column.

## Features
- **Can Leave calculation**: 
  - If Attendance &ge; 75%: displays the number of upcoming classes you may safely skip.
  - If Attendance &lt; 75%: displays the number of consecutive upcoming classes you must attend to climb back to 75%.
- **Zero data edge-case handling**: displays `—` if Delivered classes are 0.
- **Privacy First**: Fully local, no login automation, no backend connection, no data storage.

## Formula
For a given subject row:
- Let $D$ = Delivered, $A$ = Attended
- If $\frac{A}{D} \ge 0.75$:
  $$\text{CanLeave} = \lfloor \frac{A}{0.75} - D \rfloor$$
- Else:
  $$\text{CanLeave} = -\lceil 3D - 4A \rceil$$
- Edge Case: if $D = 0$, display `—`.

## Installation
1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** (top-left button).
5. Select the `sharda-attendance-extension` folder.
