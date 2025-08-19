import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

export const fetchEvents = createAsyncThunk("events/fetch", async (params = {}) => {
  const res = await api.get("/events", { params });
  return res.data;
});
export const createEvent = createAsyncThunk("events/create", async (payload) => {
  const res = await api.post("/events", payload);
  return res.data;
});
export const fetchEventById = createAsyncThunk("events/getOne", async (id) => {
  const res = await api.get(`/events/${id}`);
  return res.data;
});
export const updateEvent = createAsyncThunk("events/update", async ({ id, data }) => {
  const res = await api.put(`/events/${id}`, data);
  return res.data;
});
export const aiAnalyze = createAsyncThunk("events/ai", async (body) => {
  const res = await api.post("/ai/analyze", body);
  return res.data;
});

const initialDraft = {
  event_type: "", title: "", description: "",
  department: "", initiator: "", status: "Open",
  severity: "Medium", priority: "Medium", due_date: "", attachments: ""
};

const eventsSlice = createSlice({
  name: "events",
  initialState: { items: [], loading: false, error: null, draft: initialDraft, aiResult: null },
  reducers: {
    setDraft: (s, { payload }) => { s.draft = { ...s.draft, ...payload }; },
    resetDraft: (s) => { s.draft = initialDraft; },
    clearAI: (s) => { s.aiResult = null; }
  },
  extraReducers: (b) => {
    b.addCase(fetchEvents.pending, (s)=>{s.loading=true;})
     .addCase(fetchEvents.fulfilled, (s,{payload})=>{s.loading=false; s.items=payload;})
     .addCase(fetchEvents.rejected, (s,{error})=>{s.loading=false; s.error=error.message;})
     .addCase(createEvent.fulfilled, (s,{payload})=>{s.items.unshift(payload);})
     .addCase(aiAnalyze.pending, (s)=>{s.aiResult={loading:true};})
     .addCase(aiAnalyze.fulfilled, (s,{payload})=>{s.aiResult={loading:false, data:payload};})
     .addCase(aiAnalyze.rejected, (s,{error})=>{s.aiResult={loading:false, error:error.message};});
  }
});

export const { setDraft, resetDraft, clearAI } = eventsSlice.actions;
export default eventsSlice.reducer;
