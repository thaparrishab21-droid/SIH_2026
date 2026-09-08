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

  // Filter wards by severity & search
  const filteredWards = (wards || []).filter((w) => {
    const matchesFilter = activeFilter === 'ALL' || w.riskLevel === activeFilter;
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (w.id && w.id.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getSeverityBadge = (level) => {
    const cfg = SEVERITY_LEVELS[level] || SEVERITY_LEVELS.SAFE;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide border ${cfg.badgeBg} ${cfg.textColor} ${cfg.borderColor}`}>
        {level === 'CRITICAL' && <AlertOctagon className="w-3 h-3 text-red-400 animate-pulse" />}
        {level === 'WARNING' && <AlertTriangle className="w-3 h-3 text-orange-400" />}
        {level === 'WATCH' && <Eye className="w-3 h-3 text-amber-400" />}
        {level === 'SAFE' && <Shield className="w-3 h-3 text-emerald-400" />}
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
    } finally {
      setIsSimulating(false);
    }
  };

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

      // Map Click Event Listener for Location Risk Check
      map.on('click', (e) => {
        if (onMapClickLocation) {
          onMapClickLocation(e.latlng.lat, e.latlng.lng);
        }
      });

      mapInstanceRef.current = map;

      // Invalidate size shortly after creation to handle settled container dimensions
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    }

    return () => {
      // Clean up map instance on unmount or mode switch
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode, onMapClickLocation, isLoading]);


  // 2. Base Tile Layer Handler (OSM vs OpenTopoMap Topo Contours)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = (baseTileType === 'topo' || showContours)
      ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileOptions = {
      maxZoom: 17,
      subdomains: 'abc'
    };

    const newTileLayer = L.tileLayer(tileUrl, tileOptions);

    newTileLayer.on('tileerror', () => {
      setTileError(true);
    });
    newTileLayer.on('load', () => {
      setTileError(false);
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [baseTileType, showContours, viewMode, isLoading]);

  // 3. Render District Boundaries GeoJSON Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !districtsLayerRef.current) return;

    districtsLayerRef.current.clearLayers();

    if (showDistricts) {
      const districtsLayer = L.geoJSON(UTTARAKHAND_DISTRICTS_GEOJSON, {
        style: {
          color: '#38bdf8',
          weight: 1.5,
          opacity: 0.65,
          fillColor: '#0f172a',
          fillOpacity: 0.12,
          dashArray: '4, 4'
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindTooltip(`${feature.properties.name} District`, {
              permanent: false,
              direction: 'center',
              className: 'bg-slate-900 text-cyan-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-cyan-800'
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
              className: 'bg-slate-950 text-sky-300 font-mono text-[10px] px-2 py-1 rounded border border-sky-800'
            });
          }
        }
      });
      riversLayerRef.current.addLayer(riversLayer);
    }
  }, [showRivers, viewMode, isLoading]);

  // 5. Render Risk Heatmap Layer (leaflet.heat)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (showHeatmap) {
      const heatPoints = filteredWards
        .filter(w => w.latitude && w.longitude)
        .map(w => [
          w.latitude,
          w.longitude,
          Math.max(0.3, (w.riskScore || 20) / 100.0)
        ]);

      // If user queried a location, include it on the same heatmap
      if (queriedLocation && queriedLocation.latitude && queriedLocation.longitude) {
        heatPoints.push([
          queriedLocation.latitude,
          queriedLocation.longitude,
          Math.max(0.35, (queriedLocation.danger_factor || 40) / 100.0)
        ]);
      }

      if (heatPoints.length > 0 && typeof L.heatLayer === 'function') {
        heatLayerRef.current = L.heatLayer(heatPoints, {
          radius: 40,
          blur: 25,
          maxZoom: 12,
          gradient: {
            0.2: '#10b981',
            0.45: '#f59e0b',
            0.7: '#ea580c',
            0.95: '#ef4444'
          }
        }).addTo(map);
      }
    }
  }, [showHeatmap, filteredWards, queriedLocation, viewMode, isLoading]);

  // 5b. Render User-Queried Location Distinct Marker & Fly To
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !queriedLayerGroupRef.current) return;

    queriedLayerGroupRef.current.clearLayers();

    if (!queriedLocation || !queriedLocation.latitude || !queriedLocation.longitude) return;

    const lat = queriedLocation.latitude;
    const lng = queriedLocation.longitude;
    const cfg = SEVERITY_LEVELS[queriedLocation.risk_level] || SEVERITY_LEVELS.SAFE;

    const queriedIcon = L.divIcon({
      className: 'custom-queried-location-marker-container',
      html: `
        <div class="custom-queried-marker">
          <div class="marker-pin-head" style="background: ${cfg.hex}">📍</div>
          <div class="marker-tag" style="background: #0f172a; border: 2px solid ${cfg.hex}; color: #f8fafc">
            <span class="ward-title">${queriedLocation.location_name || 'Checked Location'}</span>
            <span class="ward-score" style="color: ${cfg.hex}">${queriedLocation.danger_factor} / 100</span>
          </div>
        </div>
      `,
      iconSize: [180, 36],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([lat, lng], { icon: queriedIcon });
    marker.bindTooltip(
      `<b>📍 ${queriedLocation.location_name}</b><br/>Danger Factor: ${queriedLocation.danger_factor}/100<br/>Risk Level: ${queriedLocation.risk_level}<br/>${queriedLocation.is_estimated ? '⚠️ Estimated Point' : '📡 Station Coverage'}`,
      { direction: 'top' }
    );

    queriedLayerGroupRef.current.addLayer(marker);

    // Center & pan map smoothly to queried location
    map.flyTo([lat, lng], 11, { animate: true, duration: 1.2 });

    // Evacuation route polyline from queried point to nearest safe zone
    if (queriedLocation.nearest_safe_zone && queriedLocation.nearest_safe_zone.latitude && queriedLocation.nearest_safe_zone.longitude) {
      const sz = queriedLocation.nearest_safe_zone;
      const routeCoords = [[lat, lng], [sz.latitude, sz.longitude]];
      const polyline = L.polyline(routeCoords, {
        color: '#38bdf8',
        weight: 3.5,
        opacity: 0.95,
        dashArray: '6, 6'
      });

      polyline.bindTooltip(
        `🛡️ Evacuation Route: ${queriedLocation.location_name} -> ${sz.name} (${sz.distance_km} km ${sz.direction})`,
        { permanent: true, direction: 'center', className: 'bg-slate-950 text-cyan-200 font-mono text-[10px] border border-cyan-500 px-2 py-0.5 rounded shadow-xl' }
      );

      queriedLayerGroupRef.current.addLayer(polyline);
    }
  }, [queriedLocation, viewMode, isLoading]);


  // 6. Render Safe Zone Evacuation Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !safeZonesLayerGroupRef.current) return;

    safeZonesLayerGroupRef.current.clearLayers();

    if (showSafeZones && safeZones.length > 0) {
      safeZones.forEach((sz) => {
        if (!sz.latitude || !sz.longitude) return;

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
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    filteredWards.forEach((ward) => {
      if (!ward.latitude || !ward.longitude) return;

      const isSelected = selectedWard && (selectedWard.id === ward.id || selectedWard.rawId === ward.rawId);
      const isCritical = ward.riskLevel === 'CRITICAL';
      const cfg = SEVERITY_LEVELS[ward.riskLevel] || SEVERITY_LEVELS.SAFE;

      const customIcon = L.divIcon({
        className: 'custom-ward-marker-container',
        html: `
          <div class="custom-ward-marker ${isCritical ? 'is-critical' : ''} ${isSelected ? 'is-selected' : ''}">
            <div class="marker-dot" style="background: ${cfg.hex}; border: 2px solid ${isSelected ? '#38bdf8' : '#0f172a'}; transform: ${isSelected ? 'scale(1.3)' : 'scale(1)'}"></div>
            <div class="marker-tag" style="background: #0f172a; border: 1px solid ${isSelected ? '#38bdf8' : cfg.hex}; color: #f8fafc">
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
        onSelectWard(ward);
      });

      markersLayerGroupRef.current.addLayer(marker);
    });

    // If a ward is selected, fly map to its location & draw evacuation polyline route to nearest safe zone
    if (selectedWard && selectedWard.latitude && selectedWard.longitude) {
      // Find matching safe zone coordinates
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
          weight: 3.5,
          opacity: 0.9,
          dashArray: '8, 8'
        }).addTo(map);

        routePolylineRef.current.bindTooltip(
          `🛡️ Evacuation Route: ${selectedWard.name} -> ${targetSz.name} (${selectedWard.nearestSafeZone?.distance_km || 1.2} km)`,
          { permanent: true, direction: 'center', className: 'bg-emerald-950 text-emerald-200 text-[10px] font-mono border border-emerald-600 px-2 py-0.5 rounded shadow-xl' }
        );
      }
    }
  }, [filteredWards, selectedWard, safeZones, onSelectWard, viewMode, isLoading]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0b1120] relative overflow-hidden">
      {/* Top Map Control Bar */}
      <div className="bg-[#161f33] border-b border-[#26354f] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        {/* Left: View Mode Toggles & Search */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800" role="group" aria-label="View mode selection">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${
                viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>GIS Uttarakhand Map</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Matrix Grid ({filteredWards.length})</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Priority List</span>
            </button>
          </div>

          {/* Search Ward */}
          <input
            type="text"
            placeholder="Filter by ward / district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 px-3 py-1 rounded text-xs focus:outline-none focus:border-blue-500 w-44 sm:w-60"
          />
        </div>

        {/* Right: Layer Toggles & Demo Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Demo Rainfall Spike Injection Button */}
          <button
            onClick={handleDemoSpikeClick}
            disabled={isSimulating}
            title="Inject simulated torrential rainfall to trigger risk escalation & live WhatsApp/SMS alert"
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs border border-amber-300 shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 text-slate-950 ${isSimulating ? 'animate-bounce' : ''}`} />
            <span>{isSimulating ? 'Injecting Spike...' : '⚡ Demo Spike Test'}</span>
          </button>

          {viewMode === 'map' && (
            <>
              {/* Base Layer Switcher (OSM vs Topo) */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800">
                <button
                  onClick={() => setBaseTileType('topo')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    baseTileType === 'topo' ? 'bg-cyan-800 text-cyan-100' : 'text-slate-400 hover:text-white'
                  }`}
                  title="OpenTopoMap: High resolution elevation contours & terrain"
                >
                  Topo / Contours
                </button>
                <button
                  onClick={() => setBaseTileType('osm')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    baseTileType === 'osm' ? 'bg-blue-800 text-blue-100' : 'text-slate-400 hover:text-white'
                  }`}
                  title="OpenStreetMap: Roads & labels view"
                >
                  Standard Roads
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-mono hidden lg:inline">GIS Layers:</span>

              <button
                onClick={() => setShowDistricts(!showDistricts)}
                className={`px-2 py-1 rounded border text-[11px] font-mono transition-colors ${
                  showDistricts ? 'bg-slate-800 text-sky-300 border-sky-700/60' : 'bg-slate-900/60 text-slate-500 border-slate-800'
                }`}
              >
                Districts
              </button>

              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-2 py-1 rounded border text-[11px] font-mono transition-colors ${
                  showHeatmap ? 'bg-slate-800 text-amber-300 border-amber-700/60' : 'bg-slate-900/60 text-slate-500 border-slate-800'
                }`}
              >
                Risk Heatmap
              </button>

              <button
                onClick={() => setShowRivers(!showRivers)}
                className={`px-2 py-1 rounded border text-[11px] font-mono transition-colors ${
                  showRivers ? 'bg-slate-800 text-blue-300 border-blue-700/60' : 'bg-slate-900/60 text-slate-500 border-slate-800'
                }`}
              >
                Rivers
              </button>

              <button
                onClick={() => setShowSafeZones(!showSafeZones)}
                className={`px-2 py-1 rounded border text-[11px] font-mono transition-colors ${
                  showSafeZones ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' : 'bg-slate-900/60 text-slate-500 border-slate-800'
                }`}
              >
                🛡️ Safe Zones ({safeZones.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Canvas / Grid / List Container */}
      <div className="flex-1 relative overflow-auto p-2 sm:p-4 bg-[#0b1120]">

        {/* Operational Error State Banner */}
        {error && (
          <div className="mb-4 bg-red-950/90 border border-red-700/80 p-3 rounded-lg flex items-center justify-between text-xs text-red-200 shadow-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Could not reach ward telemetry server — retrying in 30s ({error})</span>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-2.5 py-1 bg-red-900 hover:bg-red-800 text-white rounded border border-red-600 text-xs font-semibold transition-colors"
              >
                Retry Now
              </button>
            )}
          </div>
        )}

        {/* Offline Tile Error Notice */}
        {tileError && viewMode === 'map' && (
          <div className="absolute top-6 left-6 z-20 bg-amber-950/90 border border-amber-700 p-2.5 rounded text-xs text-amber-200 flex items-center gap-2 shadow-xl max-w-md">
            <Compass className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
            <span>Map Tile Advisory: Remote base tiles loading slowly — vector ward markers & GIS layers remain fully operational.</span>
          </div>
        )}

        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-[#0d1424] border border-[#26354f] rounded-lg">
            <div className="text-center space-y-3 p-6">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-sm font-mono text-slate-300">Synchronizing GIS Telemetry & Leaflet Map...</p>
              <p className="text-xs text-slate-500 font-mono">Fetching latest sensor readings & ML hazard scores</p>
            </div>
          </div>
        )}

        {/* MODE 1: LEAFLET GIS MAP */}
        {!isLoading && viewMode === 'map' && (
          <div className="w-full h-full min-h-[580px] bg-[#0d1424] border border-[#26354f] rounded-lg relative overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full min-h-[580px] z-0" />

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-10 bg-slate-950/90 border border-slate-800 p-3 rounded-lg text-xs font-mono backdrop-blur-sm space-y-1.5 shadow-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block border-b border-slate-800 pb-1 font-sans">
                Uttarakhand Landslide & Flood Hazard Index
              </span>
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1 text-red-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  <span>CRITICAL (Score ≥82)</span>
                </div>
                <div className="flex items-center gap-1 text-orange-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span>WARNING (Score 60-81)</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>WATCH (Score 35-59)</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>SAFE (Score &lt;35)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: MATRIX GRID VIEW */}
        {!isLoading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredWards.map((ward) => {
              const isSelected = selectedWard && (selectedWard.id === ward.id || selectedWard.rawId === ward.rawId);

              return (
                <div
                  key={ward.id || ward.rawId}
                  onClick={() => onSelectWard(ward)}
                  className={`rounded-lg p-3.5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500 ring-2 ring-blue-500/40 shadow-lg'
                      : 'bg-[#161f33] border-[#26354f] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">{ward.id} • {ward.district} District</span>
                      <h3 className="text-sm font-bold text-white leading-tight">{ward.name}</h3>
                    </div>
                    {getSeverityBadge(ward.riskLevel)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-2 text-xs font-mono bg-slate-950/60 p-2 rounded border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">72h Rain</span>
                      <span className="font-bold text-cyan-400 tabular-nums">{ward.sensors?.rain72h || ward.latest_reading?.rainfall_72h_mm || 0} mm</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">Soil Saturation</span>
                      <span className={`font-bold tabular-nums ${
                        (ward.sensors?.soilMoisture || ward.latest_reading?.soil_moisture_pct || 0) > 80 ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {ward.sensors?.soilMoisture || ward.latest_reading?.soil_moisture_pct || 0}% VWC
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">Slope Angle</span>
                      <span className="text-slate-300 tabular-nums">{ward.slopeAngle || 35}°</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">Risk Score</span>
                      <span className="font-bold text-slate-200 tabular-nums">{ward.riskScore}/100</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Pop: {ward.population?.toLocaleString('en-IN')}</span>
                    <span className="text-blue-400 font-medium flex items-center gap-1 hover:underline">
                      Inspect Telemetry <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODE 3: PRIORITY LIST TABLE */}
        {!isLoading && viewMode === 'table' && (
          <div className="bg-[#161f33] border border-[#26354f] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono">
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
                <tbody className="divide-y divide-slate-800/80">
                  {filteredWards
                    .sort((a, b) => b.riskScore - a.riskScore)
                    .map((ward) => {
                      const isSelected = selectedWard && (selectedWard.id === ward.id || selectedWard.rawId === ward.rawId);

                      return (
                        <tr
                          key={ward.id || ward.rawId}
                          onClick={() => onSelectWard(ward)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-950/60' : 'hover:bg-slate-900/60'
                          }`}
                        >
                          <td className="p-3">{getSeverityBadge(ward.riskLevel)}</td>
                          <td className="p-3 font-bold text-white">
                            {ward.name}
                            <span className="block text-[10px] font-mono text-slate-400">Safe Zone: {ward.safeZoneName}</span>
                          </td>
                          <td className="p-3 text-slate-300">{ward.district}</td>
                          <td className="p-3 text-right font-mono font-bold text-cyan-400 tabular-nums">
                            {ward.sensors?.rain72h || ward.latest_reading?.rainfall_72h_mm || 0} mm
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-400 tabular-nums">
                            {ward.sensors?.soilMoisture || ward.latest_reading?.soil_moisture_pct || 0}% VWC
                          </td>
                          <td className="p-3 text-right font-mono text-slate-300 tabular-nums">
                            {ward.slopeAngle || 35}°
                          </td>
                          <td className="p-3 text-right font-mono text-slate-300 tabular-nums">
                            {ward.population?.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectWard(ward);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded border border-slate-700 text-[11px] font-medium"
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
