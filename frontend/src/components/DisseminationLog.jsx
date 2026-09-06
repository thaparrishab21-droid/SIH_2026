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

  // Filter alerts
  const filteredAlerts = (alerts || []).filter((alt) => {
    const matchesSearch = alt.wardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          alt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (alt.district && alt.district.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSeverity = selectedSeverity === 'ALL' || alt.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'ALL' || alt.status === selectedStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const exportCSV = () => {
    const headers = 'Alert ID,Timestamp,Ward,District,Severity,Trigger Type,Recipients,Status,Message\n';
    const rows = filteredAlerts.map((a) => 
      `"${a.id}","${a.timestamp}","${a.wardName}","${a.district || 'Uttarakhand'}","${a.severity}","${a.triggerType}",${a.recipientsCount},"${a.status}","${a.messageSummary.replace(/"/g, '""')}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SDMA_Dissemination_Audit_Log_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0b1120] text-slate-100 p-4 space-y-4 overflow-y-auto">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161f33] border border-[#26354f] p-4 rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Alert Dissemination & Audit Log
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Official ledger of emergency alerts transmitted via multi-channel broadcast (WhatsApp, SMS, Sirens)
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded border border-slate-700 text-xs font-semibold"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Operational Error State */}
      {error && (
        <div className="bg-red-950/90 border border-red-700/80 p-3 rounded-lg flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Could not reach alert log database — {error}</span>
          </div>
          {onRetry && (
            <button onClick={onRetry} className="px-2.5 py-1 bg-red-900 text-white rounded text-xs">
              Retry
            </button>
          )}
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161f33] border border-[#26354f] p-3 rounded-lg text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search alert ID or ward name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded text-xs focus:outline-none focus:border-blue-500 w-56 sm:w-72"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="WARNING">Warning Only</option>
            <option value="WATCH">Watch Only</option>
            <option value="SAFE">Safe Only</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono text-xs">
          Showing <span className="text-white font-bold">{filteredAlerts.length}</span> recorded log entries
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-8 text-center bg-[#161f33] border border-[#26354f] rounded-lg">
          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" />
          <p className="text-xs font-mono text-slate-400">Loading dissemination log from backend server...</p>
        </div>
      )}

      {/* Log Entries Table */}
      {!isLoading && (
        <div className="bg-[#161f33] border border-[#26354f] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono">
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
              <tbody className="divide-y divide-slate-800/80">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-slate-500 italic">
                      No alert dissemination records match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alt) => {
                    const cfg = SEVERITY_LEVELS[alt.severity] || SEVERITY_LEVELS.WARNING;
                    const isExpanded = expandedAlertId === alt.id;

                    return (
                      <React.Fragment key={alt.id}>
                        <tr className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-3 font-mono">
                            <span className="font-bold text-white block">{alt.id}</span>
                            <span className="text-[10px] text-slate-400">{alt.timestamp}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-200 block">{alt.wardName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{alt.wardId}</span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.badgeBg} ${cfg.textColor} ${cfg.borderColor}`}>
                              {alt.severity}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            <span className={alt.triggerType.includes('MANUAL') ? 'text-amber-400' : 'text-blue-400'}>
                              {alt.triggerType.includes('MANUAL') ? 'MANUAL OFFICIAL' : 'AUTOMATED MONITOR'}
                            </span>
                            <span className="block text-[10px] text-slate-500 truncate max-w-[140px]">{alt.triggeredBy}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {(alt.channels || ['WHATSAPP']).map((c, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-mono rounded">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-200 tabular-nums">
                            {alt.recipientsCount}
                          </td>
                          <td className="p-3 text-center font-mono">
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{alt.status}</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setExpandedAlertId(isExpanded ? null : alt.id)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                              title="Toggle details"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Detail Drawer */}
                        {isExpanded && (
                          <tr className="bg-slate-950/90 border-t-0">
                            <td colSpan="8" className="p-4">
                              <div className="bg-[#161f33] border border-[#26354f] p-3.5 rounded-lg space-y-2 text-xs">
                                <h4 className="font-mono font-bold text-blue-300 uppercase tracking-wider text-[11px]">
                                  Alert Payload & Transmitted Text
                                </h4>
                                <p className="font-mono text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800">
                                  {alt.messageSummary}
                                </p>

                                {alt.deliveryStatus && (
                                  <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                                    <span className="text-slate-300 font-bold">Delivery Status Detail: </span>
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
