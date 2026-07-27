import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

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
      className="task-card"
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
        <p className="due-date">
          Due: {new Date(task.due_date).toLocaleDateString()}
        </p>
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