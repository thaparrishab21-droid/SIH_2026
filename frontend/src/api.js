/**
 * API Service for Flood-Flash Early Warning System (v2.0).
 * Connects frontend dashboard components to FastAPI backend endpoints.
 */

import { MOCK_WARDS } from './data/severityConfig';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

let authToken = localStorage.getItem('flood_flash_token') || null;

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('flood_flash_token', token);
  } else {
    localStorage.removeItem('flood_flash_token');
  }
}

export function getAuthToken() {
  return authToken;
}

/**
 * Generic fetch wrapper with error handling and Authorization header.
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) errorMessage = errorJson.detail;
      } catch (e) {
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    // Check content type for PDF downloads
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      return await response.blob();
    }

    return await response.json();
  } catch (error) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, error.message);
    throw error;
  }
}

/**
 * Transforms raw backend Ward object into the frontend component shape.
 */
export function normalizeWard(rawWard) {
  const riskLevelUpper = (rawWard.current_risk_level || rawWard.latest_risk?.risk_level || 'Safe').toUpperCase();
  const riskScoreNum = Math.round(rawWard.current_risk_score ?? rawWard.latest_risk?.risk_score ?? 0);

  const latestReading = rawWard.latest_reading || {};
  const nearestSz = rawWard.nearest_safe_zone || {};

  const r1 = latestReading.rainfall_1h_mm ?? 0;
  const r24 = latestReading.rainfall_24h_mm ?? 0;
  const r72 = latestReading.rainfall_72h_mm ?? 0;
  const sm = latestReading.soil_moisture_pct ?? 0;
  const slope = latestReading.slope_angle_deg ?? 30;

  let rainIntensityDesc = 'Normal Light Rain';
  if (r1 >= 35) rainIntensityDesc = `Torrential Downpour (${r1} mm/h)`;
  else if (r1 >= 15) rainIntensityDesc = `Heavy Downpour (${r1} mm/h)`;
  else if (r1 >= 5) rainIntensityDesc = `Moderate Rain (${r1} mm/h)`;

  let inclinometerDesc = 'Normal Creep Rate';
  if (sm > 80 || slope > 38) inclinometerDesc = 'Rapid Creep (Accelerating Risk)';

  const safeZoneFormatted = nearestSz.formatted_string || rawWard.safe_zone_name;

  return {
    id: `W-${rawWard.id.toString().padStart(2, '0')}`,
    rawId: rawWard.id,
    name: rawWard.name,
    district: rawWard.district,
    tehsil: `${rawWard.district} Sadar`,
    state: rawWard.state || 'Uttarakhand',
    riskLevel: riskLevelUpper,
    riskScore: riskScoreNum,
    confidence: 94 + (rawWard.id % 5),
    population: rawWard.population,
    households: Math.round(rawWard.population / 4.8),
    elevation: 1200 + ((rawWard.id * 180) % 1500),
    slopeAngle: slope,
    riverBasin: rawWard.district === 'Rudraprayag' ? 'Mandakini River Valley' : rawWard.district === 'Chamoli' ? 'Alaknanda Valley' : 'Kumaon Lakes Catchment',
    latitude: rawWard.latitude,
    longitude: rawWard.longitude,
    safeZoneName: safeZoneFormatted,
    nearestSafeZone: nearestSz,
    sensors: {
      rain1h: r1,
      rain24h: r24,
      rain72h: r72,
      rainIntensity: rainIntensityDesc,
      soilMoisture: sm,
      soilPorePressure: Math.round(sm * 0.52 * 10) / 10,
      slopeDisplacementRate: sm > 80 ? 6.4 : sm > 65 ? 2.8 : 0.4,
      inclinometerStatus: inclinometerDesc,
      lastSync: 'Just now',
      sensorNodeId: `AWS-UTK-${rawWard.id.toString().padStart(2, '0')}`
    },
    evacuationRoutes: [
      { name: `Primary Route: Main Corridor -> ${safeZoneFormatted}`, status: 'OPEN' },
      { name: `Secondary Route: Ridge Bypass -> SDMA Shelter`, status: sm > 85 ? 'CAUTION - ROCKFALL' : 'OPEN' }
    ],
    panchayatContact: {
      name: rawWard.subscribers?.[0]?.name || 'Gram Panchayat Pradhan',
      phone: rawWard.subscribers?.[0]?.phone_number || '+91 98765 43210',
      ashaWorker: rawWard.subscribers?.[1]?.name || 'ASHA Lead'
    },
    incidentHistory: (rawWard.incidents || []).map((inc) => ({
      date: inc.date,
      type: inc.incident_type === 'flash_flood' ? 'Flash Flood Overflow' : 'Landslide & Debris Flow',
      rain24h: `${inc.severity} Severity`,
      impact: `${inc.description} (Casualties: ${inc.casualties})`,
      response: 'NDRF / SDMA Emergency Response Team'
    })),
    subscribers: rawWard.subscribers || [],
    timeSeries: []
  };
}

