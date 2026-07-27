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
import LabelForm from "./components/LabelForm";

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
  const [labels, setLabels] = useState([]);
  const [taskLabels, setTaskLabels] = useState([]);
  const [addingLabel, setAddingLabel] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState("all");

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
      labelsResult,
      taskLabelsResult,
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

      supabase
        .from("labels")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),

      supabase
        .from("task_labels")
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

    if (labelsResult.error) {
      throw labelsResult.error;
    }

    if (taskLabelsResult.error) {
      throw taskLabelsResult.error;
    }

    setTasks(tasksResult.data ?? []);
    setMembers(membersResult.data ?? []);
    setAssignments(assignmentsResult.data ?? []);
    setLabels(labelsResult.data ?? []);
    setTaskLabels(taskLabelsResult.data ?? []);
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
      const {
        assigneeIds,
        labelIds,
        ...taskFields
      } = taskValues;

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
      let createdTaskLabels = [];

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

      if (labelIds.length > 0) {
        const labelRows = labelIds.map((labelId) => ({
          task_id: createdTask.id,
          label_id: labelId,
          user_id: user.id,
        }));

        const { data, error: taskLabelError } =
          await supabase
            .from("task_labels")
            .insert(labelRows)
            .select();

        if (taskLabelError) {
          throw taskLabelError;
        }

        createdTaskLabels = data ?? [];
      }

      setTasks((currentTasks) => [
        createdTask,
        ...currentTasks,
      ]);

      setAssignments((currentAssignments) => [
        ...currentAssignments,
        ...createdAssignments,
      ]);

      setTaskLabels((currentTaskLabels) => [
        ...currentTaskLabels,
        ...createdTaskLabels,
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

  async function createLabel(labelValues) {
    if (!user) {
      setError("Guest session is not ready.");
      return false;
    }

    setAddingLabel(true);
    setError("");

    try {
      const { data, error: labelError } = await supabase
        .from("labels")
        .insert({
          ...labelValues,
          user_id: user.id,
        })
        .select()
        .single();

      if (labelError) {
        throw labelError;
      }

      setLabels((currentLabels) => [
        ...currentLabels,
        data,
      ]);

      return true;
    } catch (caughtError) {
      if (caughtError.code === "23505") {
        setError("A label with that name already exists.");
      } else {
        setError(
          caughtError.message || "Unable to create label."
        );
      }

      return false;
    } finally {
      setAddingLabel(false);
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

  const tasksWithDetails = tasks.map((task) => {
    const memberIds = assignments
      .filter((assignment) => assignment.task_id === task.id)
      .map((assignment) => assignment.member_id);

    const labelIds = taskLabels
      .filter((taskLabel) => taskLabel.task_id === task.id)
      .map((taskLabel) => taskLabel.label_id);

    return {
      ...task,

      assignees: members.filter((member) =>
        memberIds.includes(member.id)
      ),

      labels: labels.filter((label) =>
        labelIds.includes(label.id)
      ),
    };
  });

  const filteredTasks =
    selectedLabelId === "all"
      ? tasksWithDetails
      : tasksWithDetails.filter((task) =>
          task.labels.some(
            (label) => label.id === selectedLabelId
          )
        );

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

      <section className="labels-section">
        <div className="labels-section-header">
          <div>
            <h2>Labels</h2>

            <div className="labels-list">
              {labels.length === 0 ? (
                <span className="labels-empty">
                  No labels created yet
                </span>
              ) : (
                labels.map((label) => (
                  <span
                    key={label.id}
                    className="label-chip"
                    style={{
                      borderColor: label.color,
                      color: label.color,
                    }}
                  >
                    <span
                      className="label-color-dot"
                      style={{ backgroundColor: label.color }}
                    />

                    {label.name}
                  </span>
                ))
              )}
            </div>
          </div>

          <LabelForm
            onCreateLabel={createLabel}
            submitting={addingLabel}
          />
        </div>
      </section>

      <TaskForm
        onCreateTask={createTask}
        submitting={submitting}
        members={members}
        labels={labels}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="board-filter">
          <label htmlFor="label-filter">
            Filter by label
          </label>

          <select
            id="label-filter"
            value={selectedLabelId}
            onChange={(event) =>
              setSelectedLabelId(event.target.value)
            }
          >
            <option value="all">All labels</option>

            {labels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>

          {selectedLabelId !== "all" && (
            <button
              type="button"
              className="clear-filter-button"
              onClick={() => setSelectedLabelId("all")}
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="kanban-board">
          {COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter(
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