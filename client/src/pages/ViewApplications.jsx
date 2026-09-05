import React, { useContext, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import { toast } from "../lib/toast";
import moment from "moment";
import { Loader2 } from "lucide-react";

const ViewApplications = () => {
  const { backendUrl, companyToken, api } = useContext(AppContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResume, setSelectedResume] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`${backendUrl}/api/company/applications`);
      if (data.success) {
        setApplications(data.applications || []);
      } else {
        toast.error(data.message || "Failed to fetch applications");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      setUpdatingStatus(applicationId);
      const { data } = await api.post(`${backendUrl}/api/company/change-status`, { applicationId, status });
      if (data.success) {
        toast.success(`Application ${status.toLowerCase()} successfully`);
        setApplications((prev) =>
          prev.map((app) =>
            app._id === applicationId ? { ...app, status } : app
          )
        );
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const scheduleInterview = async (applicationId) => {
    const scheduledAt = window.prompt("Enter interview datetime (YYYY-MM-DDTHH:mm):");
    if (!scheduledAt) return;
    const modeInput = window.prompt("Interview mode? Type 'virtual' for Google Meet or 'physical' for onsite:", "virtual");
    const mode = modeInput === "physical" ? "physical" : "virtual";
    let location = "";
    if (mode === "physical") {
      location = window.prompt("Enter interview location (leave empty to use company location):", "") || "";
    }
    try {
      const { data } = await api.post(`${backendUrl}/api/company/schedule-interview`, {
        applicationId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes: "Scheduled from dashboard",
        mode,
        location,
      });
      if (data.success) {
        toast.success("Interview scheduled");
        fetchApplications();
      } else {
        toast.error(data.message || "Failed to schedule interview");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to schedule interview");
    }
  };

  const submitFeedback = async (applicationId) => {
    const interviewerName = window.prompt("Interviewer name:");
    if (!interviewerName) return;
    try {
      const payload = {
        applicationId,
        interviewerName,
        satisfaction: 4,
        candidateScore: 4,
        communication: 4,
        technical: 4,
        recommendation: "Yes",
        notes: "Structured feedback submitted from dashboard.",
      };
      const { data } = await api.post(`${backendUrl}/api/company/feedback`, payload);
      if (data.success) {
        toast.success("Feedback submitted");
        fetchApplications();
      } else {
        toast.error(data.message || "Failed to submit feedback");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit feedback");
    }
  };

  useEffect(() => {
    if (companyToken) fetchApplications();
  }, [companyToken]);

  const pending = applications.filter((a) => a.status === "Pending").length;
  const accepted = applications.filter((a) => a.status === "Accepted").length;
  const rejected = applications.filter((a) => a.status === "Rejected").length;

  const filteredApplications = applications.filter((app) => {
    const name = app.userId?.name?.toLowerCase() || "";
    const email = app.userId?.email?.toLowerCase() || "";
    const job = app.jobId?.title?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term) || job.includes(term);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Longlisted":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "Accepted":
      case "Shortlisted":
        return "bg-green-100 text-green-700 border border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-500">Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl min-w-0">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Job Applications</h2>
        <p className="text-sm text-gray-500 mt-0.5">Review and manage candidate applications</p>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search by candidate name, email, or job title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        />
        <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: applications.length, color: "text-gray-900", bg: "bg-gray-50 border-gray-200" },
          { label: "Pending", value: pending, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
          { label: "Accepted", value: accepted, color: "text-green-600", bg: "bg-green-50 border-green-200" },
          { label: "Rejected", value: rejected, color: "text-red-600", bg: "bg-red-50 border-red-200" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`border rounded-xl p-4 shadow-sm ${bg}`}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {applications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📨</div>
            <h3 className="font-semibold text-gray-700 mb-1">No applications yet</h3>
            <p className="text-sm text-gray-500">Applications will appear here once candidates apply.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* ── Mobile card list (< md) ─────────────────────────────── */}
            <ul className="md:hidden divide-y divide-gray-100">
              {applications.map((application, index) => (
                <li key={application._id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={application.userId?.image || assets.profile_img}
                      alt={application.userId?.name || "User"}
                      className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
                      onError={(e) => { e.target.src = assets.profile_img; }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{application.userId?.name || "Unknown User"}</p>
                      <p className="text-xs text-gray-400 truncate">{application.userId?.email}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${getStatusBadge(application.status)}`}>
                      {application.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p><span className="font-medium">Job:</span> {application.jobId?.title || "N/A"}</p>
                    <p><span className="font-medium">Applied:</span> {moment(application.date).format("MMM D, YYYY")}</p>
                    {(application.timeline || []).slice(-1).map((event, idx) => (
                      <p key={idx} className="text-gray-400">{event.stage}: {event.note}</p>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {application.userId?.resume && (
                      <a
                        href={application.userId.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 text-xs font-medium border border-blue-200 bg-blue-50 px-2.5 py-1.5 rounded-lg"
                      >
                        Download
                        <img src={assets.resume_download_icon} alt="" className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {application.userId?.resume && (
                        <button
                            onClick={() => setSelectedResume(application.userId.resume)}
                            className="text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-lg"
                        >
                            Preview
                        </button>
                    )}
                    {updatingStatus === application._id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : application.status !== "Shortlisted" ? (
                      <>
                        <button
                          onClick={() => updateApplicationStatus(application._id, "Longlisted")}
                          className="text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg"
                        >Longlist</button>
                        <button
                          onClick={() => updateApplicationStatus(application._id, "Shortlisted")}
                          className="text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-1.5 rounded-lg"
                        >Shortlist</button>
                        <button
                          onClick={() => updateApplicationStatus(application._id, "Rejected")}
                          className="text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg"
                        >Reject</button>
                      </>
                    ) : null}
                    <button
                      onClick={() => scheduleInterview(application._id)}
                      className="text-xs text-indigo-700 border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 rounded-lg"
                    >Schedule</button>
                    <button
                      onClick={() => submitFeedback(application._id)}
                      className="text-xs text-purple-700 border border-purple-200 bg-purple-50 px-2.5 py-1.5 rounded-lg"
                    >Feedback</button>
                  </div>
                </li>
              ))}
            </ul>

            {/* ── Desktop table (≥ md) ────────────────────────────────── */}
            <table className="w-full text-sm hidden md:table">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Applicant</th>
                  <th className="px-5 py-3 text-left">Job Title</th>
                  <th className="px-5 py-3 text-left">Applied</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Resume</th>
                  <th className="px-5 py-3 text-left">Action</th>
                  <th className="px-5 py-3 text-left">Interview</th>
                  <th className="px-5 py-3 text-left">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplications.map((application, index) => (
                  <tr key={application._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400 text-xs">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={application.userId?.image || assets.profile_img}
                          alt={application.userId?.name || "User"}
                          className="w-9 h-9 rounded-full object-cover border border-gray-100"
                          onError={(e) => { e.target.src = assets.profile_img; }}
                        />
                        <div>
                          <p className="font-medium text-gray-800">
                            {application.userId?.name || "Unknown User"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {application.userId?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-gray-700 font-medium">
                        {application.jobId?.title || "N/A"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {moment(application.date).format("MMM D, YYYY")}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusBadge(application.status)}`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {application.userId?.resume ? (
                        <div className="flex flex-col gap-1.5">
                            <button
                                onClick={() => setSelectedResume(application.userId.resume)}
                                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors uppercase tracking-tight"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Preview
                            </button>
                            <a
                                href={application.userId.resume}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-[10px] font-medium transition-colors"
                            >
                                Download PDF
                                <img src={assets.resume_download_icon} alt="Download" className="w-3 h-3 opacity-50" />
                            </a>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">None</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {updatingStatus === application._id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : application.status === "Shortlisted" ? (
                        <span className="text-xs text-green-600 font-semibold">Final shortlist</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => updateApplicationStatus(application._id, "Longlisted")}
                            className="text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Longlist
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application._id, "Shortlisted")}
                            className="text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application._id, "Rejected")}
                            className="text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => scheduleInterview(application._id)}
                          className="text-xs text-indigo-700 border border-indigo-200 bg-indigo-50 px-2 py-1 rounded"
                        >
                          Schedule
                        </button>
                        <button
                          onClick={() => submitFeedback(application._id)}
                          className="text-xs text-purple-700 border border-purple-200 bg-purple-50 px-2 py-1 rounded"
                        >
                          Feedback
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-65">
                      <div className="text-xs text-gray-500 space-y-1">
                        {(application.timeline || []).slice(-2).map((event, idx) => (
                          <p key={idx}>
                            {event.stage}: {event.note}
                          </p>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resume Preview Modal */}
      {selectedResume && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Resume Preview
                    </h3>
                    <div className="flex items-center gap-3">
                        <a 
                            href={selectedResume} 
                            target="_blank" 
                            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            Open in New Tab
                        </a>
                        <button 
                            onClick={() => setSelectedResume(null)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-gray-50 p-2">
                    <iframe 
                        src={`${selectedResume}#toolbar=0`} 
                        className="w-full h-full rounded-xl border-none"
                        title="Resume Preview"
                    />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ViewApplications;
