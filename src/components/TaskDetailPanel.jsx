import { useState } from "react";

export default function TaskDetailPanel({
  task,
  comments,
  loading,
  submitting,
  onClose,
  onAddComment,
}) {
  const [commentBody, setCommentBody] = useState("");

  if (!task) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedBody = commentBody.trim();

    if (!trimmedBody) {
      return;
    }

    const created = await onAddComment(trimmedBody);

    if (created) {
      setCommentBody("");
    }
  }

  return (
    <div className="task-panel-backdrop" onClick={onClose}>
      <aside
        className="task-detail-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="task-panel-header">
          <div>
            <span className="task-panel-label">Task details</span>
            <h2>{task.title}</h2>
          </div>

          <button
            type="button"
            className="panel-close-button"
            onClick={onClose}
            aria-label="Close task details"
          >
            ×
          </button>
        </div>

        <div className="task-panel-content">
          {task.description && (
            <section className="task-detail-section">
              <h3>Description</h3>
              <p>{task.description}</p>
            </section>
          )}

          {task.due_date && (
            <section className="task-detail-section">
              <h3>Due date</h3>
              <p>
                {new Date(`${task.due_date}T00:00:00`).toLocaleDateString()}
              </p>
            </section>
          )}

          {task.assignees?.length > 0 && (
            <section className="task-detail-section">
              <h3>Assignees</h3>

              <div className="panel-assignees">
                {task.assignees.map((member) => (
                  <div key={member.id} className="panel-assignee">
                    <span
                      className="avatar"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </span>

                    <span>{member.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="comments-section">
            <h3>Comments</h3>

            {loading ? (
              <p className="comments-message">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="comments-message">
                No comments yet. Add the first comment.
              </p>
            ) : (
              <div className="comments-list">
                {comments.map((comment) => (
                  <article key={comment.id} className="comment">
                    <p>{comment.body}</p>

                    <time dateTime={comment.created_at}>
                      {new Date(comment.created_at).toLocaleString()}
                    </time>
                  </article>
                ))}
              </div>
            )}

            <form className="comment-form" onSubmit={handleSubmit}>
              <textarea
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                placeholder="Write a comment..."
                rows="4"
                disabled={submitting}
                required
              />

              <button
                type="submit"
                disabled={submitting || !commentBody.trim()}
              >
                {submitting ? "Posting..." : "Post comment"}
              </button>
            </form>
          </section>
        </div>
      </aside>
    </div>
  );
}