import React, { useState } from 'react';
import { 
  FileText, Download, Filter, Search, CheckCircle2, AlertOctagon, 
  AlertTriangle, Eye, Shield, Radio, MessageSquare, Phone, RefreshCw, ChevronDown, AlertCircle
} from 'lucide-react';
import { SEVERITY_LEVELS } from '../data/severityConfig';

export default function DisseminationLog({ alerts, isLoading, error, onRetry, highContrast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [expandedAlertId, setExpandedAlertId] = useState(null);

  // Filter alerts safely
  const searchLower = (searchTerm || '').trim().toLowerCase();
  const filteredAlerts = (alerts || []).filter((alt) => {
    if (!alt) return false;
    const wardStr = (alt.wardName || '').toLowerCase();
    const idStr = String(alt.id || '').toLowerCase();
    const distStr = (alt.district || '').toLowerCase();
    
    const matchesSearch = !searchLower || wardStr.includes(searchLower) || idStr.includes(searchLower) || distStr.includes(searchLower);
    const matchesSeverity = selectedSeverity === 'ALL' || alt.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'ALL' || alt.status === selectedStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const exportCSV = () => {
    const headers = 'Alert ID,Timestamp,Ward,District,Severity,Trigger Type,Recipients,Status,Message\n';
    const rows = filteredAlerts.map((a) => 
      `"${a.id}","${a.timestamp}","${a.wardName}","${a.district || 'Uttarakhand'}","${a.severity}","${a.triggerType}",${a.recipientsCount},"${a.status}","${(a.messageSummary || '').replace(/"/g, '""')}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SDMA_Dissemination_Audit_Log_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 text-slate-900 p-4 space-y-4 overflow-y-auto font-sans">
      {/* View Header (100% Light Mode) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 p-4 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">
              Alert Dissemination & Audit Log
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Official ledger of emergency alerts transmitted via multi-channel broadcast (WhatsApp, SMS, Sirens)
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Operational Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3.5 rounded-lg flex items-center justify-between text-xs text-red-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Could not reach alert log database — {error}</span>
          </div>
          {onRetry && (
            <button onClick={onRetry} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold transition-all">
              Retry
            </button>
          )}
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 rounded-xl text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alert ID, ward, or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white w-56 sm:w-72 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold">
                ✕
              </button>
            )}
          </div>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="WARNING">Warning Only</option>
            <option value="WATCH">Watch Only</option>
            <option value="SAFE">Safe Only</option>
          </select>
        </div>

        <div className="text-slate-500 font-mono text-xs">
          Showing <span className="text-slate-900 font-black">{filteredAlerts.length}</span> recorded log entries
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700 font-mono">Loading dissemination log from backend server...</p>
        </div>
      )}

      {/* Log Entries Table (Light Mode) */}
      {!isLoading && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-mono">
                <tr>
                  <th className="p-3">ALERT ID & TIMESTAMP</th>
                  <th className="p-3">TARGET WARD</th>
                  <th className="p-3">SEVERITY</th>
                  <th className="p-3">TRIGGER SOURCE</th>
                  <th className="p-3">CHANNELS</th>
                  <th className="p-3 text-right">RECIPIENTS</th>
                  <th className="p-3 text-center">STATUS</th>
                  <th className="p-3 text-center">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500 italic">
                      No alert dissemination records match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alt) => {
                    const cfg = SEVERITY_LEVELS[alt.severity] || SEVERITY_LEVELS.WARNING;
                    const isExpanded = expandedAlertId === alt.id;

                    return (
                      <React.Fragment key={alt.id}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono">
                            <span className="font-bold text-slate-900 block">{alt.id}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{alt.timestamp}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-extrabold text-slate-900 block">{alt.wardName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{alt.wardId}</span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border ${cfg.badgeBg} ${cfg.textColor} ${cfg.borderColor}`}>
                              {alt.severity}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            <span className={alt.triggerType.includes('MANUAL') ? 'text-amber-700 font-bold' : 'text-blue-700 font-bold'}>
                              {alt.triggerType.includes('MANUAL') ? 'MANUAL OFFICIAL' : 'AUTOMATED MONITOR'}
                            </span>
                            <span className="block text-[10px] text-slate-500 truncate max-w-[140px]">{alt.triggeredBy}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {(alt.channels || ['WHATSAPP']).map((c, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-mono font-bold rounded">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900 tabular-nums">
                            {alt.recipientsCount}
                          </td>
                          <td className="p-3 text-center font-mono">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{alt.status}</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setExpandedAlertId(isExpanded ? null : alt.id)}
                              className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
                              title="Toggle details"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Detail Drawer */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80 border-t-0">
                            <td colSpan="8" className="p-4">
                              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 text-xs shadow-xs">
                                <h4 className="font-mono font-bold text-blue-700 uppercase tracking-wider text-[11px]">
                                  Alert Payload & Transmitted Text
                                </h4>
                                <p className="font-mono text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                                  {alt.messageSummary}
                                </p>

                                {alt.deliveryStatus && (
                                  <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-600">
                                    <span className="text-slate-900 font-bold">Delivery Status Detail: </span>
                                    {typeof alt.deliveryStatus === 'object' 
                                      ? `Opted-in: ${alt.deliveryStatus.total_opted_in}, Sent: ${alt.deliveryStatus.sent_count}, Simulated: ${alt.deliveryStatus.simulated_count}`
                                      : String(alt.deliveryStatus)}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
