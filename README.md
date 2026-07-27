# Kanban Task Board

The application allows anonymous guest users to create, organize, and manage tasks on a Kanban board. Data is securely stored in Supabase, and Row Level Security (RLS) ensures each user can only access their own tasks.

---

## Features

- Anonymous guest authentication
- Create, edit, and organize tasks on a Kanban board
- Drag and drop tasks between Kanban columns
- Team management with custom members and colored avatars
- Assign one or more team members to each task
- Custom labels/tags with color selection
- Assign multiple labels to tasks
- Filter tasks by label
- Task detail panel with comments
- Chronological task comments with timestamps
- Due date indicators for upcoming, due soon, and overdue tasks
- Persistent task storage with Supabase
- Row Level Security (RLS) for all user data
- Loading and error states throughout the application

---

## Prerequisites

Install the following before running the project:

- Node.js (LTS)
- npm
- Git

---

# Running the Project Locally

## 1. Clone the repository

```bash
git clone https://github.com/rainygold25/NPE_SDE_Assessment.git
```

---

## 2. Navigate into the project

```bash
cd NPE_SDE_Assessment
```

---

## 3. Install dependencies

```bash
npm install
```

---

## 4. Start the development server

```bash
npm run dev
```

Vite will display a local URL similar to:

```
http://localhost:5173
```

Open that URL in your browser.

---

# Project Structure

```
src/
├── components/
│   ├── AssigneePicker.jsx
│   ├── KanbanColumn.jsx
│   ├── LabelForm.jsx
│   ├── LabelPicker.jsx
│   ├── TaskCard.jsx
│   ├── TaskDetailPanel.jsx
│   ├── TaskForm.jsx
│   └── TeamMemberForm.jsx
├── lib/
│   └── supabase.js
├── App.jsx
├── constants.js
├── index.css
└── main.jsx
```

---