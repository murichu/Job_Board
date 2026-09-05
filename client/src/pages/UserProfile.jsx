import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "../lib/toast";

const UserProfile = () => {
  const { userData, backendUrl, api, fetchUserData } = useContext(AppContext);
  const [name, setName] = useState(userData?.name || "");
  const [image, setImage] = useState(null);
  const [resume, setResume] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingResume, setSavingResume] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [resumePreviewUrl, setResumePreviewUrl] = useState(null);
  const [resumeFilePreviewUrl, setResumeFilePreviewUrl] = useState(null);

  useEffect(() => {
    if (userData) {
      setName(userData.name);
      fetchCompleteness();
      if (userData.resume) {
        fetchResumeUrl();
      }
    }
  }, [userData]);

  const fetchCompleteness = async () => {
    try {
      const { data } = await api.get(`${backendUrl}/api/user/profile-completeness`);
      if (data.success) {
        setCompleteness(data.completeness);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchResumeUrl = async () => {
    try {
      const { data } = await api.get(`${backendUrl}/api/user/resume/signed-url`);
      if (data.success) {
        setResumeUrl(`${backendUrl}${data.url}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const formData = new FormData();
      formData.append("name", name);
      if (image) formData.append("image", image);
      const { data } = await api.post(`${backendUrl}/api/user/update-profile`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        toast.success("Profile updated");
        setImage(null);
        await fetchUserData();
        fetchCompleteness();
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const onSaveResume = async () => {
    if (!resume) {
      toast.error("Please select a resume file first");
      return;
    }
    try {
      setSavingResume(true);
      const formData = new FormData();
      formData.append("resume", resume);
      const { data } = await api.post(`${backendUrl}/api/user/update-resume`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        toast.success("Resume updated");
        setResume(null);
        if (resumeFilePreviewUrl) {
          URL.revokeObjectURL(resumeFilePreviewUrl);
          setResumeFilePreviewUrl(null);
        }
        setResumePreviewUrl(null);
        await fetchUserData();
        fetchCompleteness();
        fetchResumeUrl();
      } else {
        toast.error(data.message || "Resume upload failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Resume upload failed");
    } finally {
      setSavingResume(false);
    }
  };

  const handleResumeSelection = (file) => {
    if (!file) {
      setResume(null);
      setResumePreviewUrl(null);
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF resume file");
      setResume(null);
      setResumePreviewUrl(null);
      return;
    }

    if (resumeFilePreviewUrl) {
      URL.revokeObjectURL(resumeFilePreviewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setResume(file);
    setResumeFilePreviewUrl(nextPreviewUrl);
    setResumePreviewUrl(nextPreviewUrl);
  };

  const closeResumePreview = () => {
    if (resumePreviewUrl && resumePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(resumePreviewUrl);
      setResumeFilePreviewUrl(null);
    }
    setResumePreviewUrl(null);
  };

  useEffect(() => {
    return () => {
      if (resumeFilePreviewUrl) {
        URL.revokeObjectURL(resumeFilePreviewUrl);
      }
    };
  }, [resumeFilePreviewUrl]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="grow container mx-auto px-4 sm:px-6 py-6 sm:py-12 max-w-6xl">
        {/* Header Section */}
        <div className="mb-6 sm:mb-10 text-center md:text-left">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Candidate Profile</h1>
          <p className="text-base sm:text-lg text-gray-500 mt-2">Manage your personal information and resume</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Summary & Completeness */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:shadow-md">
              <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-r from-blue-500 to-indigo-600"></div>
              
              <div className="relative z-10 w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white mb-4">
                <img 
                  src={image ? URL.createObjectURL(image) : userData?.image || "https://ui-avatars.com/api/?name=User"} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800">{userData?.name || "Candidate"}</h2>
              <p className="text-gray-500 font-medium">{userData?.email}</p>
              
              <div className="mt-4 px-4 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full border border-blue-100">
                {userData?.role?.toUpperCase() || "USER"}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-300 hover:shadow-md">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Profile Completeness</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{completeness}% Complete</span>
                {completeness === 100 && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">All Set!</span>}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-linear-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${completeness}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                A complete profile increases your chances of getting noticed by recruiters.
              </p>
            </div>
          </div>

          {/* Right Column: Forms */}
          <div className="w-full lg:w-2/3 space-y-6">
            {/* Personal Details Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition-all duration-300 hover:shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Personal Details</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <div className="flex items-center gap-2 w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed select-none">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <span className="text-sm font-medium truncate">{userData?.email || "—"}</span>
                    <span className="ml-auto text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">Read only</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact support if needed.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Image</label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl px-6 py-8 text-center hover:border-blue-500 transition-colors duration-300 cursor-pointer bg-gray-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center">
                      <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span className="text-sm text-gray-600 font-medium">
                        {image ? image.name : "Click or drag to upload a new avatar"}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">JPG, PNG up to 2MB</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    disabled={savingProfile}
                    onClick={onSaveProfile}
                    className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>

            {/* Resume Upload Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition-all duration-300 hover:shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Resume Management</h3>
              
              <div className="space-y-5">
                {resumeUrl ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <svg className="w-8 h-8 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-green-800">Resume Uploaded</p>
                        <button
                          type="button"
                          onClick={() => setResumePreviewUrl(resumeUrl)}
                          className="text-xs text-green-600 hover:underline font-medium text-left"
                        >
                          Preview Current Resume
                        </button>
                      </div>
                    </div>
                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-green-700 hover:text-green-900 transition-colors">
                      Open
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center p-4 bg-orange-50 border border-orange-100 rounded-xl">
                    <svg className="w-6 h-6 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <p className="text-sm text-orange-800 font-medium">No resume uploaded yet. This will affect your job applications.</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Upload New Resume (PDF)</label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl px-6 py-6 text-center hover:border-indigo-500 transition-colors duration-300 cursor-pointer bg-gray-50">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleResumeSelection(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center">
                      <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      <span className="text-sm text-gray-600 font-medium">
                        {resume ? resume.name : "Select a PDF resume"}
                      </span>
                      {resume && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setResumePreviewUrl(resumeFilePreviewUrl || resumeUrl);
                          }}
                          className="mt-3 inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          Preview Selected Resume
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    disabled={savingResume || !resume}
                    onClick={onSaveResume}
                    className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingResume ? "Uploading..." : "Upload Resume"}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {resumePreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm">
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
                  href={resumePreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Open in New Tab
                </a>
                <button
                  type="button"
                  onClick={closeResumePreview}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  aria-label="Close preview"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-50 p-2">
              <iframe
                src={`${resumePreviewUrl}#toolbar=0`}
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

export default UserProfile;
