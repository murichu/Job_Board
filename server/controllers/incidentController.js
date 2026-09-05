import Incident from "../models/Incident.js";

export const createIncident = async (req, res) => {
  try {
    const { title, message, severity, affectedService, status } = req.body;
    const incident = await Incident.create({ title, message, severity, affectedService, status: status || "investigating" });
    res.json({ success: true, incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getIncidents = async (req, res) => {
  const incidents = await Incident.find().sort({ createdAt: -1 });
  res.json({ success: true, incidents });
};

export const updateIncident = async (req, res) => {
  try {
    const { status, message, severity, affectedService } = req.body;
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ success: false, message: "Incident not found" });

    if (status) incident.status = status;
    if (severity) incident.severity = severity;
    if (affectedService) incident.affectedService = affectedService;
    if (message) incident.updates.push({ status: status || incident.status, message, createdBy: req.user._id });

    if (status === "resolved") incident.resolvedAt = new Date();

    await incident.save();
    res.json({ success: true, incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
