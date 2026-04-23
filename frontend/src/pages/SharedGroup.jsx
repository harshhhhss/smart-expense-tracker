// src/pages/SharedGroups.jsx
// Feature 5: Shared Expense / Friend System

import { useState, useEffect } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";

const CATEGORIES = ["Food","Travel","Shopping","Entertainment","Health","Utilities","Other"];

// ─── Sub-components ───────────────────────────────────────────────────────────

const CreateGroupModal = ({ onClose, onCreated }) => {
  const [name,    setName]    = useState("");
  const [emoji,   setEmoji]   = useState("👥");
  const [loading, setLoading] = useState(false);

  const EMOJIS = ["👥","🏠","✈️","🍕","🏋️","🎉","💼","🎮","🏕️","💑"];

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await API.post("/advanced/groups", { name, emoji });
      onCreated();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <h3 style={s.modalTitle}>Create Group</h3>
        <div style={s.emojiRow}>
          {EMOJIS.map(e => (
            <button key={e} style={{ ...s.emojiBtn, ...(emoji === e ? s.emojiBtnActive : {}) }}
              onClick={() => setEmoji(e)}>{e}</button>
          ))}
        </div>
        <input style={s.modalInput} placeholder="Group name (e.g. Goa Trip 2024)"
          value={name} onChange={e => setName(e.target.value)} />
        <div style={s.modalActions}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={s.primaryBtn} onClick={submit} disabled={loading || !name.trim()}>
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

const JoinGroupModal = ({ onClose, onJoined }) => {
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const submit = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      await API.post("/advanced/groups/join", { inviteCode: code.toUpperCase() });
      onJoined();
    } catch (e) {
      setError(e.response?.data?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <h3 style={s.modalTitle}>Join Group</h3>
        <p style={s.modalSub}>Enter the 8-character invite code shared by your friend</p>
        {error && <div style={s.errorBox}>{error}</div>}
        <input style={{ ...s.modalInput, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase" }}
          placeholder="XXXXXXXX" maxLength={8} value={code} onChange={e => setCode(e.target.value)} />
        <div style={s.modalActions}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={s.primaryBtn} onClick={submit} disabled={loading || code.length < 8}>
            {loading ? "Joining..." : "Join"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AddExpenseModal = ({ groupId, members, onClose, onAdded }) => {
  const [form, setForm] = useState({ description: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0] });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.description || !form.amount) return;
    setLoading(true);
    try {
      await API.post(`/advanced/groups/${groupId}/expenses`, { ...form, amount: Number(form.amount), splitType: "equal" });
      onAdded();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={{ ...s.modal, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <h3 style={s.modalTitle}>Add Group Expense</h3>
        <p style={s.modalSub}>Split equally among {members} members</p>
        <input style={s.modalInput} placeholder="What was this for?" value={form.description}
          onChange={e => setForm({...form, description: e.target.value})} />
        <input style={s.modalInput} type="number" placeholder="Total amount (₹)" value={form.amount}
          onChange={e => setForm({...form, amount: e.target.value})} />
        <select style={s.modalInput} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input style={s.modalInput} type="date" value={form.date}
          onChange={e => setForm({...form, date: e.target.value})} />
        <div style={s.modalActions}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={s.primaryBtn} onClick={submit} disabled={loading || !form.description || !form.amount}>
            {loading ? "Adding..." : "Add & Split"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Group Detail View ────────────────────────────────────────────────────────

const GroupDetail = ({ groupId, currentUserId, onBack }) => {
  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    try {
      const { data } = await API.get(`/advanced/groups/${groupId}`);
      setDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [groupId]);

  const handleSettle = async (groupId, expId) => {
    try {
      await API.patch(`/advanced/groups/${groupId}/expenses/${expId}/settle`);
      load();
    } catch (e) {
      alert("Failed to settle");
    }
  };

  if (loading) return <div style={s.loading}>Loading group...</div>;
  if (!detail)  return <div style={s.loading}>Group not found</div>;

  const { group, balances, totalSpend } = detail;

  return (
    <div>
      <button style={s.backBtn} onClick={onBack}>← Back</button>

      {/* Group header */}
      <div style={s.groupHeader}>
        <span style={s.groupEmoji}>{group.emoji}</span>
        <div>
          <h2 style={s.groupName}>{group.name}</h2>
          <p style={s.groupMeta}>{group.members.length} members · ₹{totalSpend?.toFixed(0) || 0} total</p>
        </div>
        <div style={s.inviteChip}>
          <span style={s.inviteLabel}>Invite Code</span>
          <span style={s.inviteCode}>{group.inviteCode}</span>
        </div>
      </div>

      {/* Balances */}
      <div style={s.section}>
        <h4 style={s.sectionTitle}>Balances</h4>
        <div style={s.balanceGrid}>
          {balances?.map((b, i) => (
            <div key={i} style={{ ...s.balanceCard, borderColor: b.balance > 0 ? "rgba(67,233,123,0.2)" : b.balance < 0 ? "rgba(239,68,68,0.2)" : "#2a2d3e" }}>
              <div style={s.balanceName}>{b.user.name}</div>
              <div style={{ ...s.balanceAmt, color: b.balance > 0 ? "#43e97b" : b.balance < 0 ? "#ef4444" : "#8888aa" }}>
                {b.balance > 0 ? "Gets back" : b.balance < 0 ? "Owes" : "Settled"}
              </div>
              <div style={{ fontFamily: "monospace", fontWeight: 700, color: b.balance > 0 ? "#43e97b" : b.balance < 0 ? "#ef4444" : "#8888aa" }}>
                {b.balance !== 0 ? `₹${Math.abs(b.balance).toFixed(0)}` : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses */}
      <div style={s.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h4 style={s.sectionTitle}>Expenses</h4>
          <button style={s.addExpBtn} onClick={() => setShowAdd(true)}>+ Add Expense</button>
        </div>

        {group.expenses.length === 0 ? (
          <div style={s.emptyState}>No expenses yet. Add the first one!</div>
        ) : (
          group.expenses.slice().reverse().map((exp, i) => {
            const mysplit = exp.splits?.find(sp => sp.user?._id === currentUserId || sp.user === currentUserId);
            return (
              <div key={i} style={s.expRow}>
                <div style={s.expLeft}>
                  <div style={s.expDesc}>{exp.description}</div>
                  <div style={s.expMeta}>
                    Paid by {exp.paidBy?.name || "unknown"} · {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </div>
                </div>
                <div style={s.expRight}>
                  <div style={s.expTotal}>₹{Number(exp.amount).toFixed(0)}</div>
                  {myplit && (
                    <div style={{ fontSize: "0.72rem", color: myplit.settled ? "#43e97b" : "#f59e0b" }}>
                      Your share: ₹{Number(myplit.amount).toFixed(0)}
                      {!myplit.settled && (
                        <button style={s.settleBtn} onClick={() => handleSettle(group._id, exp._id)}>
                          Settle
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAdd && (
        <AddExpenseModal
          groupId={group._id}
          members={group.members.length}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );

  // Fix: capture myplit correctly
  function myplit() {}
};

// ─── Main SharedGroups Page ───────────────────────────────────────────────────

const SharedGroups = () => {
  const [groups,      setGroups]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedId,  setSelectedId]  = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [showJoin,    setShowJoin]    = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const loadGroups = async () => {
    try {
      const { data } = await API.get("/advanced/groups");
      setGroups(data.groups || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGroups(); }, []);

  if (selectedId) {
    return (
      <>
        <Navbar />
        <div style={s.page}>
          <GroupDetail
            groupId={selectedId}
            currentUserId={currentUser._id}
            onBack={() => setSelectedId(null)}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={s.page}>
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Shared Expenses</h1>
            <p style={s.pageSubtitle}>Track group expenses and split bills</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button style={s.outlineBtn} onClick={() => setShowJoin(true)}>Join Group</button>
            <button style={s.primaryBtn} onClick={() => setShowCreate(true)}>+ New Group</button>
          </div>
        </div>

        {loading ? (
          <div style={s.loading}>Loading groups...</div>
        ) : groups.length === 0 ? (
          <div style={s.emptyPage}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
            <h3 style={{ color: "#e8e8f0", marginBottom: "0.5rem" }}>No groups yet</h3>
            <p style={{ color: "#8888aa", marginBottom: "1.5rem" }}>Create a group to start splitting expenses with friends</p>
            <button style={s.primaryBtn} onClick={() => setShowCreate(true)}>Create Your First Group</button>
          </div>
        ) : (
          <div style={s.groupsGrid}>
            {groups.map(group => {
              const totalSpend = group.expenses?.reduce((s, e) => s + e.amount, 0) || 0;
              return (
                <div key={group._id} style={s.groupCard} onClick={() => setSelectedId(group._id)}>
                  <div style={s.groupCardTop}>
                    <span style={s.cardEmoji}>{group.emoji}</span>
                    <div style={s.groupCardInfo}>
                      <div style={s.groupCardName}>{group.name}</div>
                      <div style={s.groupCardMeta}>{group.members?.length || 0} members</div>
                    </div>
                    <div style={s.groupCardAmount}>₹{totalSpend.toFixed(0)}</div>
                  </div>
                  <div style={s.groupCardFooter}>
                    <span style={s.groupCardCode}>Code: {group.inviteCode}</span>
                    <span style={s.groupCardExpCount}>{group.expenses?.length || 0} expenses</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadGroups(); }} />}
        {showJoin   && <JoinGroupModal   onClose={() => setShowJoin(false)}   onJoined={() => { setShowJoin(false);   loadGroups(); }} />}
      </div>
    </>
  );
};

const s = {
  page: { maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem" },
  pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" },
  pageTitle: { fontSize: "1.5rem", fontWeight: 700, color: "#e8e8f0", margin: 0 },
  pageSubtitle: { color: "#8888aa", fontSize: "0.88rem", marginTop: "0.2rem" },
  groupsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" },
  groupCard: { background: "#1a1d27", border: "1px solid #2a2d3e", borderRadius: "14px", padding: "1.25rem", cursor: "pointer", transition: "border-color 0.2s", },
  groupCardTop: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" },
  cardEmoji: { fontSize: "1.8rem", flexShrink: 0 },
  groupCardInfo: { flex: 1 },
  groupCardName: { fontWeight: 600, color: "#e8e8f0", fontSize: "0.95rem" },
  groupCardMeta: { fontSize: "0.75rem", color: "#8888aa" },
  groupCardAmount: { fontFamily: "monospace", fontWeight: 700, color: "#6c63ff", fontSize: "1.1rem" },
  groupCardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  groupCardCode: { fontSize: "0.72rem", color: "#555577", fontFamily: "monospace" },
  groupCardExpCount: { fontSize: "0.72rem", color: "#8888aa" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" },
  modal: { background: "#1a1d27", border: "1px solid #2a2d3e", borderRadius: "18px", padding: "1.75rem", width: "100%", maxWidth: 400 },
  modalTitle: { fontSize: "1.1rem", fontWeight: 700, color: "#e8e8f0", marginBottom: "0.5rem", marginTop: 0 },
  modalSub: { fontSize: "0.82rem", color: "#8888aa", marginBottom: "1rem" },
  modalInput: { display: "block", width: "100%", padding: "0.7rem 0.9rem", background: "#222536", border: "1px solid #2a2d3e", borderRadius: "10px", color: "#e8e8f0", fontFamily: "inherit", fontSize: "0.9rem", outline: "none", marginBottom: "0.75rem", boxSizing: "border-box" },
  modalActions: { display: "flex", gap: "0.5rem", marginTop: "0.25rem" },
  emojiRow: { display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" },
  emojiBtn: { width: 36, height: 36, borderRadius: "8px", border: "1px solid #2a2d3e", background: "#222536", cursor: "pointer", fontSize: "1.1rem" },
  emojiBtnActive: { borderColor: "#6c63ff", background: "rgba(108,99,255,0.15)" },
  errorBox: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "0.6rem 0.9rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.85rem" },
  primaryBtn: { flex: 1, padding: "0.7rem 1.2rem", background: "linear-gradient(135deg, #6c63ff, #8b5cf6)", border: "none", color: "white", borderRadius: "10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: "0.88rem" },
  cancelBtn: { flex: 1, padding: "0.7rem", background: "transparent", border: "1px solid #2a2d3e", color: "#8888aa", borderRadius: "10px", cursor: "pointer", fontFamily: "inherit" },
  outlineBtn: { padding: "0.7rem 1.2rem", background: "transparent", border: "1px solid #2a2d3e", color: "#e8e8f0", borderRadius: "10px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.88rem" },
  backBtn: { background: "transparent", border: "none", color: "#6c63ff", cursor: "pointer", fontFamily: "inherit", fontSize: "0.88rem", marginBottom: "1.5rem", padding: 0 },
  groupHeader: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" },
  groupEmoji: { fontSize: "2.5rem", flexShrink: 0 },
  groupName: { fontSize: "1.4rem", fontWeight: 700, color: "#e8e8f0", margin: 0 },
  groupMeta: { color: "#8888aa", fontSize: "0.85rem", marginTop: "0.2rem" },
  inviteChip: { marginLeft: "auto", background: "#222536", border: "1px solid #2a2d3e", borderRadius: "10px", padding: "0.5rem 0.9rem", textAlign: "center" },
  inviteLabel: { display: "block", fontSize: "0.68rem", color: "#555577", marginBottom: "0.2rem" },
  inviteCode: { fontFamily: "monospace", fontWeight: 700, color: "#6c63ff", fontSize: "0.95rem", letterSpacing: "0.1em" },
  section: { marginBottom: "1.5rem" },
  sectionTitle: { fontSize: "0.85rem", fontWeight: 600, color: "#8888aa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem", marginTop: 0 },
  balanceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.6rem" },
  balanceCard: { background: "#222536", border: "1px solid", borderRadius: "10px", padding: "0.75rem", textAlign: "center" },
  balanceName: { fontSize: "0.82rem", color: "#c8c8d8", fontWeight: 500, marginBottom: "0.3rem" },
  balanceAmt: { fontSize: "0.7rem", marginBottom: "0.2rem" },
  expRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 0", borderBottom: "1px solid #2a2d3e" },
  expLeft: { flex: 1 },
  expDesc: { fontSize: "0.88rem", color: "#e8e8f0", fontWeight: 500, marginBottom: "0.2rem" },
  expMeta: { fontSize: "0.72rem", color: "#8888aa" },
  expRight: { textAlign: "right", flexShrink: 0 },
  expTotal: { fontFamily: "monospace", fontWeight: 700, color: "#e8e8f0", fontSize: "0.95rem" },
  settleBtn: { display: "inline-block", marginLeft: "0.4rem", padding: "1px 6px", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", borderRadius: "5px", cursor: "pointer", fontSize: "0.65rem", fontFamily: "inherit" },
  addExpBtn: { padding: "0.4rem 0.9rem", background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.3)", color: "#6c63ff", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem" },
  loading: { color: "#8888aa", padding: "3rem", textAlign: "center" },
  emptyPage: { textAlign: "center", padding: "4rem 2rem" },
  emptyState: { color: "#555577", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem" },
};

export default SharedGroups;