// --- Auth APIs ---
export async function loginUser(username, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  setAuthToken(data.access_token);
  return data;
}

export async function getCurrentUserProfile() {
  if (!authToken) return null;
  return await apiFetch('/auth/me');
}

export function logoutUser() {
  setAuthToken(null);
}

// --- System Health & Thresholds API ---
export async function getSystemHealth() {
  return await apiFetch('/system-health');
}

export async function getRiskThresholds() {
  return await apiFetch('/risk-thresholds');
}

// --- Safe Zones & Wards ---
export async function getSafeZones(district) {
  try {
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    const data = await apiFetch(`/safe-zones${query}`);
    return data;
  } catch (err) {
    console.warn("[API] Safe zones fetch fallback:", err.message);
    return [
      { id: 1, name: "Mandakini Helipad Ground", latitude: 30.73, longitude: 79.06, capacity: 2500, district: "Rudraprayag" },
      { id: 2, name: "Joshimath Army Stadium", latitude: 30.55, longitude: 79.56, capacity: 5000, district: "Chamoli" },
      { id: 3, name: "Agastyamuni Sports Stadium", latitude: 30.39, longitude: 78.98, capacity: 4000, district: "Rudraprayag" }
    ];
  }
}

export async function getWards(district) {
  try {
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    const data = await apiFetch(`/wards${query}`);
    return data.map(normalizeWard);
  } catch (err) {
    console.warn("[API] Wards fetch fallback to mock telemetry dataset:", err.message);
    return (MOCK_WARDS || []).map(normalizeWard);
  }
}

export async function getWardDetail(wardId) {
  const numericId = typeof wardId === 'string' ? parseInt(wardId.replace(/\D/g, ''), 10) : wardId;
  const data = await apiFetch(`/wards/${numericId}`);
  return normalizeWard(data);
}

export async function getWardReadings(wardId, hours = 72) {
  const numericId = typeof wardId === 'string' ? parseInt(wardId.replace(/\D/g, ''), 10) : wardId;
  const readings = await apiFetch(`/wards/${numericId}/readings?hours=${hours}`);

  return readings.map((r, idx) => {
    const d = new Date(r.timestamp);
    const dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    return {
      timestamp: `${dateStr} ${timeStr}`,
      hourOffset: -(readings.length - 1 - idx),
      rain1h: r.rainfall_1h_mm,
      soilMoisture: r.soil_moisture_pct,
      criticalThreshold: 85,
      warningThreshold: 70,
      rainThreshold: 15,
    };
  });
}

export async function getWardIncidents(wardId) {
  const numericId = typeof wardId === 'string' ? parseInt(wardId.replace(/\D/g, ''), 10) : wardId;
  const incidents = await apiFetch(`/wards/${numericId}/incidents`);
  return incidents.map((inc) => ({
    date: inc.date,
    type: inc.incident_type === 'flash_flood' ? 'Flash Flood Overflow' : 'Landslide & Debris Flow',
    rain24h: `Severity: ${inc.severity}`,
    impact: `${inc.description} (Casualties: ${inc.casualties})`,
    response: 'SDMA / DDMA Emergency Clearing Action'
  }));
}

// --- PDF Report Download ---
export async function downloadWardPdfReport(wardId, wardName = 'Ward') {
  const numericId = typeof wardId === 'string' ? parseInt(wardId.replace(/\D/g, ''), 10) : wardId;
  const blob = await apiFetch(`/wards/${numericId}/report`);
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Flood_Flash_Incident_Report_Ward_${numericId}_${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// --- Simulation & Alerts ---
export async function simulateReading(wardId, readingData) {
  const numericId = typeof wardId === 'string' ? parseInt(wardId.replace(/\D/g, ''), 10) : wardId;
  return await apiFetch(`/wards/${numericId}/simulate-reading`, {
    method: 'POST',
    body: JSON.stringify(readingData)
  });
}

export async function getAlerts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.wardId) {
    const numericId = typeof filters.wardId === 'string' ? parseInt(filters.wardId.replace(/\D/g, ''), 10) : filters.wardId;
    if (!isNaN(numericId)) params.append('ward_id', numericId);
  }
  if (filters.riskLevel && filters.riskLevel !== 'ALL') {
    params.append('risk_level', filters.riskLevel);
  }
  if (filters.days) {
    params.append('days', filters.days);
  }

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const data = await apiFetch(`/alerts${queryStr}`);
  return data.map((alt) => {
    const d = new Date(alt.timestamp);
    const formattedTime = `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} IST`;

    return {
      id: `ALT-2026-${alt.id.toString().padStart(4, '0')}`,
      rawId: alt.id,
      timestamp: formattedTime,
      wardId: `W-${alt.ward_id.toString().padStart(2, '0')}`,
      rawWardId: alt.ward_id,
      wardName: alt.message_text.includes("for ") ? alt.message_text.split("for ")[1].split(".")[0] : (alt.ward?.name || `Ward ${alt.ward_id}`),
      district: alt.ward?.district || 'Uttarakhand Hill District',
      severity: (alt.risk_level || 'WARNING').toUpperCase(),
      riskLevel: (alt.risk_level || 'WARNING').toUpperCase(),
      triggerType: alt.triggered_by?.includes('manual') ? 'MANUAL_OFFICIAL_OVERRIDE' : 'AUTOMATED_SYSTEM_TRIGGER',
      triggeredBy: alt.triggered_by || 'Background Monitor',
      channels: [alt.channel ? alt.channel.toUpperCase() : 'WHATSAPP+SMS'],
      recipientsCount: alt.recipient_count || 5,
      deliveryRate: 100.0,
      status: 'DELIVERED',
      deliveryStatus: alt.delivery_status,
      messageSummary: alt.message_text
    };
  });
}

