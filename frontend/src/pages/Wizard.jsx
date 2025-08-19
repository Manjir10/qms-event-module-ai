import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { setDraft, resetDraft, createEvent } from "../features/events/eventsSlice";
import Stepper from "../components/Stepper";
import Field from "../components/Field";
import { useNavigate } from "react-router-dom";

const TYPES = ["Deviation", "CAPA", "Change Control", "Audit"];
const STATUSES = ["Open", "In-Progress", "Closed"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const PRIORITIES = ["Low", "Medium", "High"];

export default function Wizard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const draft = useSelector((s) => s.events.draft);
  const [step, setStep] = useState(0);

  const next = () => setStep((s) => Math.min(s + 1, 2));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const handleChange = (e) => dispatch(setDraft({ [e.target.name]: e.target.value }));

  const submit = async () => {
    const payload = { ...draft, due_date: draft.due_date || null };
    await dispatch(createEvent(payload));
    dispatch(resetDraft());
    navigate("/");
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Create QMS Event</h1>
        <Stepper steps={["Basics", "Details", "Risk & Schedule"]} active={step} />

        {step === 0 && (
          <div className="grid">
            <Field label="Event Type">
              <select name="event_type" value={draft.event_type} onChange={handleChange}>
                <option value="">Select type</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Title">
              <input name="title" value={draft.title} onChange={handleChange} placeholder="Short, clear title" />
            </Field>
            <Field label="Description">
              <textarea rows={5} name="description" value={draft.description} onChange={handleChange} placeholder="Describe the event..." />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid">
            <Field label="Department">
              <input name="department" value={draft.department} onChange={handleChange} placeholder="e.g., Production, QA" />
            </Field>
            <Field label="Initiator">
              <input name="initiator" value={draft.initiator} onChange={handleChange} placeholder="Your name" />
            </Field>
            <Field label="Attachments (URL or path) - optional">
              <input name="attachments" value={draft.attachments} onChange={handleChange} placeholder="https://..." />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="grid">
            <Field label="Status">
              <select name="status" value={draft.status} onChange={handleChange}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Severity">
              <select name="severity" value={draft.severity} onChange={handleChange}>
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select name="priority" value={draft.priority} onChange={handleChange}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Due Date & Time (optional)">
              <input type="datetime-local" name="due_date" value={draft.due_date} onChange={handleChange} />
            </Field>
          </div>
        )}

        <div className="actions">
          <button onClick={() => navigate("/")}>Cancel</button>
          {step > 0 && <button onClick={back}>Back</button>}
          {step < 2 && <button className="primary" onClick={next} disabled={!draft.title || !draft.event_type || !draft.description}>Next</button>}
          {step === 2 && <button className="primary" onClick={submit} disabled={!draft.status || !draft.severity || !draft.priority}>Submit</button>}
        </div>
      </div>
    </div>
  );
}
