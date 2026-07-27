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
import TeamMemberForm from "./components/TeamMemberForm";
import TaskDetailPanel from "./components/TaskDetailPanel";

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [error, setError] = useState("");
  const [members, setMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

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
      await loadBoardData(session.user.id);
    } catch (caughtError) {
      setError(caughtError.message || "Unable to start the app.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBoardData(userId) {
    const [
      tasksResult,
      membersResult,
      assignmentsResult,
    ] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      supabase
        .from("team_members")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),

      supabase
        .from("task_assignees")
        .select("*")
        .eq("user_id", userId),
    ]);

    if (tasksResult.error) {
      throw tasksResult.error;
    }

    if (membersResult.error) {
      throw membersResult.error;
    }

    if (assignmentsResult.error) {
      throw assignmentsResult.error;
    }

    setTasks(tasksResult.data ?? []);
    setMembers(membersResult.data ?? []);
    setAssignments(assignmentsResult.data ?? []);
  }

  async function createMember(memberValues) {
    if (!user) {
      setError("Guest session is not ready.");
      return false;
    }

    setAddingMember(true);
    setError("");

    try {
      const { data, error: memberError } = await supabase
        .from("team_members")
        .insert({
          ...memberValues,
          user_id: user.id,
        })
        .select()
        .single();

      if (memberError) {
        throw memberError;
      }

      setMembers((currentMembers) => [
        ...currentMembers,
        data,
      ]);

      return true;
    } catch (caughtError) {
      setError(
        caughtError.message || "Unable to add team member."
      );

      return false;
    } finally {
      setAddingMember(false);
    }
  }

  async function createTask(taskValues) {
    if (!user) {
      setError("Guest session is not ready.");
      return false;
    }

    setSubmitting(true);
    setError("");

    try {
      const { assigneeIds, ...taskFields } = taskValues;

      const { data: createdTask, error: createError } =
        await supabase
          .from("tasks")
          .insert({
            ...taskFields,
            status: "todo",
            user_id: user.id,
          })
          .select()
          .single();

      if (createError) {
        throw createError;
      }

      let createdAssignments = [];

      if (assigneeIds.length > 0) {
        const assignmentRows = assigneeIds.map((memberId) => ({
          task_id: createdTask.id,
          member_id: memberId,
          user_id: user.id,
        }));

        const { data, error: assignmentError } =
          await supabase
            .from("task_assignees")
            .insert(assignmentRows)
            .select();

        if (assignmentError) {
          throw assignmentError;
        }

        createdAssignments = data ?? [];
      }

      setTasks((currentTasks) => [
        createdTask,
        ...currentTasks,
      ]);

      setAssignments((currentAssignments) => [
        ...currentAssignments,
        ...createdAssignments,
      ]);

      return true;
    } catch (caughtError) {
      setError(
        caughtError.message || "Unable to create task."
      );

      return false;
    } finally {
      setSubmitting(false);
    }
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

  async function loadComments(taskId) {
    setLoadingComments(true);
    setError("");

    try {
      const { data, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (commentsError) {
        throw commentsError;
      }

      setComments(data ?? []);
    } catch (caughtError) {
      setError(
        caughtError.message || "Unable to load comments."
      );
    } finally {
      setLoadingComments(false);
    }
  }

  async function openTaskDetails(task) {
    setSelectedTask(task);
    setComments([]);
    await loadComments(task.id);
  }

  function closeTaskDetails() {
    setSelectedTask(null);
    setComments([]);
  }

  async function addComment(body) {
    if (!user || !selectedTask) {
      setError("Guest session or task is not available.");
      return false;
    }

    setSubmittingComment(true);
    setError("");

    try {
      const { data, error: commentError } = await supabase
        .from("comments")
        .insert({
          task_id: selectedTask.id,
          user_id: user.id,
          body,
        })
        .select()
        .single();

      if (commentError) {
        throw commentError;
      }

      setComments((currentComments) => [
        ...currentComments,
        data,
      ]);

      return true;
    } catch (caughtError) {
      setError(
        caughtError.message || "Unable to post comment."
      );

      return false;
    } finally {
      setSubmittingComment(false);
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

  const tasksWithAssignees = tasks.map((task) => {
    const memberIds = assignments
      .filter((assignment) => assignment.task_id === task.id)
      .map((assignment) => assignment.member_id);

    return {
      ...task,
      assignees: members.filter((member) =>
        memberIds.includes(member.id)
      ),
    };
  });

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

      <section className="team-section">
        <div className="team-header">
            <h2>Team members</h2>

            <div className="team-member-list">
            {members.length === 0 ? (
                <span>No team members yet</span>
            ) : (
                members.map((member) => (
                <div key={member.id} className="team-member">
                    <span
                    className="avatar"
                    style={{ backgroundColor: member.color }}
                    >
                    {member.name.charAt(0).toUpperCase()}
                    </span>

                    <span>{member.name}</span>
                </div>
                ))
            )}
            </div>
        </div>

        <TeamMemberForm
            onCreateMember={createMember}
            submitting={addingMember}
        />
      </section>

      <TaskForm
        onCreateTask={createTask}
        submitting={submitting}
        members={members}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {COLUMNS.map((column) => {
            const columnTasks = tasksWithAssignees.filter(
              (task) => task.status === column.id
            );

            return (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
                onOpenTask={openTaskDetails}
              />
            );
          })}
        </div>
      </DndContext>
      <TaskDetailPanel
        task={selectedTask}
        comments={comments}
        loading={loadingComments}
        submitting={submittingComment}
        onClose={closeTaskDetails}
        onAddComment={addComment}
      />

    </main>
  );
}