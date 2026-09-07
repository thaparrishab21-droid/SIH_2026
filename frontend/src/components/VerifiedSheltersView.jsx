import React, { useState } from 'react';
import { Search, MapPin, Phone, Navigation, Shield, Truck, Info, CheckCircle2, User, ChevronRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom Map Marker Icon
const shelterIcon = new L.DivIcon({
  className: 'custom-shelter-pin',
  html: `<div style="background-color: #1e40af; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🏠</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function VerifiedSheltersView({ onOpenShuttleModal }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [userLocationLoaded, setUserLocationLoaded] = useState(false);

  const sheltersData = [
    {
      id: 1,
      sector: 'SECTOR 4 • NORTH BASIN',
      distance: '0.8 km away',
      status: 'OPEN & SAFE',
      statusType: 'green',
      name: 'Government Model Senior Secondary School',
      address: 'Main Campus Elevated Wing, 100m West of City Water Reservoir Gate',
      freeBeds: 220,
      totalBeds: 1200,
      badges: ['🩺 Doctor On-Site (24/7)', '⚡ Generator Power Active', '🍼 Infant Food & Diapers', '🐾 Pets Permitted in Annex'],
      warden: 'Maj. R. Verma (Civil Defense)',
      phone: '98765-43210',
      lat: 28.6448,
      lng: 77.2167,
      petFriendly: true,
      clinicOnSite: true,
      wheelchair: true,
    },
    {
      id: 2,
      sector: 'CIVIL LINES WEST',
      distance: '1.9 km away',
      status: 'HIGH SURPLUS',
      statusType: 'blue',
      name: 'Indoor Sports Stadium & Community Complex',
      address: 'Gate 3 High Ground Entry, Near Old Secretariat Circle',
      freeBeds: 1840,
      totalBeds: 3500,
      badges: ['🍲 24/7 Hot Kitchen & Packaged Water', '♿ Wheelchair Ramps & Wide Aisles', '🔌 120 Device Charging Plugs', '🅿️ Dry Vehicle Rooftop Parking'],
      warden: 'Smt. Sunita Rao (District Admin)',
      phone: '98765-43211',
      lat: 28.6700,
      lng: 77.2250,
      petFriendly: false,
      clinicOnSite: true,
      wheelchair: true,
    },
    {
      id: 3,
      sector: 'OLD CITY • WARD 8',
      distance: '2.4 km away',
      status: 'ACCEPTING FAMILIES',
      statusType: 'purple',
      name: 'St. Jude Girls High School & Parish Hall',
      address: 'Elevated Stone Plinth Building, St. Jude Compound',
      freeBeds: 410,
      totalBeds: 800,
      badges: ['🚺 Segregated Women & Kids Wing', '🚰 ORS & Reverse Osmosis Filters', '🍼 80 Dry Infant Cots', '🛡️ 24-Hr Police Outpost'],
      warden: 'Sister Maria Teresa (Parish Direct)',
      phone: '98765-43212',
      lat: 28.6500,
      lng: 77.2300,
      petFriendly: true,
      clinicOnSite: false,
      wheelchair: false,
    },
    {
      id: 4,
      sector: 'MODEL TOWN CENTRAL',
      distance: '3.1 km away',
      status: 'OPEN & DRY',
      statusType: 'green',
      name: 'Community Civic Pavilion & Gymnasium',
      address: 'Near Municipal Zonal Office, Upper Ring Road',
      freeBeds: 650,
      totalBeds: 1000,
      badges: ['🛏️ Dry Thermal Blankets Distributed', '🩺 Dialysis Support Van Adjacent', '🚾 Clean Sanitized Washrooms', '📡 Emergency SAT Internet Mesh'],
      warden: 'Inspector K. Sengupta (Municipal Corp)',
      phone: '98765-43213',
      lat: 28.6900,
      lng: 77.1900,
      petFriendly: false,
      clinicOnSite: true,
      wheelchair: true,
    },
  ];

  const filteredShelters = sheltersData.filter((shelter) => {
    // Search query filter
    const matchesSearch =
      !searchQuery ||
      shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelter.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelter.address.toLowerCase().includes(searchQuery.toLowerCase());

    // Pills filter
    if (!matchesSearch) return false;
    if (selectedFilter === 'SURPLUS') return shelter.freeBeds > 500;
    if (selectedFilter === 'PETS') return shelter.petFriendly;
    if (selectedFilter === 'CLINIC') return shelter.clinicOnSite;
    if (selectedFilter === 'WHEELCHAIR') return shelter.wheelchair;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Protocol Header */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
          <span className="font-bold text-slate-900 uppercase font-mono tracking-wider">
            MUNICIPAL VERIFIED EVACUATION PROTOCOL
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="truncate">
            All 12 verified emergency shelters are certified above flood mark, active 24/7 with dry sleeping docks, generator power, infant nutrition, and municipal triage desks.
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-500 font-bold shrink-0">
          ⏱ AUDITED: 12 MINS AGO
        </div>
      </div>

      {/* Operational Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>OPERATIONAL SHELTERS</span>
            <span>🏢</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            12 <span className="text-sm font-semibold text-slate-500">/ 12 ACTIVE</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-slate-900 h-full w-full"></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>SAFE BED CAPACITY</span>
            <span>🛏️</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            4,320 <span className="text-xs font-semibold text-slate-500">AVAILABLE NOW</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-[65%]"></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>NUTRITION SUPPORT</span>
            <span>🍲</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            3 Hot <span className="text-xs font-semibold text-slate-500">MEALS DAILY</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500 font-mono">CLEAN FILTERED DRINKING WATER</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>CIVIL MEDICAL TRIAGE</span>
            <span>🏥</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            100% <span className="text-xs font-semibold text-slate-500">DOCTORS ON SITE</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500 font-mono">EMERGENCY AMBULANCE PARKING</p>
        </div>

      </div>

      {/* Rapid Transit Rescue Banner */}
      <div className="bg-slate-950 text-white rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-slate-800 rounded-lg shrink-0 text-xl">
            🚚
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded">
                RAPID TRANSIT
              </span>
              <h4 className="text-sm sm:text-base font-bold text-white">
                Stranded or can't navigate high water?
              </h4>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-snug">
              City emergency services operate 4x4 high-clearance amphibious rescue transports to shuttle families to the nearest dry shelter. Zero charge.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <a
            href="tel:1077"
            className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <span>Direct Line 1077</span>
          </a>
          <button
            onClick={() => onOpenShuttleModal && onOpenShuttleModal()}
            className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <span>🚑 Request Shuttle</span>
          </button>
        </div>
      </div>

      {/* Search Input & Filter Pills */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by colony, ward, landmark or school name..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => setUserLocationLoaded(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shrink-0"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>{userLocationLoaded ? '📍 Near You (0.8km)' : 'Use My Location'}</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all whitespace-nowrap ${
              selectedFilter === 'ALL'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Shelters ({sheltersData.length})
          </button>

          <button
            onClick={() => setSelectedFilter('SURPLUS')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all whitespace-nowrap ${
              selectedFilter === 'SURPLUS'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Surplus (&gt;100 Beds)
          </button>

          <button
            onClick={() => setSelectedFilter('PETS')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all whitespace-nowrap ${
              selectedFilter === 'PETS'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            🐾 Pet-Friendly
          </button>

          <button
            onClick={() => setSelectedFilter('CLINIC')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all whitespace-nowrap ${
              selectedFilter === 'CLINIC'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            🏥 Clinic On-Site
          </button>

          <button
            onClick={() => setSelectedFilter('WHEELCHAIR')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all whitespace-nowrap ${
              selectedFilter === 'WHEELCHAIR'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            ♿ Wheelchair Safe
          </button>
        </div>
      </div>

      {/* Split View: Left List (2/3) & Right GIS Radar + Checklist (1/3) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Shelters List */}
        <div className="md:col-span-8 space-y-4">
          {filteredShelters.map((shelter) => {
            const pctFree = Math.round((shelter.freeBeds / shelter.totalBeds) * 100);
            return (
              <div key={shelter.id} className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
                
                {/* Sector Header & Status Badge */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-500 uppercase">{shelter.sector}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {shelter.distance}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono ${
                    shelter.statusType === 'green' ? 'bg-emerald-100 text-emerald-800' :
                    shelter.statusType === 'blue' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    🟢 {shelter.status}
                  </span>
                </div>

                {/* Name & Bed count */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {shelter.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {shelter.address}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-base font-black text-slate-900">{shelter.freeBeds}</span>
                    <span className="text-xs text-slate-500 font-normal"> / {shelter.totalBeds} beds free</span>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-900 h-full" style={{ width: `${pctFree}%` }}></div>
                </div>

                {/* Badges Grid */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {shelter.badges.map((badge, idx) => (
                    <span key={idx} className="bg-slate-100 border border-slate-200/80 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md">
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Footer Actions & Warden Contact */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Warden: <strong className="text-slate-900">{shelter.warden}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 font-mono font-bold">
                    <a
                      href={`tel:${shelter.phone}`}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-md text-xs transition-all"
                    >
                      📞 Call {shelter.phone}
                    </a>
                    <a
                      href={`https://maps.google.com/?q=${shelter.lat},${shelter.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-md text-xs transition-all flex items-center gap-1"
                    >
                      <span>▶ Get Directions</span>
                    </a>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Right Column: GIS Radar Map & Instructions */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Shelter GIS Radar */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span>Shelter GIS Radar</span>
              <span className="text-[10px] font-mono text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                REAL-TIME
              </span>
            </div>

            {/* Map Container */}
            <div className="w-full h-[240px] rounded-lg overflow-hidden border border-slate-200 relative">
              <MapContainer 
                center={[28.6550, 77.2150]} 
                zoom={12} 
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {sheltersData.map((s) => (
                  <Marker key={s.id} position={[s.lat, s.lng]} icon={shelterIcon}>
                    <Popup>
                      <div className="p-1 text-xs">
                        <strong className="block text-slate-900">{s.name}</strong>
                        <span className="text-slate-600">{s.freeBeds} beds available</span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>High-water line boundary avoided</span>
              <a href="#full-gis" className="text-blue-700 underline font-bold">Open Full GIS Grid</a>
            </div>
          </div>

          {/* What to Bring to a Shelter */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <span>🧳</span>
              <span>What to Bring to a Shelter</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Do not overload yourself. Pack strictly 3 critical personal essentials in a waterproof zip bag:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-mono text-[11px] font-bold flex items-center justify-center">1</span>
                  <h5 className="font-bold text-slate-900">Identification</h5>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug pl-7">
                  Aadhaar, Govt Voter ID, or clear photos on your mobile phone for check-in registry.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-mono text-[11px] font-bold flex items-center justify-center">2</span>
                  <h5 className="font-bold text-slate-900">Essential Medications</h5>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug pl-7">
                  At least 48 hours of ongoing prescriptions (Insulin, BP, Cardiac) stored in sealed plastic.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-mono text-[11px] font-bold flex items-center justify-center">3</span>
                  <h5 className="font-bold text-slate-900">Special Diet / Infant Supplies</h5>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug pl-7">
                  Baby feeding bottle, powdered formula, or specific hygiene/sanitary pads for instant access.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-[11px] text-blue-900 leading-snug flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <span>
                <strong>All provided free:</strong> Heavy wool blankets, floor pallets, purified water, and cooked meals are supplied at each shelter.
              </span>
            </div>
          </div>

          {/* Offline SMS Directory */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <span>📡</span>
              <span>Offline SMS Directory</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Low phone battery or cell data down? Text your Ward Number to <strong>56161</strong> to receive an immediate reply with the nearest verified dry shelter coordinates and warden phone number via standard SMS.
            </p>
            <div className="bg-slate-100 border border-slate-200 text-center py-2 font-mono text-xs font-bold text-slate-900 rounded">
              SMS: "SHELTER [WARD_NUM]" to 56161
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
