import React, { useState, useEffect, useRef } from 'react';
import { 
  Map as MapIcon, Grid, ListFilter, AlertOctagon, AlertTriangle, Eye, Shield, 
  Layers, CloudRain, Droplets, Compass, ZoomIn, ZoomOut, RefreshCw, ChevronRight,
  TrendingUp, Navigation, Zap, AlertCircle, MapPin
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet.heat';
import { SEVERITY_LEVELS } from '../data/severityConfig';
import { UTTARAKHAND_DISTRICTS_GEOJSON, UTTARAKHAND_RIVERS_GEOJSON } from '../data/uttarakhandGeoJson';

export default function MapView({ 
  wards = [], 
  selectedWard, 
  onSelectWard, 
  activeFilter, 
  highContrast, 
  isLoading, 
  error, 
  onRetry,
  onSimulateSpike,
  safeZones = [],
  queriedLocation = null,
  onMapClickLocation = null
}) {
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'grid' | 'table'
  const [baseTileType, setBaseTileType] = useState('topo'); // 'osm' | 'topo'
  const [showContours, setShowContours] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showRivers, setShowRivers] = useState(true);
  const [showDistricts, setShowDistricts] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [tileError, setTileError] = useState(false);

  // Leaflet Container & Layer References
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const heatLayerRef = useRef(null);
  const riversLayerRef = useRef(null);
  const districtsLayerRef = useRef(null);
  const safeZonesLayerGroupRef = useRef(null);
  const queriedLayerGroupRef = useRef(null);
  const routePolylineRef = useRef(null);

  // Filter wards safely by severity & search
  const searchLower = (searchTerm || '').trim().toLowerCase();
  const filteredWards = (wards || []).filter((w) => {
    if (!w) return false;
    const matchesFilter = activeFilter === 'ALL' || w.riskLevel === activeFilter;
    const nameStr = (w.name || '').toLowerCase();
    const distStr = (w.district || '').toLowerCase();
    const idStr = String(w.id || w.rawId || '').toLowerCase();
    const matchesSearch = !searchLower || nameStr.includes(searchLower) || distStr.includes(searchLower) || idStr.includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const getSeverityBadge = (level) => {
    const lvlUpper = (level || 'SAFE').toUpperCase();
    const cfg = SEVERITY_LEVELS[lvlUpper] || SEVERITY_LEVELS.SAFE;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide border ${cfg.badgeBg} ${cfg.textColor} ${cfg.borderColor}`}>
        {lvlUpper === 'CRITICAL' && <AlertOctagon className="w-3.5 h-3.5 text-red-600 animate-pulse" />}
        {lvlUpper === 'WARNING' && <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />}
        {lvlUpper === 'WATCH' && <Eye className="w-3.5 h-3.5 text-amber-600" />}
        {lvlUpper === 'SAFE' && <Shield className="w-3.5 h-3.5 text-emerald-600" />}
        <span>L{cfg.level} {cfg.label.toUpperCase()}</span>
      </span>
    );
  };

  const handleDemoSpikeClick = async () => {
    if (!selectedWard && filteredWards.length === 0) return;
    const targetWard = selectedWard || filteredWards[0];
    setIsSimulating(true);
    try {
      if (onSimulateSpike) {
        await onSimulateSpike(targetWard.rawId || targetWard.id);
      }
    } catch (e) {
      console.warn("[Demo Spike] Handled simulation warning:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  const onMapClickLocationRef = useRef(onMapClickLocation);
  useEffect(() => {
    onMapClickLocationRef.current = onMapClickLocation;
  }, [onMapClickLocation]);

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center on Uttarakhand (30.15° N, 79.25° E), Zoom 8.5
      const map = L.map(mapContainerRef.current, {
        center: [30.15, 79.25],
        zoom: 8.5,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Create Layer Groups
      districtsLayerRef.current = L.layerGroup().addTo(map);
      riversLayerRef.current = L.layerGroup().addTo(map);
      markersLayerGroupRef.current = L.layerGroup().addTo(map);
      safeZonesLayerGroupRef.current = L.layerGroup().addTo(map);
      queriedLayerGroupRef.current = L.layerGroup().addTo(map);

      // Map Click Event Listener for Location Risk Check (Light Theme Popup)
      map.on('click', (e) => {
        try {
          if (!e || !e.latlng) return;
          const { lat, lng } = e.latlng;
          
          if (clickPopupRef.current) {
            try { map.closePopup(clickPopupRef.current); } catch (err) {}
          }

          clickPopupRef.current = L.popup({
            className: 'custom-map-click-popup',
            closeButton: true,
            offset: [0, -10]
          })
            .setLatLng([lat, lng])
            .setContent(`
              <div style="background: #ffffff; color: #0f172a; padding: 10px; border-radius: 8px; border: 1px solid #2563eb; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11px; box-shadow: 0 4px 14px rgba(0,0,0,0.12);">
                <div style="font-weight: 800; font-size: 12px; color: #2563eb; margin-bottom: 4px;">📍 Clicked Location</div>
                <div>Lat: <strong>${lat.toFixed(4)}° N</strong> • Lng: <strong>${lng.toFixed(4)}° E</strong></div>
                <div style="margin-top: 6px; color: #d97706; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                  <span>⏳ Calculating Landslide & Flood Risk...</span>
                </div>
              </div>
            `)
            .openOn(map);

          if (typeof onMapClickLocationRef.current === 'function') {
            onMapClickLocationRef.current(lat, lng);
          }
        } catch (err) {
          console.warn("[MapView] Map click listener warning:", err);
        }
      });

      mapInstanceRef.current = map;

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode]);

  // 2. Base Tile Layer Handler (OSM vs OpenTopoMap Topo Contours)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      try { map.removeLayer(tileLayerRef.current); } catch (e) {}
    }

    const tileUrl = (baseTileType === 'topo' || showContours)
      ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileOptions = {
      maxZoom: 17,
      subdomains: 'abc'
    };

    const newTileLayer = L.tileLayer(tileUrl, tileOptions);

    newTileLayer.on('tileerror', () => setTileError(true));
    newTileLayer.on('load', () => setTileError(false));

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [baseTileType, showContours, viewMode, isLoading]);

  // 3. Render District Boundaries GeoJSON Overlay (Light Theme Style)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !districtsLayerRef.current) return;

    districtsLayerRef.current.clearLayers();

    if (showDistricts) {
      const districtsLayer = L.geoJSON(UTTARAKHAND_DISTRICTS_GEOJSON, {
        style: {
          color: '#0284c7',
          weight: 1.5,
          opacity: 0.7,
          fillColor: '#0284c7',
          fillOpacity: 0.06,
          dashArray: '4, 4'
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindTooltip(`${feature.properties.name} District`, {
              permanent: false,
              direction: 'center',
              className: 'bg-white text-slate-800 font-sans text-[11px] font-bold px-2 py-0.5 rounded border border-slate-300 shadow-sm'
            });
          }
        }
      });
      districtsLayerRef.current.addLayer(districtsLayer);
    }
  }, [showDistricts, viewMode, isLoading]);

  // 4. Render Rivers GeoJSON Vector Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !riversLayerRef.current) return;

    riversLayerRef.current.clearLayers();

    if (showRivers) {
      const riversLayer = L.geoJSON(UTTARAKHAND_RIVERS_GEOJSON, {
        style: {
          color: '#0284c7',
          weight: 3,
          opacity: 0.85,
          dashArray: '6, 4'
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindTooltip(`🌊 ${feature.properties.name} (${feature.properties.basin})`, {
              sticky: true,
              className: 'bg-white text-blue-900 font-sans text-[11px] font-bold px-2 py-1 rounded border border-blue-200 shadow-sm'
            });
          }
        }
      });
      riversLayerRef.current.addLayer(riversLayer);
    }
  }, [showRivers, viewMode, isLoading]);

  // 5. Render Risk Heatmap Layer (leaflet.heat safely without click errors)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      try { map.removeLayer(heatLayerRef.current); } catch (e) {}
      heatLayerRef.current = null;
    }

    if (showHeatmap) {
      const heatPoints = filteredWards
        .filter(w => w && w.latitude && w.longitude)
        .map(w => [
          w.latitude,
          w.longitude,
          Math.max(0.3, (w.riskScore || 20) / 100.0)
        ]);

      if (queriedLocation && queriedLocation.latitude && queriedLocation.longitude) {
        heatPoints.push([
          queriedLocation.latitude,
          queriedLocation.longitude,
          Math.max(0.35, (queriedLocation.danger_factor || 40) / 100.0)
        ]);
      }

      if (heatPoints.length > 0 && typeof L.heatLayer === 'function') {
        try {
          const hLayer = L.heatLayer(heatPoints, {
            radius: 42,
            blur: 26,
            maxZoom: 12,
            interactive: false,
            gradient: {
              0.2: '#10b981',
              0.45: '#f59e0b',
              0.7: '#f97316',
              0.95: '#ef4444'
            }
          }).addTo(map);
          if (hLayer._canvas) {
            hLayer._canvas.style.pointerEvents = 'none';
          }
          heatLayerRef.current = hLayer;
        } catch (err) {
          console.warn("[MapView] HeatLayer render warning:", err);
        }
      }
    }
  }, [showHeatmap, filteredWards, queriedLocation, viewMode, isLoading]);

  // 5b. Render User-Queried Location Distinct Marker & Fly To
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !queriedLayerGroupRef.current) return;

    queriedLayerGroupRef.current.clearLayers();

    if (!queriedLocation || !queriedLocation.latitude || !queriedLocation.longitude) return;

    const lat = Number(queriedLocation.latitude);
    const lng = Number(queriedLocation.longitude);
    const riskLvlUpper = (queriedLocation.risk_level || 'SAFE').toUpperCase();
    const cfg = SEVERITY_LEVELS[riskLvlUpper] || SEVERITY_LEVELS.SAFE;

    const queriedIcon = L.divIcon({
      className: 'custom-queried-location-marker-container',
      html: `
        <div class="custom-queried-marker">
          <div class="marker-pin-head" style="background: ${cfg.hex}; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4)">📍</div>
          <div class="marker-tag" style="background: #ffffff; border: 2px solid ${cfg.hex}; color: #0f172a">
            <span class="ward-title">${queriedLocation.location_name || 'Checked Location'}</span>
            <span class="ward-score" style="color: ${cfg.hex}">${queriedLocation.danger_factor} / 100</span>
          </div>
        </div>
      `,
      iconSize: [190, 40],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([lat, lng], { icon: queriedIcon, zIndexOffset: 1000 });
    
    const safeZoneHtml = queriedLocation.nearest_safe_zone ? `
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 11px;">
        <div style="font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 4px;">
          <span>🛡️ Nearest Safe Zone:</span>
        </div>
        <div style="color: #2563eb; font-weight: 800; margin-top: 2px;">${queriedLocation.nearest_safe_zone.name}</div>
        <div style="color: #64748b; font-size: 10px;">${queriedLocation.nearest_safe_zone.distance_km} km ${queriedLocation.nearest_safe_zone.direction || ''} • Capacity: ${queriedLocation.nearest_safe_zone.capacity || 'N/A'}</div>
      </div>
    ` : '';

    const popupHtml = `
      <div style="background: #ffffff; color: #0f172a; padding: 12px; border-radius: 10px; border: 2px solid ${cfg.hex}; font-family: ui-sans-serif, system-ui, sans-serif; min-width: 220px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.18);">
        <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span>📍 ${queriedLocation.location_name || 'Location Hazard Check'}</span>
          <span style="background: ${cfg.hex}; color: #ffffff; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase;">${queriedLocation.risk_level}</span>
        </div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
          Lat: <strong>${lat.toFixed(4)}°</strong> • Lng: <strong>${lng.toFixed(4)}°</strong>
        </div>
        <div style="background: #f8fafc; padding: 8px; border-radius: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e2e8f0;">
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700;">Landslide Risk Score</div>
            <div style="font-size: 18px; font-weight: 900; color: ${cfg.hex};">${queriedLocation.danger_factor} <span style="font-size: 11px; font-weight: 500; color: #94a3b8;">/ 100</span></div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700;">Safety Index</div>
            <div style="font-size: 16px; font-weight: 800; color: #059669;">${queriedLocation.safety_factor}%</div>
          </div>
        </div>
        ${safeZoneHtml}
      </div>
    `;

    marker.bindPopup(popupHtml, {
      className: 'custom-map-click-popup',
      closeButton: true,
      offset: [0, -15]
    });

    queriedLayerGroupRef.current.addLayer(marker);

    // Open popup immediately on queried marker
    setTimeout(() => {
      try {
        marker.openPopup();
      } catch (e) {}
    }, 300);

    const bounds = L.latLngBounds([[lat, lng]]);

    if (queriedLocation.nearest_safe_zone && queriedLocation.nearest_safe_zone.latitude && queriedLocation.nearest_safe_zone.longitude) {
      const sz = queriedLocation.nearest_safe_zone;
      const szLat = Number(sz.latitude);
      const szLng = Number(sz.longitude);
      bounds.extend([szLat, szLng]);

      const routeCoords = [[lat, lng], [szLat, szLng]];
      const polyline = L.polyline(routeCoords, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.95,
        dashArray: '6, 6'
      });

      polyline.bindTooltip(
        `🛡️ Evacuation Route: ${queriedLocation.location_name} -> ${sz.name} (${sz.distance_km} km ${sz.direction})`,
        { permanent: true, direction: 'center', className: 'bg-white text-blue-900 font-sans text-[11px] font-bold border border-blue-300 px-2 py-0.5 rounded shadow-md' }
      );

      queriedLayerGroupRef.current.addLayer(polyline);
    }

    try {
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12, animate: true, duration: 1.2 });
      } else {
        map.flyTo([lat, lng], 11, { animate: true, duration: 1.2 });
      }
    } catch (e) {
      try { map.panTo([lat, lng]); } catch (err) {}
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

  }, [queriedLocation, viewMode, isLoading]);

  // 6. Render Safe Zone Evacuation Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !safeZonesLayerGroupRef.current) return;

    safeZonesLayerGroupRef.current.clearLayers();

    if (showSafeZones && safeZones.length > 0) {
      safeZones.forEach((sz) => {
        if (!sz || !sz.latitude || !sz.longitude) return;

        const szIcon = L.divIcon({
          className: 'custom-safezone-marker-container',
          html: `
            <div class="custom-safezone-marker">
              <div class="sz-icon">🛡️</div>
              <div class="sz-tag">${sz.name}</div>
            </div>
          `,
          iconSize: [140, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([sz.latitude, sz.longitude], { icon: szIcon });
        marker.bindTooltip(`<b>🛡️ ${sz.name}</b><br/>Capacity: ${sz.capacity?.toLocaleString('en-IN')} persons<br/>Type: ${sz.safe_zone_type || 'Shelter'}`, {
          direction: 'top'
        });
        safeZonesLayerGroupRef.current.addLayer(marker);
      });
    }
  }, [showSafeZones, safeZones, viewMode, isLoading]);

  // 7. Render Ward Risk Markers & Selected Evacuation Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerGroupRef.current) return;

    markersLayerGroupRef.current.clearLayers();

    if (routePolylineRef.current) {
      try { map.removeLayer(routePolylineRef.current); } catch (e) {}
      routePolylineRef.current = null;
    }

    filteredWards.forEach((ward) => {
      if (!ward || !ward.latitude || !ward.longitude) return;

      const isSelected = selectedWard && (selectedWard.id === ward.id || selectedWard.rawId === ward.rawId);
      const wardLvlUpper = (ward.riskLevel || 'SAFE').toUpperCase();
      const isCritical = wardLvlUpper === 'CRITICAL';
      const cfg = SEVERITY_LEVELS[wardLvlUpper] || SEVERITY_LEVELS.SAFE;

      const customIcon = L.divIcon({
        className: 'custom-ward-marker-container',
        html: `
          <div class="custom-ward-marker ${isCritical ? 'is-critical' : ''} ${isSelected ? 'is-selected' : ''}">
            <div class="marker-dot" style="background: ${cfg.hex}; border: 2px solid ${isSelected ? '#2563eb' : '#ffffff'}; transform: ${isSelected ? 'scale(1.3)' : 'scale(1)'}"></div>
            <div class="marker-tag" style="background: #ffffff; border: 1.5px solid ${isSelected ? '#2563eb' : cfg.hex}; color: #0f172a; font-weight: 700">
              <span class="ward-title">${ward.name}</span>
              <span class="ward-score" style="color: ${cfg.hex}">${ward.riskScore}</span>
            </div>
          </div>
        `,
        iconSize: [160, 30],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([ward.latitude, ward.longitude], { icon: customIcon });
      
      marker.on('click', () => {
        if (typeof onSelectWard === 'function') {
          onSelectWard(ward);
        }
      });

      markersLayerGroupRef.current.addLayer(marker);
    });

    if (selectedWard && selectedWard.latitude && selectedWard.longitude) {
      let targetSz = null;
      if (selectedWard.nearestSafeZone && selectedWard.nearestSafeZone.latitude) {
        targetSz = selectedWard.nearestSafeZone;
      } else if (safeZones.length > 0) {
        targetSz = safeZones[0];
      }

      if (targetSz && targetSz.latitude && targetSz.longitude) {
        const routeCoords = [
          [selectedWard.latitude, selectedWard.longitude],
          [targetSz.latitude, targetSz.longitude]
        ];

        routePolylineRef.current = L.polyline(routeCoords, {
          color: '#10b981',
          weight: 4,
          opacity: 0.9,
          dashArray: '8, 8'
        }).addTo(map);

        routePolylineRef.current.bindTooltip(
          `🛡️ Evacuation Route: ${selectedWard.name} -> ${targetSz.name} (${selectedWard.nearestSafeZone?.distance_km || 1.2} km)`,
          { permanent: true, direction: 'center', className: 'bg-white text-emerald-900 text-[11px] font-bold border border-emerald-300 px-2 py-0.5 rounded shadow-md' }
        );
      }
    }
  }, [filteredWards, selectedWard, safeZones, onSelectWard, viewMode, isLoading]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 relative overflow-hidden rounded-xl border border-slate-200/90 shadow-2xs">
      {/* 100% Light Theme Map Control Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        {/* Left: View Mode Toggles & Search */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200" role="group" aria-label="View mode selection">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'map' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>GIS Uttarakhand Map</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Matrix Grid ({filteredWards.length})</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Priority List</span>
            </button>
          </div>

          {/* Search Ward Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter ward or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 px-3 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white w-44 sm:w-60 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Layer Toggles & Demo Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDemoSpikeClick}
            disabled={isSimulating}
            title="Inject simulated torrential rainfall to trigger risk escalation & live WhatsApp/SMS alert"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs border border-amber-400 shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 text-slate-950 ${isSimulating ? 'animate-bounce' : ''}`} />
            <span>{isSimulating ? 'Injecting Spike...' : '⚡ Demo Spike Test'}</span>
          </button>

          {viewMode === 'map' && (
            <>
              {/* Base Layer Switcher (OSM vs Topo) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setBaseTileType('topo')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    baseTileType === 'topo' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="OpenTopoMap: High resolution elevation contours & terrain"
                >
                  Topo / Contours
                </button>
                <button
                  onClick={() => setBaseTileType('osm')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    baseTileType === 'osm' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="OpenStreetMap: Standard roads view"
                >
                  Standard Roads
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-mono hidden lg:inline">GIS Layers:</span>

              <button
                onClick={() => setShowDistricts(!showDistricts)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                  showDistricts ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                Districts
              </button>

              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                  showHeatmap ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                Risk Heatmap
              </button>

              <button
                onClick={() => setShowRivers(!showRivers)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                  showRivers ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                Rivers
              </button>

              <button
                onClick={() => setShowSafeZones(!showSafeZones)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                  showSafeZones ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                🛡️ Safe Zones ({safeZones.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Canvas / Grid / List Container */}
      <div className="flex-1 relative overflow-auto p-2 sm:p-4 bg-slate-50">

        {/* Operational Error State Banner */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 p-3.5 rounded-lg flex items-center justify-between text-xs text-red-800 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Could not reach ward telemetry server — retrying in 30s ({error})</span>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold transition-all shadow-2xs"
              >
                Retry Now
              </button>
            )}
          </div>
        )}

        {/* Offline Tile Error Notice */}
        {tileError && viewMode === 'map' && (
          <div className="absolute top-6 left-6 z-20 bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900 flex items-center gap-2 shadow-md max-w-md animate-in fade-in">
            <Compass className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
            <span>Map Tile Advisory: Remote base tiles loading slowly — vector markers & GIS layers remain fully operational.</span>
          </div>
        )}

        {/* Loading Overlay (Floats over map without unmounting Leaflet DOM container) */}
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-auto rounded-lg">
            <div className="text-center space-y-3 p-5 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
              <RefreshCw className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-800 tracking-tight">Calculating Landslide & Flood Hazard...</p>
              <p className="text-[10px] text-slate-500 font-mono">Running XGBoost Terrain & Weather Matrix</p>
            </div>
          </div>
        )}

        {/* MODE 1: LEAFLET GIS MAP */}
        {viewMode === 'map' && (
          <div className="w-full h-full min-h-[580px] bg-slate-200 border border-slate-300 rounded-lg relative overflow-hidden shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full min-h-[580px] z-0" />

            {/* Light Theme Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-10 bg-white/95 border border-slate-200 p-3.5 rounded-xl text-xs shadow-lg backdrop-blur-sm space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block border-b border-slate-100 pb-1 font-bold font-mono">
                Uttarakhand Hazard Index Legend
              </span>
              <div className="flex flex-wrap items-center gap-3.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-red-700 font-extrabold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                  <span>CRITICAL (≥82)</span>
                </div>
                <div className="flex items-center gap-1.5 text-orange-700 font-extrabold">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span>WARNING (60-81)</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700 font-extrabold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>WATCH (35-59)</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>SAFE (&lt;35)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: MATRIX GRID VIEW (Light Theme Cards) */}
        {!isLoading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredWards.map((ward) => {
              const isSelected = selectedWard && (selectedWard.id === ward.id || selectedWard.rawId === ward.rawId);

              return (
                <div
                  key={ward.id || ward.rawId}
                  onClick={() => onSelectWard(ward)}
                  className={`rounded-xl p-4 border transition-all cursor-pointer hover-card-lift ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-500/30 shadow-md'
                      : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">{ward.id} • {ward.district} District</span>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">{ward.name}</h3>
                    </div>
                    {getSeverityBadge(ward.riskLevel)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans font-medium block">72h Rain</span>
                      <span className="font-extrabold text-blue-700 tabular-nums">{ward.sensors?.rain72h || ward.latest_reading?.rainfall_72h_mm || 0} mm</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans font-medium block">Soil Moisture</span>
                      <span className={`font-extrabold tabular-nums ${
                        (ward.sensors?.soilMoisture || ward.latest_reading?.soil_moisture_pct || 0) > 80 ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {ward.sensors?.soilMoisture || ward.latest_reading?.soil_moisture_pct || 0}% VWC
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans font-medium block">Slope Angle</span>
                      <span className="text-slate-800 font-bold tabular-nums">{ward.slopeAngle || 35}°</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans font-medium block">Hazard Score</span>
                      <span className="font-black text-slate-900 tabular-nums">{ward.riskScore}/100</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-medium">
                    <span>Pop: {ward.population?.toLocaleString('en-IN')}</span>
                    <span className="text-blue-600 font-bold flex items-center gap-1 hover:underline">
                      Inspect <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODE 3: PRIORITY LIST TABLE (Light Theme Table) */}
        {!isLoading && viewMode === 'table' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-mono">
                  <tr>
                    <th className="p-3">SEVERITY</th>
                    <th className="p-3">WARD NAME</th>
                    <th className="p-3">DISTRICT</th>
                    <th className="p-3 text-right">72H RAIN</th>
                    <th className="p-3 text-right">SOIL MOISTURE</th>
                    <th className="p-3 text-right">SLOPE ANGLE</th>
                    <th className="p-3 text-right">POPULATION</th>
                    <th className="p-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWards
                    .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
                    .map((ward) => {
                      const isSelected = selectedWard && (selectedWard.id === ward.id || selectedWard.rawId === ward.rawId);

                      return (
                        <tr
                          key={ward.id || ward.rawId}
                          onClick={() => onSelectWard(ward)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/80 font-semibold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3">{getSeverityBadge(ward.riskLevel)}</td>
                          <td className="p-3 font-bold text-slate-900">
                            {ward.name}
                            <span className="block text-[10px] font-mono text-slate-500 font-normal">Safe Zone: {ward.safeZoneName}</span>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">{ward.district}</td>
                          <td className="p-3 text-right font-mono font-bold text-blue-700 tabular-nums">
                            {ward.sensors?.rain72h || ward.latest_reading?.rainfall_72h_mm || 0} mm
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-600 tabular-nums">
                            {ward.sensors?.soilMoisture || ward.latest_reading?.soil_moisture_pct || 0}% VWC
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700 tabular-nums">
                            {ward.slopeAngle || 35}°
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700 tabular-nums">
                            {ward.population?.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectWard(ward);
                              }}
                              className="px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 rounded-md border border-slate-200 text-[11px] font-bold transition-all"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
