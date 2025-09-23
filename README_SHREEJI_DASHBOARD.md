
# 📘 README: SHREEJI Education Zone – Google AI Studio Project

This frontend project, designed in **Google AI Studio**, is a modular educational dashboard for managing key academic workflows at Shreeji Education Zone.

---

## 🧱 Project Structure Overview

```
ROOT
│
├── App.tsx                → Main application router and shell
├── index.tsx              → Entry point
├── index.html             → HTML base template
├── constants.ts           → Static labels, dropdown options
├── types.ts               → Global TypeScript interfaces and types
├── metadata.json          → Google AI Studio metadata (internal use)
│
├── components/            → All UI logic per module (see below)
├── utils/                 → Data transformation and service logic
```

---

## 📂 COMPONENTS Folder – Pages & UI Blocks

### 🔹 Core Pages
These are the **main screens** (like dashboard pages):

- **`SubjectManagerPage.tsx`** – Manages subject & chapter list per student
- **`SyllabusProgressPage.tsx`** – Horizontal timeline for chapter start → finish
- **`WorkPoolPage.tsx`** – Central Kanban-style academic task manager
- **`DoubtBoxPage.tsx`** – Tracks student doubts and resolutions

### 🔹 Shared UI Components
These are **reusable building blocks**:

- **`StudentCard.tsx`** – Displays summary of student info (used across modules)
- **`StudentDrawer.tsx`** – Side panel showing full student profile
- **`StudentForm.tsx`** – Used to add/edit student information
- **`FilterBar.tsx`** – Standard filter row used across modules
- **`PlaceholderAvatar.tsx`** – Default avatar for students

### 🔹 Forms (Reused)
In `components/form/`:
- `InputField.tsx`, `SelectField.tsx`, `TextareaField.tsx` – Custom input components with consistent styling and validation

### 🔹 Icons (Lucide-style SVG)
In `components/icons/`:
- BookIcon, DirectoryIcon, SubjectsIcon, etc. used for sidebar, labels, etc.

---

## 📚 Module-Wise Functionality & Logic

### 1️⃣ Student Directory
- Filters: Batch, Grade, Board, School
- Displays student summary and profile
- Includes edit/delete + profile drawer

### 2️⃣ Subject Manager
- CBSE/ICSE: Grade-wide subject list
- Cambridge/IB: Per-student subject setup
- Allows manual editing
- Chapters and topics also editable

### 3️⃣ Syllabus Progress
- Timeline view: Start → Milestone → Finish
- Used for planning and completion tracking
- Tied to chapters from Subject Manager

### 4️⃣ Work Pool
- Task board for all academic work
- Tasks have due date, status, subject, priority
- Filterable list + calendar + detail modal

### 5️⃣ Doubt Box
- Student doubt tracker
- Fields: Subject, Chapter, Text, Priority
- AI Assistant available for resolution flow
- Status: Open / Tasked / Resolved

### 6️⃣ AI Assistant
- Embedded in Doubt Drawer
- 4 stages: Understand → Suggest → Tutor → Assign task
- Logs conversation and progress

---

## ⚙️ UTILS Folder – Logic & Services

- **`studentUtils.ts`** – Filters, search, groupings
- **`subjectUtils.ts`** – Board-specific chapter handling
- **`workPoolService.ts`** – Logic for assigning/completing tasks

---

## 🌐 Routing & State

- `App.tsx` – Routes all pages
- `index.tsx` – Renders root
- Data is stored in local state or localStorage (not Firebase yet)

---

## ✳️ Technologies Used

- Google AI Studio
- React (JSX, TypeScript)
- Tailwind CSS
- Lucide Icons
- Recharts (optionally)

---

## ✅ To Rebuild This

1. Use Google AI Studio
2. Create modular routes
3. Upload these components
4. Copy logic from utils
5. Test data using localStorage
6. Reuse form and drawer patterns
