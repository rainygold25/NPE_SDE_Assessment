export default function AssigneePicker({
  members,
  selectedIds,
  onChange,
}) {
  function toggleMember(memberId) {
    if (selectedIds.includes(memberId)) {
      onChange(
        selectedIds.filter((id) => id !== memberId)
      );
    } else {
      onChange([...selectedIds, memberId]);
    }
  }

  if (members.length === 0) {
    return (
      <p className="form-help">
        Add team members before assigning a task.
      </p>
    );
  }

  return (
    <div className="assignee-picker">
      {members.map((member) => {
        const selected = selectedIds.includes(member.id);

        return (
          <button
            key={member.id}
            type="button"
            className={`assignee-option ${
              selected ? "selected" : ""
            }`}
            onClick={() => toggleMember(member.id)}
          >
            <span
                className="avatar avatar-small"
                style={{ backgroundColor: member.color }}
            >
                {selected ? "✓" : member.name.charAt(0).toUpperCase()}
            </span>

            {member.name}
          </button>
        );
      })}
    </div>
  );
}