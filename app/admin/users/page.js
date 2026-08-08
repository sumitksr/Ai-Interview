"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ROLE_COLORS = {
  user: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
  admin: "text-red-400 bg-red-500/10 border-red-500/25",
  teacher: "text-purple-400 bg-purple-500/10 border-purple-500/25",
};

function Avatar({ name, image, size = 9 }) {
  const COLORS = [["#d32f2f","#ef9a9a"],["#1565c0","#90caf9"],["#2e7d32","#a5d6a7"],["#6a1b9a","#ce93d8"],["#00695c","#80cbc4"]];
  const idx = name ? name.charCodeAt(0) % COLORS.length : 0;
  const [bg, text] = COLORS[idx];
  if (image) return <img src={image} alt={name} referrerPolicy="no-referrer" className={`w-${size} h-${size} rounded-full object-cover ring-2 ring-[var(--border)] flex-shrink-0`} />;
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-sm font-black flex-shrink-0`} style={{ background: bg, color: text }}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

/** Inline toast component */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const styles = {
    success: "bg-green-500/10 border-green-500/30 text-green-400",
    error: "bg-red-500/10 border-red-500/30 text-red-400",
    info: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
  };
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-md text-sm font-semibold animate-fade-in-up ${styles[toast.type]}`}>
      <span>{toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}</span>
      <span>{toast.message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">✕</button>
    </div>
  );
}

