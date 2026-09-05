import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "../lib/toast";

const ROLES = [
  { value: "support_agent", label: "Support Agent", color: "bg-gray-100 text-gray-600" },
  { value: "finance_viewer", label: "Finance Viewer", color: "bg-blue-100 text-blue-600" },
  { value: "finance_admin", label: "Finance Admin", color: "bg-purple-100 text-purple-600" },
  { value: "admin", label: "Company Admin", color: "bg-amber-100 text-amber-700" },
];

const roleMap = Object.fromEntries(ROLES.map(r => [r.value, r]));

export default function TeamManagementDashboard() {
  const { backendUrl, api } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("finance_viewer");
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null); // userId

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        api.get(`${backendUrl}/api/team/members`),
        api.get(`${backendUrl}/api/team/invites`),
      ]);
      setMembers(membersRes.data.members || []);
      setInvites(invitesRes.data.invites || []);
    } catch (err) {
      console.error("TeamManagement fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeam(); }, [backendUrl, api]);

  const inviteMember = async () => {
    if (!email || !email.includes("@")) return toast.error("Please enter a valid email address.");
    setInviting(true);
    try {
      const { data } = await api.post(`${backendUrl}/api/team/invite`, { email, role });
      if (data.success) {
        toast.success(`Invite sent to ${email}`);
        setEmail("");
        await fetchTeam();
      } else {
        toast.error(data.message || "Failed to send invite");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const updateRole = async (userId, nextRole) => {
    try {
      const { data } = await api.patch(`${backendUrl}/api/team/members/${userId}/role`, { role: nextRole });
      if (data.success) {
        toast.success("Role updated successfully");
        setMembers(prev => prev.map(m => m._id === userId ? { ...m, role: nextRole } : m));
      } else {
        toast.error(data.message || "Failed to update role");
      }
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  const removeMember = async (userId) => {
    try {
      const { data } = await api.patch(`${backendUrl}/api/team/members/${userId}/remove`);
      if (data.success) {
        toast.success("Member removed from team");
        setMembers(prev => prev.filter(m => m._id !== userId));
      } else {
        toast.error(data.message || "Failed to remove member");
      }
    } catch (err) {
      toast.error("Failed to remove member");
    } finally {
      setConfirmRemove(null);
    }
  };

  const cancelInvite = async (inviteId) => {
    try {
      const { data } = await api.delete(`${backendUrl}/api/team/invites/${inviteId}`);
      if (data.success) {
        toast.success("Invite cancelled");
        setInvites(prev => prev.filter(i => i._id !== inviteId));
      } else {
        toast.error(data.message || "Failed to cancel invite");
      }
    } catch (err) {
      toast.error("Failed to cancel invite");
    }
  };

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-w-0 p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">People & Access</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">Team Management</h1>
            <p className="text-gray-500 text-sm mt-1">Invite teammates, assign roles, and manage access permissions.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs font-bold text-gray-400 uppercase">Active Members</p>
              <p className="text-2xl font-black text-gray-900">{members.length}</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-center">
              <p className="text-xs font-bold text-gray-400 uppercase">Pending Invites</p>
              <p className="text-2xl font-black text-amber-600">{invites.filter(i => i.status === "pending").length}</p>
            </div>
          </div>
        </div>

        {/* Invite Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Invite a teammate</h2>
          <p className="text-sm text-gray-500 mb-5">Send a role-based invitation to collaborate on this workspace.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_160px]">
            <div className="relative">
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && inviteMember()}
                placeholder="colleague@company.com"
                type="email"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white cursor-pointer appearance-none"
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <button
              onClick={inviteMember}
              disabled={inviting || !email}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {inviting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Sending...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> Send Invite</>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members Table */}
          <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Active Members</h2>
              <div className="mt-3 relative">
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-10 text-center text-gray-400">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : filteredMembers.length > 0 ? (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-3 text-left">Member</th>
                      <th className="px-6 py-3 text-left">Role</th>
                      <th className="px-6 py-3 text-left">Joined</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredMembers.map(m => {
                      const roleInfo = roleMap[m.role] || { label: m.role, color: "bg-gray-100 text-gray-600" };
                      return (
                        <tr key={m._id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {m.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{m.name}</p>
                                <p className="text-xs text-gray-400">{m.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={m.role}
                              onChange={e => updateRole(m._id, e.target.value)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-500/20 outline-none ${roleInfo.color}`}
                            >
                              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setConfirmRemove(m._id)}
                              className="text-xs text-red-500 hover:text-red-700 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-10 text-center text-gray-400 italic px-6">
                  {searchTerm ? "No members match your search." : "No active team members."}
                </div>
              )}
            </div>
          </section>

          {/* Pending Invites */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Invites</h2>
            <div className="space-y-3">
              {invites.filter(i => i.status === "pending").map(i => {
                const roleInfo = roleMap[i.role] || { label: i.role, color: "bg-gray-100 text-gray-600" };
                return (
                  <div key={i._id} className="p-4 border border-gray-100 rounded-2xl hover:border-gray-200 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{i.email}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${roleInfo.color}`}>{roleInfo.label}</span>
                      </div>
                      <button
                        onClick={() => cancelInvite(i._id)}
                        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                        title="Cancel invite"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Sent {i.createdAt ? new Date(i.createdAt).toLocaleDateString() : "recently"}</p>
                  </div>
                );
              })}
              {invites.filter(i => i.status === "pending").length === 0 && (
                <div className="py-8 text-center text-gray-400 italic text-sm">No pending invites.</div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Confirm Remove Modal */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Remove Member?</h3>
            <p className="text-sm text-gray-500 mt-2">This action will revoke their access immediately. You can re-invite them later.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmRemove(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => removeMember(confirmRemove)} className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-200">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
