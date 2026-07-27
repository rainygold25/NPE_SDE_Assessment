export default function LabelPicker({
  labels,
  selectedIds,
  onChange,
}) {
  function toggleLabel(labelId) {
    if (selectedIds.includes(labelId)) {
      onChange(
        selectedIds.filter((id) => id !== labelId)
      );
    } else {
      onChange([...selectedIds, labelId]);
    }
  }

  if (labels.length === 0) {
    return (
      <p className="form-help">
        Create a label before assigning labels to tasks.
      </p>
    );
  }

  return (
    <div className="label-picker">
      {labels.map((label) => {
        const selected = selectedIds.includes(label.id);

        return (
          <button
            key={label.id}
            type="button"
            className={`label-option ${
              selected ? "selected" : ""
            }`}
            onClick={() => toggleLabel(label.id)}
          >
            <span
              className="label-color-dot"
              style={{ backgroundColor: label.color }}
            />

            <span>{label.name}</span>

            {selected && (
              <span className="label-selected-check">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}