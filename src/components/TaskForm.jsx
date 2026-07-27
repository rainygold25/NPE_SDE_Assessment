import { useState } from "react";
import AssigneePicker from "./AssigneePicker";
import LabelPicker from "./LabelPicker";

const INITIAL_FORM = {
  title: "",
  description: "",
  priority: "normal",
  due_date: "",
};

export default function TaskForm({ members, labels, onCreateTask, submitting }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [labelIds, setLabelIds] = useState([]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedTitle = form.title.trim();

    if (!trimmedTitle) {
      return;
    }

    const created = await onCreateTask({
      title: trimmedTitle,
      description: form.description.trim() || null,
      priority: form.priority,
      due_date: form.due_date || null,
      assigneeIds,
      labelIds
    });

    if (created) {
      setForm(INITIAL_FORM);
      setAssigneeIds([]);
      setLabelIds([]);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>Create a task</h2>

      <label>
        Title <span aria-hidden="true">*</span>
        <input
          name="title"
          value={form.title}
          onChange={updateField}
          placeholder="Enter a task title"
          required
        />
      </label>

      <label>
        Description
        <textarea
          name="description"
          value={form.description}
          onChange={updateField}
          placeholder="Optional description"
          rows="3"
        />
      </label>

      <div className="form-row">
        <label>
          Priority
          <select
            name="priority"
            value={form.priority}
            onChange={updateField}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </label>

        <label>
          Due date
          <input
            name="due_date"
            type="date"
            value={form.due_date}
            onChange={updateField}
          />
        </label>
      </div>
      <fieldset className="assignee-fieldset">
          <legend>Assignees</legend>

          <AssigneePicker
              members={members}
              selectedIds={assigneeIds}
              onChange={setAssigneeIds}
          />
      </fieldset>
      <fieldset className="label-fieldset">
        <legend>Labels</legend>

        <LabelPicker
            labels={labels}
            selectedIds={labelIds}
            onChange={setLabelIds}
        />
      </fieldset>
      <button type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create task"}
      </button>
    </form>
  );
}