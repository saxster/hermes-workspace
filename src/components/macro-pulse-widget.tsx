import { useQuery } from '@tanstack/react-query'
import { GlassCard } from '@/components/ui/glass-card'
import { Activity, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'

interface MacroMetric {
  value: string
  timestamp: number
  confidence: number
}

interface MacroMetricsResponse {
  metrics: Record<string, MacroMetric>
}

export function MacroPulseWidget() {
  const { data, isLoading, error } = useQuery<MacroMetricsResponse>({
    queryKey: ['macro-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/macro-metrics')
      if (!response.ok) {
        throw new Error('Failed to fetch macro metrics')
      }
      return response.json()
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  })

  if (isLoading) {
    return (
      <GlassCard className="p-4 h-full">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-6 w-32 bg-white/10 rounded" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded" />
            ))}
          </div>
        </div>
      </GlassCard>
    )
  }

  const metrics = data?.metrics || {}
  const metricKeys = Object.keys(metrics)

  return (
    <GlassCard className="p-4 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="font-medium text-white/90">Macro Pulse</h3>
        </div>
        <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
          Live India Macro
        </span>
      </div>

      {metricKeys.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {metricKeys.map((key) => {
            const metric = metrics[key]
            return (
              <div
                key={key}
                className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-1"
              >
                <span className="text-[11px] text-white/50 font-medium uppercase">
                  {key}
                </span>
                <span className="text-lg font-semibold text-white/90">
                  {metric.value}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <BarChart3 className="w-10 h-10 text-white/10 mb-2" />
          <p className="text-sm text-white/40">
            No macro data yet. Run the India Macro Monitor skill to populate.
          </p>
        </div>
      )}
      
      {metricKeys.length > 0 && (
        <div className="mt-auto flex items-center justify-between text-[10px] text-white/30">
          <span>Institutional Grade Data</span>
          <span>Updated: {new Date(metrics[metricKeys[0]].timestamp * 1000).toLocaleTimeString()}</span>
        </div>
      )}
    </GlassCard>
  )
}
