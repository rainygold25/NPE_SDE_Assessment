import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

function getDueDateStatus(dueDate) {
  if (!dueDate) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${dueDate}T00:00:00`);
  due.setHours(0, 0, 0, 0);

  const differenceInMilliseconds = due - today;
  const differenceInDays = Math.round(
    differenceInMilliseconds / (1000 * 60 * 60 * 24)
  );

  if (differenceInDays < 0) {
    return {
      type: "overdue",
      label: "Overdue",
      icon: "⚠",
    };
  }

  if (differenceInDays === 0) {
    return {
      type: "due-soon",
      label: "Due today",
      icon: "⏰",
    };
  }

  if (differenceInDays <= 3) {
    return {
      type: "due-soon",
      label: `Due in ${differenceInDays} days`,
      icon: "⏰",
    };
  }

  return {
    type: "upcoming",
    label: "Upcoming",
    icon: "📅",
  };
}

export default function TaskCard({ task, onOpenTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  });

  const dueDateStatus = getDueDateStatus(task.due_date);

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <article
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`task-card ${
            dueDateStatus?.type
            ? `task-card-${dueDateStatus.type}`
            : ""
        }`}
    >
      <div className="task-card-header">
        <h3>{task.title}</h3>

        {task.priority && (
          <span className="priority-badge">
            {task.priority}
          </span>
        )}
      </div>

      {task.description && (
        <p>{task.description}</p>
      )}

      {task.due_date && (
        <div className="task-due-date-row">
            <span
            className={`due-date-badge ${
                dueDateStatus?.type ?? ""
            }`}
            >
            <span aria-hidden="true">
                {dueDateStatus?.icon}
            </span>

            {dueDateStatus?.label}
            </span>

            <span className="due-date-value">
            {new Date(
                `${task.due_date}T00:00:00`
            ).toLocaleDateString()}
            </span>
        </div>
      )}

      {task.labels?.length > 0 && (
        <div className="task-labels">
            {task.labels.map((label) => (
            <span
                key={label.id}
                className="task-label"
                style={{
                backgroundColor: `${label.color}18`,
                borderColor: label.color,
                color: label.color,
                }}
            >
                {label.name}
            </span>
            ))}
        </div>
      )}

      {task.assignees?.length > 0 && (
        <div className="task-assignee-row">
          <div className="task-assignees">
            {task.assignees.map((member) => (
              <span
                key={member.id}
                className="task-avatar"
                style={{ backgroundColor: member.color }}
                title={member.name}
              >
                {member.name.charAt(0).toUpperCase()}
              </span>
            ))}
          </div>

          <span className="assignee-count">
            {task.assignees.length}{" "}
            {task.assignees.length === 1 ? "member" : "members"}
          </span>
        </div>
      )}

      <button
        type="button"
        className="task-details-button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
            event.stopPropagation();
            onOpenTask(task);
        }}
        >
        View details & comments
      </button>
    </article>
  );
}