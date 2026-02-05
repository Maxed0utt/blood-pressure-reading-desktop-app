import AppLayout from '@/layouts/AppLayout'
import {useState, useMemo, useEffect} from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import {Line} from 'react-chartjs-2'
import {api} from '@/utils/api'
import '@/css/pages/dashboard/index.css'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function Dashboard() {
  /* ==========================================================================
  ATTRIBUTES START
  ============================================================================= */
  const periodLabels = {
    weekly: 'Last 7 Days',
    monthly: 'Last 30 Days',
    quarterly: 'Last 90 Days',
    semiAnnual: 'Last 6 Months',
    annual: 'Last Year'
  }

  const periodDurations = {
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
    quarterly: 90 * 24 * 60 * 60 * 1000,
    semiAnnual: 180 * 24 * 60 * 60 * 1000,
    annual: 365 * 24 * 60 * 60 * 1000
  }

  /* ==========================================================================
  STATE START
  ============================================================================= */
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [averages, setAverages] = useState({})
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)

  /* ==========================================================================
  LIFECYCLE METHODS START
  ============================================================================= */
  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const data = await api.getDashboard()
      setAverages(data.averages || {})
      setReadings(data.readings || [])
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  /* ==========================================================================
  FUNCTIONS START
  ============================================================================= */
  /**
   * Format date for chart labels
   * @param {number} timestamp - Unix timestamp
   * @returns {string} - Formatted date string
   */
  function formatChartDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  /* ==========================================================================
  COMPUTED / MEMOIZED VALUES
  ============================================================================= */
  const filteredReadings = useMemo(() => {
    const now = Date.now()
    const cutoff = now - periodDurations[selectedPeriod]
    return readings.filter(r => r.createdAt >= cutoff)
  }, [readings, selectedPeriod])

  const chartData = useMemo(() => {
    const labels = filteredReadings.map(r => formatChartDate(r.createdAt))
    return {
      labels,
      datasets: [
        {
          label: 'Systolic',
          data: filteredReadings.map(r => r.topNumber),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          tension: 0.3
        },
        {
          label: 'Diastolic',
          data: filteredReadings.map(r => r.bottomNumber),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.3
        },
        {
          label: 'Heart Rate',
          data: filteredReadings.map(r => r.heartRate),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          tension: 0.3
        }
      ]
    }
  }, [filteredReadings])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        min: 40,
        max: 200,
        title: {
          display: true,
          text: 'Value'
        }
      }
    }
  }

  /* ==========================================================================
  VIEW START
  ============================================================================= */
  if (loading) {
    return (
      <AppLayout>
        <section className="dashboard-container">
          <p>Loading...</p>
        </section>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <section className="dashboard-container">
        <section className="stats-section">
          <h4>Blood Pressure Averages</h4>
          <div
            className="stats-cards"
            data-cy="stats-cards"
          >
            {Object.entries(periodLabels).map(([period, label]) => {
              const avg = averages[period]
              return (
                <button
                  key={period}
                  className={`stat-card ${
                    selectedPeriod === period ? 'active' : ''
                  }`}
                  onClick={() => setSelectedPeriod(period)}
                  data-cy={`stat-card-${period}`}
                >
                  <span className="stat-label">{label}</span>
                  {avg ? (
                    <div className="stat-values">
                      <span className="stat-bp">
                        {avg.topNumber}/{avg.bottomNumber}
                      </span>
                      <span className="stat-hr">{avg.heartRate} bpm</span>
                      <span className="stat-count">{avg.count} readings</span>
                    </div>
                  ) : (
                    <span className="stat-empty">No readings</span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <section className="chart-section">
          <h4>Blood Pressure Trends ({periodLabels[selectedPeriod]})</h4>
          <div
            className="chart-container"
            data-cy="bp-chart"
          >
            {filteredReadings.length > 0 ? (
              <Line
                data={chartData}
                options={chartOptions}
              />
            ) : (
              <div className="chart-empty">
                <p>No readings available for this period</p>
              </div>
            )}
          </div>
        </section>
      </section>
    </AppLayout>
  )
}