/** Confirm dialog */
function ConfirmDialog({ dialog, onConfirm, onCancel, loading }) {
  if (!dialog) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-[var(--border)] p-6 shadow-2xl"
        style={{ background: "var(--surface)" }}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dialog.type === "danger" ? "bg-red-500/15" : "bg-orange-500/15"}`}>
          {dialog.type === "danger" ? (
            <svg width="22" height="22" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          ) : (
            <svg width="22" height="22" fill="none" stroke="#f59e0b" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18.364 5.636a9 9 0 1 1-12.728 0"/><line x1="12" y1="2" x2="12" y2="12"/>
            </svg>
          )}
        </div>
        <h3 className="text-center font-black text-[var(--foreground)] text-lg mb-2">{dialog.title}</h3>
        <p className="text-center text-sm text-[var(--muted)] mb-6 leading-relaxed">{dialog.description}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[var(--muted)] bg-[var(--surface-2)] border border-[var(--border)] hover:text-[var(--foreground)] transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 ${dialog.type === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"}`}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Working…
              </span>
            ) : dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [changingRole, setChangingRole] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // userId|action
  const [dialog, setDialog] = useState(null); // { title, description, confirmLabel, type, onConfirm }
  const [dialogLoading, setDialogLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch("/api/v1/admin/users")
      .then((r) => { if (r.status === 403 || r.status === 401) { router.replace("/dashboard"); throw new Error("forbidden"); } return r.json(); })
      .then((d) => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function changeRole(userId, newRole) {
    setChangingRole(userId);
    const res = await fetch("/api/v1/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u._id.toString() === userId ? { ...u, role: newRole } : u));
      showToast("success", "Role updated successfully.");
    } else {
      showToast("error", "Failed to update role.");
    }
    setChangingRole(null);
  }

  function confirmChangeRole(user, newRole) {
    if (user.role === newRole) return; // no-op if same
    const ROLE_LABELS = { user: "Student", teacher: "Teacher", admin: "Admin" };
    setDialog({
      title: "Change Role",
      description: `Change ${user.name}'s role from "${ROLE_LABELS[user.role] ?? user.role}" to "${ROLE_LABELS[newRole] ?? newRole}"? This affects what they can access on the platform.`,
      confirmLabel: `Set as ${ROLE_LABELS[newRole] ?? newRole}`,
      type: "warning",
      onConfirm: async () => {
        setDialogLoading(true);
        await changeRole(user._id.toString(), newRole);
        setDialogLoading(false);
        setDialog(null);
      },
    });
  }

  function confirmTerminateSession(user) {
    setDialog({
      title: "Terminate Session",
      description: `This will clear ${user.name}'s refresh token. Their current access token expires naturally (within 1 day), but they will be forced to log in again after that.`,
      confirmLabel: "Terminate Session",
      type: "warning",
      onConfirm: async () => {
        setDialogLoading(true);
        const res = await fetch(`/api/v1/admin/users?action=terminate-session`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id.toString() }),
        });
        const data = await res.json();
        setDialogLoading(false);
        setDialog(null);
        if (res.ok) showToast("success", data.message);
        else showToast("error", data.error || "Failed to terminate session.");
      },
    });
  }

  function confirmTerminateUser(user) {
    setDialog({
      title: "Delete User",
      description: `Are you sure you want to permanently delete "${user.name}" (${user.email})? This action cannot be undone.`,
      confirmLabel: "Delete User",
      type: "danger",
      onConfirm: async () => {
        setDialogLoading(true);
        const res = await fetch(`/api/v1/admin/users?action=terminate-user`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id.toString() }),
        });
        const data = await res.json();
        setDialogLoading(false);
        setDialog(null);
        if (res.ok) {
          setUsers((prev) => prev.filter((u) => u._id.toString() !== user._id.toString()));
          setExpanded(null);
          showToast("success", data.message);
        } else {
          showToast("error", data.error || "Failed to delete user.");
        }
      },
    });
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-14 w-14 border-4 border-[var(--surface-2)] border-t-red-500" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight">Users</h1>
        <p className="text-[var(--muted)] mt-1">All platform users — view performance, manage roles, and control sessions.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-red-500/50" />
        </div>
        <div className="flex gap-1.5">
          {["all", "user", "teacher", "admin"].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${roleFilter === r ? "text-white" : "text-[var(--muted)] bg-[var(--surface-2)] border border-[var(--border)] hover:text-[var(--foreground)]"}`}
              style={roleFilter === r ? { background: "linear-gradient(135deg, #ef4444, #dc2626)" } : {}}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 text-sm text-[var(--muted)]">
        <span><strong className="text-[var(--foreground)]">{filtered.length}</strong> shown</span>
        <span><strong className="text-cyan-400">{users.filter(u => u.role === "user").length}</strong> students</span>
        <span><strong className="text-purple-400">{users.filter(u => u.role === "teacher").length}</strong> teachers</span>
        <span><strong className="text-red-400">{users.filter(u => u.role === "admin").length}</strong> admins</span>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)]/60 backdrop-blur-md border border-[var(--border)] rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/50">
                {["User", "Role", "Provider", "Interviews", "Avg Score", "Joined", "Change Role"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isExpanded = expanded === u._id.toString();
                return (
                  <React.Fragment key={u._id}>
                    <tr className={`border-b border-[var(--border)]/50 hover:bg-[var(--surface-2)]/30 transition-colors cursor-pointer ${isExpanded ? "bg-[var(--surface-2)]/20" : ""}`}
                      onClick={() => setExpanded(isExpanded ? null : u._id.toString())}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} image={u.image} size={9} />
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--foreground)] truncate max-w-[160px]">{u.name}</p>
                            <p className="text-xs text-[var(--muted)] truncate max-w-[160px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)] text-xs">{u.provider}</td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-[var(--cyan)]">{u.interviewsTaken}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-bold ${u.averageScore >= 70 ? "text-green-400" : u.averageScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                          {u.averageScore > 0 ? `${u.averageScore}%` : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)] text-xs whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={u.role}
                          disabled={changingRole === u._id.toString()}
                          onChange={(e) => confirmChangeRole(u, e.target.value)}
                          className="text-xs rounded-lg px-2 py-1.5 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-red-500/50 disabled:opacity-50 cursor-pointer"
                        >
                          <option value="user">user</option>
                          <option value="teacher">teacher</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[var(--surface-2)]/10">
                        <td colSpan={7} className="px-5 pb-5 pt-2">
                          <div className="pt-3 border-t border-[var(--border)]/50 space-y-4">
                            {/* Admin Actions */}
                            <div>
                              <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Admin Actions</p>
                              <div className="flex flex-wrap gap-3">
                                {/* Terminate Session */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); confirmTerminateSession(u); }}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:-translate-y-0.5"
                                  style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.25)", color: "#f59e0b" }}
                                >
                                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path d="M18.364 5.636a9 9 0 1 1-12.728 0"/><line x1="12" y1="2" x2="12" y2="12"/>
                                  </svg>
                                  Terminate Session
                                </button>

                                {/* Delete User */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); confirmTerminateUser(u); }}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:-translate-y-0.5"
                                  style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#ef4444" }}
                                >
                                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6"/><path d="M14 11v6"/>
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                  </svg>
                                  Delete User
                                </button>
                              </div>
                              <p className="text-[10px] text-[var(--muted)] mt-2">
                                <strong>Terminate Session</strong> clears the refresh token — user is forced to re-login after their current session expires. &nbsp;
                                <strong>Delete User</strong> permanently removes the account.
                              </p>
                            </div>

                            {/* Interview History */}
                            <div>
                              <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Interview History ({u.interviewHistory?.length || 0} sessions)</p>
                              {u.interviewHistory?.length > 0 ? (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {u.interviewHistory.slice(0, 6).map((h, i) => (
                                    <div key={i} className="bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--border)]">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-bold text-[var(--foreground)] truncate">{h.targetRole || "Interview"}</p>
                                        <span className={`text-sm font-black ${(h.score||0) >= 70 ? "text-green-400" : (h.score||0) >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                                          {h.score || 0}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-[var(--muted)]">{new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                                      {h.hiringRecommendation && <p className="text-[10px] text-[var(--cyan)] mt-1 truncate">{h.hiringRecommendation}</p>}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-[var(--muted)]">No interviews taken yet.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center text-[var(--muted)] text-sm">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        dialog={dialog}
        loading={dialogLoading}
        onConfirm={() => dialog?.onConfirm()}
        onCancel={() => !dialogLoading && setDialog(null)}
      />

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
