import Modal from '@/components/Modal'
import ModalButton from '@/components/ModalButton'
import '@/css/pages/bpreading/list.css'
import AppLayout from '@/layouts/AppLayout'
import {api} from '@/utils/api'
import {formatDate} from '@/utils/index'
import {save} from '@tauri-apps/plugin-dialog'
import {writeTextFile} from '@tauri-apps/plugin-fs'
import {FolderUp, Import, Pencil, SquarePlus, Trash} from 'lucide-react'
import {useEffect, useRef, useState} from 'react'
import {Link} from 'react-router-dom'

export default function BPReadingList() {
  /* ==========================================================================
  ATTRIBUTES START
  ============================================================================= */
  const fileInputRef = useRef(null)

  /* ==========================================================================
  STATE START
  ============================================================================= */
  const [state, setState] = useState({
    bpreadings: [],
    bpreadingIdToDelete: null,
    importError: '',
    importSuccess: '',
    exportError: '',
    exportSuccess: '',
    isImporting: false,
    isExporting: false,
    loading: true
  })

  const columns = [
    {key: 'topNumber', label: 'Top Number'},
    {key: 'bottomNumber', label: 'Bottom Number'},
    {key: 'heartRate', label: 'Heart Rate'},
    {key: 'createdAt', label: 'Created At'}
  ]

  /* ==========================================================================
  LIFECYCLE METHODS START
  ============================================================================= */
  useEffect(() => {
    loadReadings()
  }, [])

  async function loadReadings() {
    try {
      const readings = await api.listReadings()
      updateState('bpreadings', readings)
    } catch (error) {
      console.error('Failed to load readings:', error)
    } finally {
      updateState('loading', false)
    }
  }

  /* ==========================================================================
  FUNCTIONS START
  ============================================================================= */
  /**
   * Updates state with given key-value pair
   * @param {string} key - State key to update
   * @param {any} value - New value for the key
   */
  function updateState(key, value) {
    setState(prevState => ({...prevState, [key]: value}))
  }

  /**
   * Handles export button click - downloads CSV file using Tauri dialog
   */
  const handleExport = async () => {
    updateState('exportError', '')
    updateState('exportSuccess', '')
    updateState('isExporting', true)

    try {
      const csvData = await api.exportReadings()

      // Use Tauri's save dialog to pick the file location
      const filePath = await save({
        defaultPath: `blood-pressure-readings-${new Date().toISOString().split('T')[0]}.csv`,
        filters: [
          {
            name: 'CSV Files',
            extensions: ['csv']
          }
        ]
      })

      if (filePath) {
        // Write the file using Tauri's fs plugin
        await writeTextFile(filePath, csvData)
        updateState(
          'exportSuccess',
          `Successfully exported ${state.bpreadings.length} readings to: ${filePath}`
        )
      }
    } catch (error) {
      console.error('Export failed:', error)
      updateState('exportError', error.toString())
    } finally {
      updateState('isExporting', false)
    }
  }

  /**
   * Handles file input change for CSV import
   * @param {Event} e - File input change event
   */
  const handleImportFile = async e => {
    const file = e.target.files[0]
    if (!file) return

    updateState('importError', '')
    updateState('importSuccess', '')
    updateState('isImporting', true)

    const reader = new FileReader()
    reader.onload = async event => {
      const csvData = event.target.result
      try {
        const count = await api.importReadings(csvData)
        updateState('importSuccess', `Successfully imported ${count} readings.`)
        loadReadings()
      } catch (error) {
        updateState('importError', error.toString())
      } finally {
        updateState('isImporting', false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
    reader.onerror = () => {
      updateState('importError', 'Failed to read file.')
      updateState('isImporting', false)
    }
    reader.readAsText(file)
  }

  /**
   * Handles delete confirmation
   */
  async function handleDelete() {
    if (!state.bpreadingIdToDelete) return

    try {
      await api.deleteReading(state.bpreadingIdToDelete)
      updateState(
        'bpreadings',
        state.bpreadings.filter(r => r.id !== state.bpreadingIdToDelete)
      )
      updateState('bpreadingIdToDelete', null)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  /* ==========================================================================
  VIEW START
  ============================================================================= */
  if (state.loading) {
    return (
      <AppLayout>
        <div className="bpreading-list-view">
          <article>
            <p>Loading...</p>
          </article>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="bpreading-list-view">
        <article>
          <header className="list-header">
            <div className="headings">
              <h2>Blood Pressure Reading List</h2>
            </div>
            <div className="header-actions">
              <button
                onClick={handleExport}
                disabled={!state.bpreadings?.length || state.isExporting}
                className="outline"
                data-cy="export-button"
              >
                <FolderUp />
                <span className="action-text">
                  {state.isExporting ? 'Exporting...' : 'Export'}
                </span>
              </button>
              <label
                className="import-button-label"
                data-cy="import-button"
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportFile}
                  className="hidden-input"
                  ref={fileInputRef}
                  disabled={state.isImporting}
                  data-cy="import-input"
                />
                <span
                  role="button"
                  className="outline"
                >
                  <Import />
                  <span className="action-text">
                    {state.isImporting ? 'Importing...' : 'Import'}
                  </span>
                </span>
              </label>
              <Link
                to="/bpreading/new"
                role="button"
                className="primary"
                data-cy="create-bpreading-button"
              >
                <SquarePlus />
                <span className="action-text">Pressure Reading</span>
              </Link>
            </div>
          </header>

          {state.importError ? (
            <div
              className="import-error"
              data-cy="import-error"
            >
              <strong>Import Error:</strong>
              <pre>{state.importError}</pre>
            </div>
          ) : null}

          {state.importSuccess ? (
            <div
              className="import-success"
              data-cy="import-success"
            >
              {state.importSuccess}
            </div>
          ) : null}

          {state.exportError ? (
            <div
              className="import-error"
              data-cy="export-error"
            >
              <strong>Export Error:</strong>
              <pre>{state.exportError}</pre>
            </div>
          ) : null}

          {state.exportSuccess ? (
            <div
              className="import-success"
              data-cy="export-success"
            >
              {state.exportSuccess}
            </div>
          ) : null}

          <div className="overflow-auto">
            {state.bpreadings?.length ? (
              <table>
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th
                        key={col.key}
                        scope="col"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.bpreadings?.map(item => (
                    <tr key={item.id}>
                      {columns.map(col => (
                        <td key={col.key}>
                          {col.key === 'createdAt'
                            ? item[col.key]
                              ? formatDate(item[col.key])
                              : ''
                            : (item[col.key] ?? '')}
                        </td>
                      ))}
                      <td>
                        <div className="grid">
                          <Link
                            to={`/bpreading/${item.id}/edit`}
                            role="button"
                            className="outline"
                            data-cy="edit-button"
                          >
                            <Pencil />
                          </Link>
                          <ModalButton
                            modalId="delete-bpreading-modal"
                            className="danger"
                            onclick={() =>
                              updateState('bpreadingIdToDelete', item.id)
                            }
                            data-cy="delete-button"
                          >
                            <Trash />
                          </ModalButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <h5>
                  Looks like you haven't added any Blood Pressure Readings yet.
                  Get started by clicking on the Add Pressure Reading button.
                </h5>
              </div>
            )}
          </div>

          {/* =======================================DELETE MODAL====================================== */}
          <Modal
            modalId="delete-bpreading-modal"
            title="Delete BPReading"
            confirmtext="Delete"
            isDeleteModal={true}
            confirmaction={handleDelete}
          >
            <p>
              Are you sure you want to delete this Pressure Reading? This action
              cannot be undone.
            </p>
          </Modal>
        </article>
      </div>
    </AppLayout>
  )
}
