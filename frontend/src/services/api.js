import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getRiskMap = async () => {
  const response = await api.get('/risk/map');
  return response.data;
};

export const getVillageRisk = async (villageId) => {
  const response = await api.get(`/risk/${villageId}`);
  return response.data;
};

export const getVillageRiskHistory = async (villageId) => {
  const response = await api.get(`/risk/${villageId}/history`);
  return response.data;
};

export const getAlerts = async () => {
  const response = await api.get('/alerts');
  return response.data;
};

export const getShelters = async () => {
  const response = await api.get('/shelters');
  return response.data;
};

export const getEvacuationIntelligence = async (villageId) => {
  const response = await api.get(`/evacuation/${villageId}`);
  return response.data;
};

export const getSimulationStatus = async () => {
  const response = await api.get('/simulation/status');
  return response.data;
};

export const stepSimulation = async (stepNumber = null) => {
  const url = stepNumber ? `/simulation/step?step_number=${stepNumber}` : '/simulation/step';
  const response = await api.post(url);
  return response.data;
};

export const resetSimulation = async () => {
  const response = await api.post('/simulation/reset');
  return response.data;
};

export const getSystemStatus = async () => {
  const response = await api.get('/admin/system-status');
  return response.data;
};

export const getDataStatus = async () => {
  const response = await api.get('/admin/data-status');
  return response.data;
};

export const getModelInfo = async () => {
  const response = await api.get('/admin/model-info');
  return response.data;
};

export const getCurrentWeather = async () => {
  const response = await api.get('/weather/current');
  return response.data;
};

export const getRainfallHistory = async () => {
  const response = await api.get('/rainfall/history');
  return response.data;
};

export default api;
