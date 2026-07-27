import { useDraggable } from "@dnd-kit/core";

export default function TaskCard({ task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  function formatDueDate(date) {
    if (!date) {
      return null;
    }

    return new Date(`${date}T00:00:00`).toLocaleDateString();
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? "dragging" : ""}`}
      {...listeners}
      {...attributes}
    >
      <div className="task-card-header">
        <h3>{task.title}</h3>

        {task.priority && (
          <span className={`priority priority-${task.priority}`}>
            {task.priority}
          </span>
        )}
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      {task.due_date && (
        <p className="due-date">
          Due: {formatDueDate(task.due_date)}
        </p>
      )}
    </article>
  );
}