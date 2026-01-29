# Golf Season & Statistics Tracker

## Project Overview
A comprehensive golf season and statistics tracking application.

---

## Core Requirements

### 1. Season Management
- A season **must have a name** before it can be started
- **Players must be added** to a season before it can begin
- Seasons cannot start without both requirements being met

### 2. Course Management
- Use **Google Maps integration** to define courses
- Required course information:
  - Course name (from Google Maps)
  - Number of courses at the location
  - Number of holes per course

### 3. Scoring System
- Users mark **"Who won this hole?"** for each hole
- **Multiple players can win** a single hole (ties allowed)
- **Multiple players can lose** a single hole
- Flexible scoring to accommodate various game formats

### 4. Winning Rules
- **The HIGHEST score wins the game**
- Score accumulates based on holes won throughout the round

### 5. Data Export
- Must support exporting statistics to:
  - **.CSV format**
  - **.XLSX format (Excel)**
- Export should include comprehensive statistics and game history

---

## Technical Notes
- Google Maps API integration required for course lookup
- Database needed for persistent storage of seasons, players, courses, and scores
- Export functionality requires file generation capabilities

---

## Future Considerations
- Player statistics and analytics
- Leaderboards
- Historical season comparisons
- Mobile-responsive design for on-course use
