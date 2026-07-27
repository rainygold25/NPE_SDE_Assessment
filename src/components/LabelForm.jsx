import { useState } from "react";

export default function LabelForm({
  onCreateLabel,
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

    const created = await onCreateLabel({
      name: trimmedName,
      color,
    });

    if (created) {
      setName("");
      setColor("#6366f1");
    }
  }

  return (
    <form className="label-form" onSubmit={handleSubmit}>
      <h3>Create label</h3>

      <div className="label-form-row">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Label name"
          maxLength="30"
          required
        />

        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          aria-label="Label color"
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add label"}
        </button>
      </div>
    </form>
  );
}