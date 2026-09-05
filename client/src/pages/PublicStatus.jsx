import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";

export default function PublicStatus() {
  const { backendUrl, api } = useContext(AppContext);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const { data } = await api.get(`${backendUrl}/api/incidents`);
        if (data.success) {
          setIncidents(data.incidents || []);
        }
      } catch (error) {
        console.error("PublicStatus fetch error:", error.message);
      }
    };
    fetchIncidents();
  }, [backendUrl, api]);

  const active = (incidents || []).filter((i) => i.status !== "resolved");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">System Status</h1>

      {active.length === 0 ? (
        <p className="text-green-600">All systems operational ✅</p>
      ) : (
        <div className="mt-4 space-y-2">
          {active.map(i => (
            <div key={i._id} className="bg-red-100 p-3">
              <p className="font-bold">{i.title}</p>
              <p>{i.message}</p>
              <p>Status: {i.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
