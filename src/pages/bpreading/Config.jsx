import AppLayout from '@/layouts/AppLayout'
import {useNavigate, useParams} from 'react-router-dom'
import {useState, useEffect} from 'react'
import {api} from '@/utils/api'
import {formatDateForInput} from '@/utils/index'
import '@/css/pages/bpreading/config.css'

export default function BPReadingConfig() {
  /* ==========================================================================
  ATTRIBUTES START
  ============================================================================= */
  const navigate = useNavigate()
  const {id} = useParams()
  const isEdit = !!id

  /* ==========================================================================
  STATE START
  ============================================================================= */
  const [state, setState] = useState({
    topNumber: 0,
    bottomNumber: 0,
    heartRate: 0,
    readingDate: formatDateForInput(Date.now()),
    loading: isEdit,
    error: ''
  })

  /* ==========================================================================
  LIFECYCLE METHODS START
  ============================================================================= */
  useEffect(() => {
    if (isEdit) {
      loadReading()
    }
  }, [id])

  async function loadReading() {
    try {
      const readings = await api.listReadings()
      const reading = readings.find(r => r.id === id)
      if (reading) {
        setState(prev => ({
          ...prev,
          topNumber: reading.topNumber,
          bottomNumber: reading.bottomNumber,
          heartRate: reading.heartRate,
          readingDate: formatDateForInput(reading.createdAt),
          loading: false
        }))
      } else {
        navigate('/bpreading')
      }
    } catch (error) {
      console.error('Failed to load reading:', error)
      navigate('/bpreading')
    }
  }

  /* ==========================================================================
  FUNCTIONS START
  ============================================================================= */
  /**
   * Updates form data state
   * @param {string} key - The field key to update
   * @param {any} value - The new value
   */
  function updateState(key, value) {
    setState(prev => ({...prev, [key]: value}))
  }

  /**
   * Handles form submission
   * @param {Event} e - The form submit event
   */
  async function handleSubmit(e) {
    e.preventDefault()
    updateState('error', '')

    const submitData = {
      topNumber: parseInt(state.topNumber, 10),
      bottomNumber: parseInt(state.bottomNumber, 10),
      heartRate: parseInt(state.heartRate, 10),
      createdAt: Number(new Date(state.readingDate))
    }

    try {
      if (isEdit) {
        await api.updateReading(id, submitData)
      } else {
        await api.createReading(submitData)
      }
      navigate('/bpreading')
    } catch (error) {
      updateState('error', error.toString())
    }
  }

  /* ==========================================================================
  VIEW START
  ============================================================================= */
  if (state.loading) {
    return (
      <AppLayout>
        <div className="bpreading-config-view">
          <article>
            <p>Loading...</p>
          </article>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="bpreading-config-view">
        <article>
          <header>
            <h2>{isEdit ? 'Edit' : 'Create'} Blood Pressure Reading</h2>
          </header>

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="topNumber">Top Number</label>
              <input
                id="topNumber"
                type="number"
                placeholder="Top Number"
                value={state.topNumber}
                onChange={e => updateState('topNumber', e.target.value)}
                autoFocus
                required
                data-cy="topNumber-input"
              />
            </div>

            <div>
              <label htmlFor="bottomNumber">Bottom Number</label>
              <input
                id="bottomNumber"
                type="number"
                placeholder="Bottom Number"
                value={state.bottomNumber}
                onChange={e => updateState('bottomNumber', e.target.value)}
                required
                data-cy="bottomNumber-input"
              />
            </div>

            <div>
              <label htmlFor="heartRate">Heart Rate</label>
              <input
                id="heartRate"
                type="number"
                placeholder="Heart Rate"
                value={state.heartRate}
                onChange={e => updateState('heartRate', e.target.value)}
                required
                data-cy="heartRate-input"
              />
            </div>

            <div>
              <label htmlFor="readingDate">Reading Date</label>
              <input
                id="readingDate"
                type="datetime-local"
                value={state.readingDate}
                onChange={e => updateState('readingDate', e.target.value)}
                required
                data-cy="readingDate-input"
              />
            </div>

            {state.error ? <div className="error">{state.error}</div> : null}

            <button
              type="submit"
              data-cy="submit-bpreading-button"
            >
              {isEdit ? 'Update' : 'Create'} Reading
            </button>
          </form>
        </article>
      </div>
    </AppLayout>
  )
}
