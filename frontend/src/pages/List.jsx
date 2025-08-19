import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvents, aiAnalyze, clearAI } from "../features/events/eventsSlice";
import { Link } from "react-router-dom";
import dayjs from "dayjs";

const STATUSES = ["", "Open", "In-Progress", "Closed"];
const SEVERITIES = ["", "Low", "Medium", "High", "Critical"];
const TYPES = ["", "Deviation", "CAPA", "Change Control", "Audit"];

export default function List() {
  const dispatch = useDispatch();
  const { items, loading, aiResult } = useSelector((s) => s.events);
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [type, setType] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [sortBy, setSortBy] = useState(""); // NEW: sorting control

  useEffect(() => {
    dispatch(
      fetchEvents({
        status: status || undefined,
        severity: severity || undefined,
        event_type: type || undefined,
      })
    );
  }, [dispatch, status, severity, type]);

  // helper for date sorting (keeps undefined dates at the end for asc, at the start for desc)
  const dateNumOr = (iso, fallback) =>
    iso ? new Date(iso).getTime() : fallback;

  // NEW: client-side sorting without mutating original array
  const sorted = useMemo(() => {
    const arr = [...items];
    if (sortBy === "due_asc") {
      return arr.sort(
        (a, b) =>
          dateNumOr(a.due_date, Number.POSITIVE_INFINITY) -
          dateNumOr(b.due_date, Number.POSITIVE_INFINITY)
      );
    }
    if (sortBy === "due_desc") {
      return arr.sort(
        (a, b) =>
          dateNumOr(b.due_date, Number.NEGATIVE_INFINITY) -
          dateNumOr(a.due_date, Number.NEGATIVE_INFINITY)
      );
    }
    if (sortBy === "sev_asc") {
      return arr.sort((a, b) =>
        (a.severity || "").localeCompare(b.severity || "")
      );
    }
    if (sortBy === "sev_desc") {
      return arr.sort((a, b) =>
        (b.severity || "").localeCompare(a.severity || "")
      );
    }
    // default: leave server order (newest first)
    return arr;
  }, [items, sortBy]);

  const runAI = (action) => {
    const body = { action };
    if (action === "suggest_next_steps" || action === "closure_draft") {
      if (!selectedId) return alert("Select an Event ID first.");
      body.event_id = Number(selectedId);
    }
    dispatch(aiAnalyze(body));
  };

  return (
    <div className="container">
      <div className="toolbar">
        <h1 className="title">QMS Events</h1>
        <Link to="/wizard" className="primary">
          + New Event
        </Link>
      </div>

      <div className="filters card">
        <div className="row">
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s || "All"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Severity
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s || "All"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((s) => (
                <option key={s} value={s}>
                  {s || "All"}
                </option>
              ))}
            </select>
          </label>

          {/* NEW: Sort control */}
          <label>
            Sort by
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="">Newest first</option>
              <option value="due_asc">Due date ↑</option>
              <option value="due_desc">Due date ↓</option>
              <option value="sev_asc">Severity A→Z</option>
              <option value="sev_desc">Severity Z→A</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Initiator</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7">Loading…</td>
                  </tr>
                )}
                {!loading && sorted.length === 0 && (
                  <tr>
                    <td colSpan="7">No events</td>
                  </tr>
                )}
                {!loading &&
                  sorted.map((e) => (
                    <tr key={e.id}>
                      <td>{e.id}</td>
                      <td>{e.title}</td>
                      <td>{e.event_type}</td>
                      <td>{e.status}</td>
                      <td>
                        {e.due_date
                          ? dayjs(e.due_date).format("YYYY-MM-DD HH:mm")
                          : "-"}
                      </td>
                      <td>{e.initiator}</td>
                      <td className={`sev ${e.severity.toLowerCase()}`}>
                        {e.severity}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="aiHeader">
            <h2>AI Assistance</h2>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Select event (for targeted actions)</option>
              {items.map((e) => (
                <option key={e.id} value={e.id}>
                  #{e.id} — {e.title}
                </option>
              ))}
            </select>
          </div>

          <div className="aiButtons">
            <button onClick={() => runAI("high_risk")}>Show high-risk events</button>
            <button onClick={() => runAI("summarize_open_last_month")}>
              Summarize open events (30d)
            </button>
            <button onClick={() => runAI("suggest_next_steps")}>
              Suggest next steps (selected)
            </button>
            <button onClick={() => runAI("capa_trends")}>Identify CAPA trends</button>
            <button onClick={() => runAI("closure_draft")}>
              Generate closure draft (selected)
            </button>
            <button className="ghost" onClick={() => dispatch(clearAI())}>
              Clear
            </button>
          </div>

          <div className="aiResult">
            {aiResult?.loading && <div>Thinking…</div>}
            {aiResult?.error && <div className="error">{aiResult.error}</div>}
            {aiResult?.data && (
              <>
                <h3>{aiResult.data.title || "AI Result"}</h3>
                {"gemini_text" in aiResult.data ? (
                  <pre className="prewrap">{aiResult.data.gemini_text}</pre>
                ) : (
                  <pre className="prewrap">
                    {JSON.stringify(aiResult.data, null, 2)}
                  </pre>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
