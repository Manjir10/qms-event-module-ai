export default function Stepper({ steps = [], active = 0 }) {
    return (
      <div className="flex items-center mb-6">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold 
              ${i <= active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>
              {i + 1}
            </div>
            <div className={`ml-2 mr-4 text-sm ${i <= active ? "font-semibold" : ""}`}>{s}</div>
            {i < steps.length - 1 && <div className="w-10 h-[2px] bg-gray-300 mr-4" />}
          </div>
        ))}
      </div>
    );
  }
  