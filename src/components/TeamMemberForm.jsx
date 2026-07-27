import { useState } from "react";

export default function TeamMemberForm({
  onCreateMember,
  submitting,
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    const created = await onCreateMember({
      name: trimmedName,
      color,
    });

    if (created) {
      setName("");
      setColor("#6366f1");
    }
  }

  return (
    <form className="member-form" onSubmit={handleSubmit}>
      <h3>Add team member</h3>

      <div className="member-form-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Member name"
          required
        />

        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          aria-label="Member color"
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add member"}
        </button>
      </div>
    </form>
  );
}