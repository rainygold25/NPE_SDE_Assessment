import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

export default function KanbanColumn({ column, tasks, onOpenTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column ${isOver ? "column-over" : ""}`}
    >
      <div className="column-header">
        <h2>{column.title}</h2>
        <span>{tasks.length}</span>
      </div>

      <div className="column-tasks">
        {tasks.length === 0 ? (
          <p className="empty-column">Drop tasks here</p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpenTask={onOpenTask} />
          ))
        )}
      </div>
    </section>
  );
}