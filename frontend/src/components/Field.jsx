export default function Field({ label, children }) {
    return (
      <label className="block mb-4">
        <div className="text-sm font-medium mb-1">{label}</div>
        {children}
      </label>
    );
  }
  