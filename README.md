# Kanban Task Board

The application allows anonymous guest users to create, organize, and manage tasks on a Kanban board. Data is securely stored in Supabase, and Row Level Security (RLS) ensures each user can only access their own tasks.

---

## Features

- Anonymous guest authentication
- Create new tasks
- Drag and drop tasks between Kanban columns
- Persistent task storage with Supabase
- Row Level Security (RLS)
- Loading and error states

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
│   ├── KanbanColumn.jsx
│   ├── TaskCard.jsx
│   └── TaskForm.jsx
├── lib/
│   └── supabase.js
├── App.jsx
├── constants.js
├── index.css
└── main.jsx
```

---

## Database Schema

The `tasks` table should contain:

| Column | Type | Description |
|---------|------|-------------|
| id | uuid | Primary key |
| title | text | Required |
| description | text | Optional |
| status | text | todo, in_progress, in_review, done |
| priority | text | Optional |
| due_date | date | Optional |
| user_id | uuid | Owner of task |
| created_at | timestamptz | Auto-generated |

---