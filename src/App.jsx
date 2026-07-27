import { useEffect, useState } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { supabase } from "./lib/supabase";
import { COLUMNS, VALID_STATUSES } from "./constants";
import KanbanColumn from "./components/KanbanColumn";
import TaskForm from "./components/TaskForm";

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    setLoading(true);
    setError("");

    try {
      let {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        const {
          data,
          error: signInError,
        } = await supabase.auth.signInAnonymously();

        if (signInError) {
          throw signInError;
        }

        session = data.session;
      }

      if (!session?.user) {
        throw new Error("Unable to create the guest session.");
      }

      setUser(session.user);
      await loadTasks();
    } catch (caughtError) {
      setError(caughtError.message || "Unable to start the app.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTasks() {
    const { data, error: loadError } = await supabase
      .from("tasks")
      .select(
        "id, title, description, priority, due_date, status, user_id, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (loadError) {
      throw loadError;
    }

    setTasks(data ?? []);
  }

  async function createTask(taskValues) {
    if (!user) {
      setError("Guest session is not ready.");
      return false;
    }

    setSubmitting(true);
    setError("");

    const newTask = {
      ...taskValues,
      status: "todo",
      user_id: user.id,
    };

    const { data, error: createError } = await supabase
      .from("tasks")
      .insert(newTask)
      .select()
      .single();

    setSubmitting(false);

    if (createError) {
      setError(createError.message);
      return false;
    }

    setTasks((currentTasks) => [data, ...currentTasks]);
    return true;
  }

  async function handleDragEnd(event) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const taskId = active.id;
    const newStatus = over.id;

    if (!VALID_STATUSES.includes(newStatus)) {
      return;
    }

    const task = tasks.find((item) => item.id === taskId);

    if (!task || task.status === newStatus) {
      return;
    }

    const oldStatus = task.status;

    setError("");
    setUpdatingTaskId(taskId);

    // Update the interface immediately.
    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: newStatus,
            }
          : item
      )
    );

    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        status: newStatus,
      })
      .eq("id", taskId);

    setUpdatingTaskId(null);

    if (updateError) {
      // Return the task to its original column if Supabase fails.
      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: oldStatus,
              }
            : item
        )
      );

      setError(updateError.message);
    }
  }

  if (loading) {
    return (
      <main className="status-page">
        <div className="loader" />
        <p>Creating your guest session and loading tasks...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="status-page">
        <h1>Unable to open the board</h1>
        <p className="error-message">
          {error || "A guest session could not be created."}
        </p>

        <button onClick={initializeApp}>Try again</button>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Guest task board</p>
          <h1>Kanban Board</h1>
          <p>
            Create a task and drag it between columns to update its status.
          </p>
        </div>

        <span className="guest-badge">
          Guest {user.id.slice(0, 8)}
        </span>
      </header>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {updatingTaskId && (
        <div className="saving-message" role="status">
          Saving task status...
        </div>
      )}

      <TaskForm
        onCreateTask={createTask}
        submitting={submitting}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter(
              (task) => task.status === column.id
            );

            return (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
              />
            );
          })}
        </div>
      </DndContext>
    </main>
  );
}