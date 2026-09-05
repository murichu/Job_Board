import React, { useContext, useState, useRef, useEffect } from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const Navbar = () => {
  const navigate = useNavigate();
  const {
    setShowRecruiterLogin,
    setShowUserLogin,
    userData,
    companyData,
    logout,
    logoutCompany,
  } = useContext(AppContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userRole = userData?.role || "user";
  const isStaffUser = userRole !== "user";
  const canManageTeam = ["admin", "super_admin"].includes(userRole);
  const canReviewFinance = ["admin", "finance_admin", "super_admin"].includes(userRole);

  const staffLinks = [
    canManageTeam && { label: "Team Management", path: "/team", icon: assets.person_tick_icon },
    { label: "Billing", path: "/billing", icon: assets.money_icon },
    { label: "Subscription", path: "/billing/subscription", icon: assets.resume_download_icon },
    { label: "Payment History", path: "/billing/history", icon: assets.money_icon },
    { label: "Refund Request", path: "/billing/refund", icon: assets.resume_download_icon },
    { label: "Analytics", path: "/analytics", icon: assets.home_icon },
    { label: "Incidents", path: "/incidents", icon: assets.email_icon },
    { label: "Logs", path: "/logs", icon: assets.resume_download_icon },
    canReviewFinance && { label: "Finance Dashboard", path: "/admin/finance", icon: assets.money_icon },
    canReviewFinance && { label: "Refund Review", path: "/admin/finance/panel", icon: assets.resume_download_icon },
    canReviewFinance && { label: "Reconciliation", path: "/admin/reconciliation", icon: assets.resume_download_icon },
    canManageTeam && { label: "Company Admin", path: "/company-admin", icon: assets.company_icon },
    canManageTeam && { label: "Admin Dashboard", path: "/admin", icon: assets.home_icon },
    canManageTeam && { label: "Advanced Admin", path: "/admin/advanced", icon: assets.home_icon },
    canManageTeam && { label: "Fraud", path: "/admin/fraud", icon: assets.lock_icon },
    canManageTeam && { label: "Audit Logs", path: "/admin/audit-logs", icon: assets.resume_download_icon },
    canManageTeam && { label: "Email Analytics", path: "/admin/email-analytics", icon: assets.email_icon },
  ].filter(Boolean);

  const companyLinks = [
    { label: "Manage Jobs", path: "/dashboard/manage-jobs", icon: assets.home_icon },
    { label: "Post Job", path: "/dashboard/add-job", icon: assets.add_icon },
    { label: "Applications", path: "/dashboard/view-applications", icon: assets.person_tick_icon },
    { label: "Reports", path: "/dashboard/reports", icon: assets.resume_download_icon },
    { label: "Company Profile", path: "/company-profile", icon: assets.company_icon },
  ];

  const accountButtonClass =
    "flex items-center gap-2.5 rounded-full border border-gray-200 bg-gray-50 px-1.5 py-1 pr-3 text-left transition-colors hover:bg-gray-100";
  const accountMenuClass =
    "fixed sm:absolute z-50 left-3 right-3 top-[calc(3.25rem+env(safe-area-inset-top))] sm:inset-auto sm:right-0 sm:left-auto sm:top-11 sm:w-[min(100vw-2rem,260px)] bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 max-h-[min(75vh,28rem)] overflow-y-auto overscroll-contain";
  const accountItemClass =
    "flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50";

  const handleUserLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  const handleCompanyLogout = () => {
    logoutCompany();
    setDropdownOpen(false);
    navigate("/");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 py-3 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="container px-3 sm:px-4 2xl:px-20 mx-auto flex justify-between items-center gap-2 min-w-0">
        <img
          onClick={() => navigate("/")}
          src={assets.logo}
          alt="JobBoard Logo"
          className="cursor-pointer hover:opacity-80 transition-opacity h-7 sm:h-8 shrink-0 min-w-0"
        />

        {userData ? (
          <div className="flex items-center gap-3" ref={dropdownRef}>
            <div className="relative">
              <button
                type="button"
                aria-label="Open account menu"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className={accountButtonClass}
              >
                <img
                  src={userData.image}
                  alt="Profile"
                  className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                  onError={(e) => { e.target.src = assets.profile_img; }}
                />
                <span className="text-sm font-medium text-gray-700 max-sm:hidden">
                  {userData.name?.split(" ")[0]}
                </span>
                <svg
                  className={`h-3.5 w-3.5 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className={accountMenuClass}>
                  <div className="border-b border-gray-100 px-4 py-2.5">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {userData.email || userData.name}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className={accountItemClass}
                    >
                      <img src={assets.person_icon} alt="" className="h-4 w-4" />
                      My Profile
                    </Link>
                    <Link
                      to="/applications"
                      onClick={() => setDropdownOpen(false)}
                      className={accountItemClass}
                    >
                      <img src={assets.person_tick_icon} alt="" className="h-4 w-4" />
                      My Applications
                    </Link>
                  </div>

                  {isStaffUser && (
                    <div className="border-t border-gray-100 pt-1">
                      <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        Workspace
                      </p>
                      <div className="py-1">
                        {staffLinks.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setDropdownOpen(false)}
                            className={accountItemClass}
                          >
                            <img src={item.icon} alt="" className="h-4 w-4" />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleUserLogout}
                    className={`${accountItemClass} text-red-600 hover:bg-red-50`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : companyData ? (
          <div className="flex items-center gap-3" ref={dropdownRef}>
            <div className="relative">
              <button
                type="button"
                aria-label="Open company account menu"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className={accountButtonClass}
              >
                <img
                  src={companyData.image || assets.company_icon}
                  alt="Company Profile"
                  className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                  onError={(e) => { e.target.src = assets.company_icon; }}
                />
                <span className="text-sm font-medium text-gray-700 max-sm:hidden">
                  {companyData.name}
                </span>
                <svg
                  className={`h-3.5 w-3.5 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className={accountMenuClass}>
                  <div className="border-b border-gray-100 px-4 py-2.5">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {companyData.email || companyData.name}
                    </p>
                  </div>
                  <div className="py-1">
                    {companyLinks.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate(item.path);
                        }}
                        className={accountItemClass}
                      >
                        <img src={item.icon} alt="" className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleCompanyLogout}
                    className={`${accountItemClass} text-red-600 hover:bg-red-50`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 max-sm:text-xs shrink-0">
            <button
              type="button"
              onClick={() => setShowRecruiterLogin(true)}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 whitespace-nowrap"
            >
              Recruiter Login
            </button>
            <button
              type="button"
              onClick={() => setShowUserLogin(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-8 py-2 rounded-full font-medium transition-colors shadow-sm shadow-blue-200 whitespace-nowrap"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
