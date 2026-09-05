import { useContext, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { toast } from "../lib/toast";
import { assets } from "../assets/assets";

const menuItems = [
  { label: "Add Job", icon: assets.add_icon, path: "/dashboard/add-job" },
  { label: "Manage Jobs", icon: assets.home_icon, path: "/dashboard/manage-jobs" },
  { label: "Applications", icon: assets.person_tick_icon, path: "/dashboard/view-applications" },
  { label: "Reports", icon: assets.resume_download_icon, path: "/dashboard/reports" },
  { label: "Company Profile", icon: assets.company_icon, path: "/company-profile" },
];

const inputClass =
  "w-full min-w-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white shadow-inner-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-shadow";

const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5";

const CompanyProfile = () => {
  const navigate = useNavigate();
  const { companyData, backendUrl, api, fetchCompanyData, logoutCompany } = useContext(AppContext);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const [form, setForm] = useState({
    recruiterName: "",
    recruiterPosition: "",
    companyPhone: "",
    companyLocation: "",
    website: "",
    about: "",
    culture: "",
    benefits: "",
    teamHighlights: "",
  });
  const [image, setImage] = useState(null);
  const [imageObjectUrl, setImageObjectUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (!companyData) return;
    setForm({
      recruiterName: companyData.recruiterName || "",
      recruiterPosition: companyData.recruiterPosition || "",
      companyPhone: companyData.companyPhone || "",
      companyLocation: companyData.companyLocation || "",
      website: companyData.website || "",
      about: companyData.about || "",
      culture: companyData.culture || "",
      benefits: Array.isArray(companyData.benefits) ? companyData.benefits.join(", ") : "",
      teamHighlights: Array.isArray(companyData.teamHighlights) ? companyData.teamHighlights.join(", ") : "",
    });
  }, [companyData]);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    if (!image) {
      setImageObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImageObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const logoSrc = imageObjectUrl || companyData?.image || assets.company_icon;

  const handleLogout = () => {
    logoutCompany();
    navigate("/");
  };

  const onSave = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (image) formData.append("image", image);
      const { data } = await api.post(`${backendUrl}/api/company/update-profile`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        toast.success("Company profile updated");
        setImage(null);
        fetchCompanyData();
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
        <div className="px-3 sm:px-5 flex justify-between items-center gap-2 min-w-0 h-14 sm:h-16">
          <img
            onClick={() => navigate("/")}
            className="max-sm:w-28 cursor-pointer hover:opacity-80 transition-opacity h-8"
            src={assets.logo}
            alt="JobBoard Logo"
          />

          {companyData && (
            <div className="flex items-center gap-3" ref={accountMenuRef}>
              <span className="text-sm text-gray-600 max-sm:hidden">
                <span className="text-gray-400">Welcome, </span>
                <span className="font-semibold text-gray-800">{companyData.name}</span>
              </span>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((o) => !o)}
                  aria-expanded={accountMenuOpen}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full pl-1 pr-3 py-1 transition-colors"
                  aria-label="Account menu"
                >
                  <img
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    src={companyData.image || assets.company_icon}
                    alt={companyData.name}
                    onError={(e) => { e.target.src = assets.company_icon; }}
                  />
                  <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {accountMenuOpen && (
                  <div className="fixed sm:absolute z-50 left-3 right-3 top-[calc(3.5rem+env(safe-area-inset-top))] sm:inset-auto sm:right-0 sm:top-11 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 min-w-40 max-h-[70vh] overflow-y-auto overscroll-contain">
                    <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{companyData.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        navigate("/");
                      }}
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      View Job Board
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex">
        {companyData && (
          <aside className="w-56 max-md:w-14 min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)] bg-white border-r border-gray-200 sticky top-[calc(3.5rem+env(safe-area-inset-top))] sm:top-[calc(4rem+env(safe-area-inset-top))] self-start shrink-0 transition-all duration-200">
            <nav className="py-4" aria-label="Dashboard navigation">
              <ul className="space-y-1 px-2">
                {menuItems.map(({ label, icon, path }) => (
                  <NavLink
                    key={path}
                    to={path}
                    title={label}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`
                    }
                  >
                    <img className="w-5 h-5 shrink-0" src={icon} alt="" aria-hidden="true" />
                    <span className="max-md:hidden">{label}</span>
                  </NavLink>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        <main className="flex-1 min-w-0">
          <div className="container px-3 sm:px-4 2xl:px-20 mx-auto py-4 sm:py-8 pb-10 sm:pb-12 min-w-0 max-w-full">
            <header className="mb-6 sm:mb-8">
              <div className="bg-linear-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl sm:rounded-2xl px-4 sm:px-8 py-6 sm:py-10 shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 min-w-0">
                  <div className="flex justify-center sm:justify-start shrink-0">
                    <img
                      src={logoSrc}
                      alt={companyData?.name ? `${companyData.name} logo` : "Company logo preview"}
                      className="w-24 h-24 sm:w-28 sm:h-28 max-w-full rounded-xl bg-white object-contain border border-gray-200 p-3 shadow-sm"
                      onError={(e) => {
                        e.target.src = assets.company_icon;
                      }}
                    />
                  </div>
                  <div className="text-center sm:text-left min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">
                      Recruiter dashboard
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2 wrap-break-word">
                      Company profile
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto sm:mx-0">
                      Update how candidates see your organization on job listings — logo, story, and contact details.
                    </p>
                    {companyData?.name && (
                      <p className="mt-3 text-sm font-medium text-gray-800 wrap-break-word">
                        {companyData.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto min-w-0">
              <section className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-5 sm:p-7 shadow-card">
                <h2 className="font-bold text-lg text-gray-900 mb-1 flex items-center gap-2 min-w-0">
                  <span className="w-1 h-5 bg-blue-500 rounded-full shrink-0" />
                  <span className="wrap-break-word">Company logo</span>
                </h2>
                <p className="text-sm text-gray-500 mb-5 ml-3 sm:ml-4">
                  Square or wide logos work best. PNG or JPG, shown on your job posts.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                  <label className="inline-flex w-full sm:flex-1 min-w-0">
                    <span className="sr-only">Upload logo image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files?.[0] || null)}
                      className="block w-full min-w-0 text-sm text-gray-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-700 file:cursor-pointer cursor-pointer"
                    />
                  </label>
                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 underline underline-offset-2 self-start sm:self-center shrink-0"
                    >
                      Remove new upload
                    </button>
                  )}
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-5 sm:p-7 shadow-card">
                <h2 className="font-bold text-lg text-gray-900 mb-5 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded-full shrink-0" />
                  Contact &amp; recruiter
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 min-w-0">
                  <div className="min-w-0">
                    <label htmlFor="cp-recruiter-name" className={labelClass}>Recruiter name</label>
                    <input id="cp-recruiter-name" className={inputClass} placeholder="Jane Doe" value={form.recruiterName} onChange={(e) => setForm((p) => ({ ...p, recruiterName: e.target.value }))} />
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="cp-recruiter-role" className={labelClass}>Recruiter position</label>
                    <input id="cp-recruiter-role" className={inputClass} placeholder="Talent Acquisition Lead" value={form.recruiterPosition} onChange={(e) => setForm((p) => ({ ...p, recruiterPosition: e.target.value }))} />
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="cp-phone" className={labelClass}>Company phone</label>
                    <input id="cp-phone" className={inputClass} placeholder="+254 …" value={form.companyPhone} onChange={(e) => setForm((p) => ({ ...p, companyPhone: e.target.value }))} />
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="cp-location" className={labelClass}>Company location</label>
                    <input id="cp-location" className={inputClass} placeholder="City, Country" value={form.companyLocation} onChange={(e) => setForm((p) => ({ ...p, companyLocation: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2 min-w-0">
                    <label htmlFor="cp-website" className={labelClass}>Website</label>
                    <input id="cp-website" type="url" className={inputClass} placeholder="https://example.com" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />
                  </div>
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-5 sm:p-7 shadow-card">
                <h2 className="font-bold text-lg text-gray-900 mb-5 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded-full shrink-0" />
                  Company story
                </h2>
                <div className="space-y-5 min-w-0">
                  <div className="min-w-0">
                    <label htmlFor="cp-about" className={labelClass}>About</label>
                    <textarea id="cp-about" className={`${inputClass} resize-y min-h-25`} rows={4} placeholder="What does your company do? Mission and highlights for candidates." value={form.about} onChange={(e) => setForm((p) => ({ ...p, about: e.target.value }))} />
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="cp-culture" className={labelClass}>Culture</label>
                    <textarea id="cp-culture" className={`${inputClass} resize-y min-h-22`} rows={3} placeholder="How your team works — values, ways of working, environment." value={form.culture} onChange={(e) => setForm((p) => ({ ...p, culture: e.target.value }))} />
                  </div>
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-5 sm:p-7 shadow-card">
                <h2 className="font-bold text-lg text-gray-900 mb-5 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded-full shrink-0" />
                  Benefits &amp; team
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 min-w-0">
                  <div className="min-w-0 sm:col-span-2">
                    <label htmlFor="cp-benefits" className={labelClass}>Benefits</label>
                    <input id="cp-benefits" className={inputClass} placeholder="Health insurance, remote days, learning budget…" value={form.benefits} onChange={(e) => setForm((p) => ({ ...p, benefits: e.target.value }))} />
                    <p className="mt-1.5 text-xs text-gray-500">Separate items with commas.</p>
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <label htmlFor="cp-team" className={labelClass}>Team highlights</label>
                    <input id="cp-team" className={inputClass} placeholder="Team size, notable projects, tech stack…" value={form.teamHighlights} onChange={(e) => setForm((p) => ({ ...p, teamHighlights: e.target.value }))} />
                    <p className="mt-1.5 text-xs text-gray-500">Separate items with commas.</p>
                  </div>
                </div>
              </section>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 pb-4 min-w-0">
                <p className="text-xs text-gray-500 text-center sm:text-left">
                  Changes apply to how your company appears on published jobs after you save.
                </p>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="w-full sm:w-auto shrink-0 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-button transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    "Save company profile"
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompanyProfile;
