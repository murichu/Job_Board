import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "../lib/toast";

export const AppContext = createContext(null);

const api = axios.create({
  timeout: 20000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (!config.url) return config;

  const normalizedUrl = config.url.toLowerCase();
  const companyToken = localStorage.getItem("companyToken");
  const userToken = localStorage.getItem("Token");

  let token = null;
  if (normalizedUrl.includes("/api/company/")) token = companyToken;
  else if (normalizedUrl.includes("/api/user/")) token = userToken;
  else if (normalizedUrl.includes("/api/application/")) token = userToken;
  else if (normalizedUrl.includes("/api/billing")) token = userToken;
  else if (normalizedUrl.includes("/api/admin")) token = userToken;
  else if (normalizedUrl.includes("/api/insights")) token = userToken;
  else if (normalizedUrl.includes("/api/team")) token = userToken;
  else if (normalizedUrl.includes("/api/dashboard")) token = userToken;

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const url = (originalRequest.url || "").toLowerCase();
    const isAuthEndpoint = ["/login", "/register", "/refresh-token", "/logout"].some((p) => url.includes(p));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const scope = url.includes("/api/company/") ? "company" : "user";

      originalRequest._retry = true;
      try {
        refreshPromises[scope] = refreshPromises[scope] || requestRefreshToken(scope);
        const data = await refreshPromises[scope];
        refreshPromises[scope] = null;

        if (data?.success && data.token) {
          localStorage.setItem(scope === "company" ? "companyToken" : "Token", data.token);
          originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${data.token}` };
          return api(originalRequest);
        }
      } catch {
        refreshPromises[scope] = null;
      }
    }

    if (error.response?.status === 401) {
      const currentPath = window.location.pathname || "/";
      if (!currentPath.startsWith("/dashboard") && !currentPath.startsWith("/profile") && !currentPath.startsWith("/applications")) {
        localStorage.removeItem("Token");
        localStorage.removeItem("companyToken");
      }
    }
    return Promise.reject(error);
  }
);

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    const match = window.location.hostname.match(/^(.*)-\d+\.csb\.app$/);
    if (match?.[1]) return `https://${match[1]}-5000.csb.app`;
  }

  return import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
};

// De-duped per scope so concurrent 401s don't trigger multiple refresh calls at once.
const refreshPromises = { user: null, company: null };
const requestRefreshToken = async (scope) => {
  const { data } = await axios.post(`${getBackendUrl()}/api/${scope}/refresh-token`, {}, { withCredentials: true });
  return data;
};

export const AppContextProvider = ({ children }) => {
  const [backendUrl] = useState(getBackendUrl);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("Token") || null);
  const [companyToken, setCompanyToken] = useState(() => localStorage.getItem("companyToken") || null);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [showRecruiterLogin, setShowRecruiterLogin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [searchFilter, setSearchFilter] = useState({ title: "", location: "" });
  const [isSearched, setIsSearched] = useState(false);
  const [userApplications, setUserApplications] = useState([]);

  const fetchJobs = useCallback(async (force = false) => {
    try {
      if (!force) {
        const cached = localStorage.getItem("jp_jobs_v2");
        const cachedTs = localStorage.getItem("jp_jobs_ts_v2");
        if (cached && cachedTs && Date.now() - Number(cachedTs) < 5 * 60 * 1000) {
          setJobs(JSON.parse(cached));
          return;
        }
      }

      setJobsLoading(true);
      const { data } = await api.get(`${backendUrl}/api/jobs`);
      if (data.success) {
        setJobs(data.jobs || []);
        localStorage.setItem("jp_jobs_v2", JSON.stringify(data.jobs || []));
        localStorage.setItem("jp_jobs_ts_v2", String(Date.now()));
      } else {
        toast.error(data.message || "Failed to fetch jobs.");
      }
    } catch (error) {
      console.error("fetchJobs error:", error);
      toast.error(error.response?.data?.message || "Unable to load jobs right now.");
    } finally {
      setJobsLoading(false);
    }
  }, [backendUrl]);

  const fetchUserData = useCallback(async () => {
    if (!token) return;

    try {
      const { data } = await api.get(`${backendUrl}/api/user/user`);
      if (data.success) setUserData(data.user);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error("fetchUserData error:", error);
      }
    }
  }, [backendUrl, token]);

  const fetchCompanyData = useCallback(async () => {
    if (!companyToken) return;

    try {
      const { data } = await api.get(`${backendUrl}/api/company/company`);
      if (data.success) setCompanyData(data.company);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error("fetchCompanyData error:", error);
      }
    }
  }, [backendUrl, companyToken]);

  const fetchUserApplications = useCallback(async () => {
    if (!token) return;

    try {
      const { data } = await api.get(`${backendUrl}/api/user/applications`);
      if (data.success) setUserApplications(data.applications || []);
    } catch (error) {
      console.error("fetchUserApplications error:", error);
    }
  }, [backendUrl, token]);

  const logout = useCallback(() => {
    api.post(`${backendUrl}/api/user/logout`).catch(() => {});
    localStorage.removeItem("Token");
    setToken(null);
    setUserData(null);
    setUserApplications([]);
  }, [backendUrl]);

  const logoutCompany = useCallback(() => {
    api.post(`${backendUrl}/api/company/logout`).catch(() => {});
    localStorage.removeItem("companyToken");
    setCompanyToken(null);
    setCompanyData(null);
  }, [backendUrl]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("Token", token);
      fetchUserData();
      fetchUserApplications();
    } else {
      localStorage.removeItem("Token");
    }
  }, [token, fetchUserData, fetchUserApplications]);

  useEffect(() => {
    if (companyToken) {
      localStorage.setItem("companyToken", companyToken);
      fetchCompanyData();
    } else {
      localStorage.removeItem("companyToken");
    }
  }, [companyToken, fetchCompanyData]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const value = useMemo(
    () => ({
      backendUrl,
      api,
      token,
      setToken,
      companyToken,
      setCompanyToken,
      showUserLogin,
      setShowUserLogin,
      showRecruiterLogin,
      setShowRecruiterLogin,
      userData,
      setUserData,
      companyData,
      setCompanyData,
      jobs,
      setJobs,
      jobsLoading,
      fetchJobs,
      searchFilter,
      setSearchFilter,
      isSearched,
      setIsSearched,
      logout,
      logoutCompany,
      userApplications,
      setUserApplications,
      fetchUserApplications,
      fetchUserData,
      fetchCompanyData,
    }),
    [backendUrl, token, companyToken, showUserLogin, showRecruiterLogin, userData, companyData, jobs, jobsLoading, searchFilter, isSearched, logout, logoutCompany, userApplications, fetchJobs, fetchUserApplications, fetchUserData, fetchCompanyData]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