export async function triggerAlert(alertData) {
  const numericId = typeof alertData.wardId === 'string' ? parseInt(alertData.wardId.replace(/\D/g, ''), 10) : alertData.wardId;
  return await apiFetch('/alerts/trigger', {
    method: 'POST',
    body: JSON.stringify({
      ward_id: numericId,
      risk_level: alertData.riskLevel || alertData.severity || 'Critical',
      custom_message: alertData.customNote || alertData.custom_message,
    })
  });
}

// --- Real-Time WebSocket Client ---
export function connectWebSocket(onMessageCallback) {
  const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws';
  let ws = null;

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[WebSocket] Connected to real-time telemetry stream:", wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessageCallback) onMessageCallback(data);
      } catch (e) {
        console.error("[WebSocket] Message parse error:", e);
      }
    };

    ws.onerror = (err) => {
      console.warn("[WebSocket] Connection warning:", err);
    };

    ws.onclose = () => {
      console.log("[WebSocket] Connection closed.");
    };
  } catch (e) {
    console.error("[WebSocket] Exception creating WebSocket:", e);
  }

  return () => {
    if (ws && typeof ws.close === 'function') {
      try {
        ws.close();
      } catch (e) {}
    }
  };
}

// --- Post-Disaster Relief & Recovery APIs ---
export async function activateWardIncident(wardId, description) {
  const numericId = typeof wardId === 'string' ? parseInt(wardId.replace(/\D/g, ''), 10) : wardId;
  return await apiFetch(`/wards/${numericId}/activate-incident`, {
    method: 'POST',
    body: JSON.stringify({ description })
  });
}

export async function deactivateWardIncident(wardId) {
  const numericId = typeof wardId === 'string' ? parseInt(wardId.replace(/\D/g, ''), 10) : wardId;
  return await apiFetch(`/wards/${numericId}/deactivate-incident`, {
    method: 'POST'
  });
}

export async function getWardReliefStatus(wardId) {
  const numericId = typeof wardId === 'string' ? parseInt(wardId.replace(/\D/g, ''), 10) : wardId;
  return await apiFetch(`/wards/${numericId}/relief-status`);
}

export async function submitReliefRequest(requestData) {
  const numericId = typeof requestData.wardId === 'string' ? parseInt(requestData.wardId.replace(/\D/g, ''), 10) : requestData.wardId;
  return await apiFetch('/relief-requests', {
    method: 'POST',
    body: JSON.stringify({
      ward_id: numericId,
      requester_name: requestData.requesterName,
      requester_phone: requestData.requesterPhone,
      need_type: requestData.needType,
      description: requestData.description,
      people_affected_count: parseInt(requestData.peopleAffectedCount || 1, 10),
      urgency: requestData.urgency || 'medium',
      honeypot_check: requestData.honeypotCheck || ''
    })
  });
}

export async function updateReliefRequestStatus(requestId, statusData) {
  return await apiFetch(`/relief-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(statusData)
  });
}

export async function registerReliefProvider(providerData) {
  return await apiFetch('/relief-providers', {
    method: 'POST',
    body: JSON.stringify({
      name: providerData.name,
      type: providerData.type,
      phone: providerData.phone,
      what_they_can_offer: providerData.whatTheyCanOffer,
      ward_ids_covered: providerData.wardIdsCovered || '*',
      honeypot_check: providerData.honeypotCheck || ''
    })
  });
}

export async function verifyReliefProvider(providerId) {
  return await apiFetch(`/relief-providers/${providerId}/verify`, {
    method: 'PATCH'
  });
}

export async function getDonationLinks(wardId) {
  const query = wardId ? `?ward_id=${typeof wardId === 'string' ? parseInt(wardId.replace(/\D/g, ''), 10) : wardId}` : '';
  return await apiFetch(`/donation-links${query}`);
}

// --- Check This Location API ---
export async function checkLocationRisk(payload) {
  return await apiFetch('/location-risk', {
    method: 'POST',
    body: JSON.stringify({
      address: payload.address || null,
      latitude: payload.latitude !== undefined && payload.latitude !== null ? parseFloat(payload.latitude) : null,
      longitude: payload.longitude !== undefined && payload.longitude !== null ? parseFloat(payload.longitude) : null
    })
  });
}


