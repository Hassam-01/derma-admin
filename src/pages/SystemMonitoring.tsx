import { useEffect, useState } from 'react';
import { Activity, Server, Cpu, HardDrive, AlertCircle, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { api } from '../lib/api';

interface SystemMetrics {
  uptimeSeconds: number;
  cpuUtilizationPercent: number;
  memoryTotalMB: number;
  memoryUsedMB: number;
  rssMB: number;
  totalRequests: number;
  totalErrors: number;
  errorRatePercent: number;
  topEndpoints: {
    route: string;
    method: string;
    count: number;
    avgDurationMs: number;
    errorCount: number;
  }[];
}

interface HistoricalData {
  time: string;
  cpu: number;
  ram: number;
}

export default function SystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [history, setHistory] = useState<HistoricalData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveMetrics = async () => {
    try {
      const response = await api.get('/executive/monitoring/metrics');
      const data: SystemMetrics = response.data.data;
      
      setMetrics(data);
      setError(null);

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Update history in real-time between DB flushes
      setHistory((prev) => {
        // Only append if it's a new minute to match the 1-minute DB interval resolution
        const last = prev[prev.length - 1];
        if (last && last.time === timeStr) {
          // Update the current minute's live data
          const updated = [...prev];
          updated[updated.length - 1] = { time: timeStr, cpu: data.cpuUtilizationPercent, ram: data.memoryUsedMB };
          return updated;
        }
        
        const newData = [...prev, { time: timeStr, cpu: data.cpuUtilizationPercent, ram: data.memoryUsedMB }];
        if (newData.length > 60) return newData.slice(newData.length - 60);
        return newData;
      });
    } catch (err) {
      setError('Failed to fetch system metrics. Server might be down.');
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/executive/monitoring/history');
      const historyData: any[] = response.data.data;
      
      const formattedHistory = historyData.map((h) => {
        const date = new Date(h.timestamp);
        return {
          time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
          cpu: h.cpuPercent,
          ram: h.memoryUsedMB,
        };
      });

      setHistory(formattedHistory);
    } catch (e) {
      console.error('Failed to fetch APM history', e);
    }
  };

  useEffect(() => {
    fetchHistory().then(fetchLiveMetrics);
    const interval = setInterval(fetchLiveMetrics, 5000); // Poll live data every 5s
    return () => clearInterval(interval);
  }, []);

  if (!metrics && !error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-slate-500">
          <Activity className="mx-auto mb-4 h-8 w-8 animate-pulse text-indigo-600" />
          <p>Connecting to Server Monitoring...</p>
        </div>
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const isHealthy = !error && metrics && metrics.errorRatePercent < 5;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="h-6 w-6 text-indigo-600" />
          System Health Monitoring
        </h1>
        <p className="text-slate-500">Live metrics and performance monitoring for the DermaLens backend API.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800 font-medium">{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${isHealthy ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                <Server className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">App Status</p>
                <p className={`text-2xl font-bold ${isHealthy ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isHealthy ? 'HEALTHY' : 'DEGRADED'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Uptime</p>
                <p className="text-2xl font-bold text-slate-900">{formatUptime(metrics.uptimeSeconds)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">CPU Load (1m avg)</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.cpuUtilizationPercent.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                <HardDrive className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Memory (Heap Used)</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.memoryUsedMB.toFixed(0)} MB</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live CPU & RAM Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Hardware Utilization (Live)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <RechartsTooltip />
                  <Line yAxisId="left" type="monotone" dataKey="cpu" stroke="#4F46E5" strokeWidth={2} dot={false} name="CPU (%)" isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="ram" stroke="#F59E0B" strokeWidth={2} dot={false} name="RAM (MB)" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Endpoints */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Highest Traffic Endpoints</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-500">
                <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Endpoint</th>
                    <th className="px-4 py-3">Requests</th>
                    <th className="px-4 py-3">Avg Latency</th>
                    <th className="px-4 py-3 rounded-tr-lg">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topEndpoints.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No requests tracked yet.</td>
                    </tr>
                  ) : (
                    metrics.topEndpoints.map((ep, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <span className={`inline-block w-12 text-xs font-bold ${
                            ep.method === 'GET' ? 'text-blue-600' :
                            ep.method === 'POST' ? 'text-emerald-600' :
                            ep.method === 'PUT' ? 'text-amber-600' :
                            ep.method === 'DELETE' ? 'text-red-600' : 'text-slate-600'
                          }`}>{ep.method}</span>
                          {ep.route}
                        </td>
                        <td className="px-4 py-3">{ep.count.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            ep.avgDurationMs < 200 ? 'bg-emerald-100 text-emerald-700' :
                            ep.avgDurationMs < 800 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {ep.avgDurationMs.toFixed(0)} ms
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-medium ${ep.errorCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                          {ep.errorCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex items-center justify-between text-sm border-t border-slate-100 pt-4">
              <span className="text-slate-500">Total Requests Processed</span>
              <span className="font-bold text-slate-900">{metrics.totalRequests.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
