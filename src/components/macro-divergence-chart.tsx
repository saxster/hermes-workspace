import { useQuery } from '@tanstack/react-query'
import { GlassCard } from '@/components/ui/glass-card'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import { AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react'

interface HistoryPoint {
  timestamp: number
  value: number
}

interface NarrativeResponse {
  correlation: number
  status: string
  insight: string
  metric_a: string
  metric_b: string
  error?: string
}

export function MacroDivergenceChart({ metricA, metricB, labelA, labelB }: { 
  metricA: string, 
  metricB: string,
  labelA: string,
  labelB: string
}) {
  // Fetch History for Metric A
  const { data: historyA } = useQuery<{ history: HistoryPoint[] }>({
    queryKey: ['macro-history', metricA],
    queryFn: () => fetch(`/api/macro-history?metric_id=${metricA}&days=30`).then(res => res.json())
  })

  // Fetch History for Metric B
  const { data: historyB } = useQuery<{ history: HistoryPoint[] }>({
    queryKey: ['macro-history', metricB],
    queryFn: () => fetch(`/api/macro-history?metric_id=${metricB}&days=30`).then(res => res.json())
  })

  // Fetch Correlation Narrative
  const { data: narrative, isLoading } = useQuery<NarrativeResponse>({
    queryKey: ['macro-narrative', metricA, metricB],
    queryFn: () => fetch(`/api/macro-narrative?metric_a=${metricA}&metric_b=${metricB}`).then(res => res.json())
  })

  // Merge data for Recharts
  const chartData = useMemo(() => {
    if (!historyA?.history || !historyB?.history) return []
    
    // Map by date
    const map = new Map()
    historyA.history.forEach(p => {
      const date = new Date(p.timestamp * 1000).toLocaleDateString()
      map.set(date, { date, [metricA]: p.value })
    })
    
    historyB.history.forEach(p => {
      const date = new Date(p.timestamp * 1000).toLocaleDateString()
      if (map.has(date)) {
        map.set(date, { ...map.get(date), [metricB]: p.value })
      }
    })
    
    return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [historyA, historyB, metricA, metricB])

  if (isLoading) return <div className="h-64 animate-pulse bg-white/5 rounded-xl" />

  const isDiverging = (narrative?.correlation || 1) < 0.6

  return (
    <GlassCard className="p-5 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="font-semibold text-white/90">Truth-Seeking Correlation</h3>
          <p className="text-xs text-white/40">{labelA} vs {labelB}</p>
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${isDiverging ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
          {narrative?.status || 'Unknown'}
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" hide />
            <YAxis yAxisId="left" hide domain={['auto', 'auto']} />
            <YAxis yAxisId="right" orientation="right" hide domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
              itemStyle={{ fontSize: '10px' }}
            />
            <Line yAxisId="left" type="monotone" dataKey={metricA} stroke="#6366f1" strokeWidth={2} dot={false} name={labelA} />
            <Line yAxisId="right" type="monotone" dataKey={metricB} stroke="#10b981" strokeWidth={2} dot={false} name={labelB} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={`p-3 rounded-lg flex gap-3 ${isDiverging ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
        {isDiverging ? <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" /> : <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />}
        <p className="text-[11px] leading-relaxed text-white/70 italic">
          {narrative?.insight || 'Insufficient data to generate narrative insight.'}
        </p>
      </div>
    </GlassCard>
  )
}

import { useMemo } from 'react'
