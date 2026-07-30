import { createAndRunIncident, getAllIncidents, getIncidentById, incidentEmitter } from '../services/incident-agent.service.js';
export async function createIncident(req, res) {
    const { userPrompt, scenarioKey, projectId } = req.body;
    try {
        const incident = await createAndRunIncident(userPrompt, scenarioKey, projectId);
        res.json({ incident });
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Unable to create incident.' });
    }
}
export async function getIncidents(req, res) {
    const projectId = req.query.projectId;
    const incidents = await getAllIncidents(projectId);
    res.json({ incidents });
}
export async function getIncident(req, res) {
    const incident = await getIncidentById(String(req.params.id));
    if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
    }
    res.json({ incident });
}
export async function streamIncident(req, res) {
    const incidentId = String(req.params.id);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const onUpdate = (updated) => {
        res.write(`data: ${JSON.stringify(updated)}\n\n`);
    };
    incidentEmitter.on(`incident_update_${incidentId}`, onUpdate);
    const incident = await getIncidentById(incidentId);
    if (incident) {
        res.write(`data: ${JSON.stringify(incident)}\n\n`);
    }
    req.on('close', () => {
        incidentEmitter.off(`incident_update_${incidentId}`, onUpdate);
    });
}
export async function getReport(req, res) {
    const incident = await getIncidentById(String(req.params.id));
    if (!incident || !incident.report) {
        return res.status(404).json({ error: 'Report not available yet' });
    }
    res.json({ report: incident.report });
}
