import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom Map Auto-Center Controller
function MapAutoCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 12, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

// Marker Icon Creator for Shelters
const createShelterIcon = () => {
  return L.divIcon({
    className: 'custom-shelter-icon',
    html: `<div style="background-color:#0284c7; width:28px; height:28px; border-radius:50%; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; color:white; font-size:14px; font-weight:bold; box-shadow:0 0 10px rgba(2,132,199,0.8);">🛡️</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

const getRiskColor = (level) => {
  switch (level) {
    case 'CRITICAL':
      return '#ef4444'; // Red
    case 'HIGH':
      return '#f97316'; // Orange
    case 'MODERATE':
      return '#eab308'; // Yellow
    case 'LOW':
    default:
      return '#22c55e'; // Green
  }
};

const RiskMap = ({ villages = [], shelters = [], selectedVillage, onSelectVillage, evacuationRoute }) => {
  const mapCenter = selectedVillage 
    ? [selectedVillage.latitude, selectedVillage.longitude] 
    : [31.7087, 76.9320]; // Mandi District Center

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <MapContainer
        center={mapCenter}
        zoom={11}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapAutoCenter center={mapCenter} />

        {/* 1. Village Risk Markers */}
        {villages.map((v) => {
          const color = getRiskColor(v.risk_level);
          const isSelected = selectedVillage?.id === v.id;

          return (
            <React.Fragment key={v.id}>
              {/* Outer Pulsing Aura for Critical/High Villages */}
              {(v.risk_level === 'CRITICAL' || v.risk_level === 'HIGH') && (
                <CircleMarker
                  center={[v.latitude, v.longitude]}
                  radius={isSelected ? 24 : 18}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.25,
                    weight: 1.5,
                    className: 'animate-ping'
                  }}
                />
              )}

              {/* Main Core Marker */}
              <CircleMarker
                center={[v.latitude, v.longitude]}
                radius={isSelected ? 14 : 10}
                pathOptions={{
                  color: isSelected ? '#ffffff' : color,
                  fillColor: color,
                  fillOpacity: 0.9,
                  weight: isSelected ? 3 : 2
                }}
                eventHandlers={{
                  click: () => onSelectVillage(v)
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1 mb-2">
                      <h3 className="font-bold text-sm text-slate-100">{v.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white`} style={{ backgroundColor: color }}>
                        {v.risk_level}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>Overall Risk:</span>
                        <span className="font-bold text-slate-100">{v.overall_risk_score} / 100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Flood Prob:</span>
                        <span className="text-cyan-400 font-semibold">{Math.round(v.flood_probability * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Landslide Prob:</span>
                        <span className="text-amber-400 font-semibold">{Math.round(v.landslide_probability * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Population at Risk:</span>
                        <span className="text-red-400 font-semibold">{v.population_at_risk?.toLocaleString() || v.population}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span>Est Lead Time:</span>
                        <span className="text-emerald-400 font-bold">{v.estimated_lead_time} mins</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectVillage(v)}
                      className="mt-3 w-full py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold shadow transition-all"
                    >
                      Inspect Risk & Evacuation
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* 2. Emergency Shelters Markers */}
        {shelters.map((s) => (
          <Marker
            key={`shelter-${s.id}`}
            position={[s.latitude, s.longitude]}
            icon={createShelterIcon()}
          >
            <Popup>
              <div className="p-1 text-xs">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-900 text-sky-300 uppercase">
                  Emergency Shelter
                </span>
                <h4 className="font-bold text-sm text-slate-100 mt-1">{s.name}</h4>
                <p className="text-slate-300 mt-1">Capacity: {s.capacity} persons</p>
                <p className="text-emerald-400 font-semibold">Occupancy: {s.current_occupancy} / {s.capacity}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 3. Evacuation Route Polyline Overlay */}
        {evacuationRoute?.recommended_route?.waypoints && (
          <Polyline
            positions={evacuationRoute.recommended_route.waypoints}
            pathOptions={{
              color: '#06b6d4', // Bright cyan
              weight: 5,
              opacity: 0.9,
              dashArray: '8, 8',
              className: 'animate-pulse'
            }}
          />
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 text-xs shadow-xl">
        <h4 className="font-bold text-slate-200 mb-2 uppercase tracking-wider text-[11px]">GIS Risk Legend</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-slate-300">Critical (76-100)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span className="text-slate-300">High (51-75)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-slate-300">Moderate (26-50)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Low (0-25)</span>
          </div>
          <div className="flex items-center space-x-2 col-span-2 pt-1 border-t border-slate-800">
            <span className="w-3 h-3 rounded-full bg-sky-500 flex items-center justify-center text-[8px]">🛡️</span>
            <span className="text-slate-300">Safe Emergency Shelter</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMap;
