import {useModal} from '@/contexts/ModalContext'
import '@/css/components/modal.css'

export default function Modal({
  modalId,
  title,
  canceltext,
  confirmtext,
  confirmaction,
  children,
  isDeleteModal = false,
  ...rest
}) {
  /* ==========================================================================
  ATTRIBUTES START
  ============================================================================= */
  const {modalIsOpen, handleClose} = useModal()

  // Show modal only if its ID is open
  const isOpen =
    typeof modalIsOpen === 'function'
      ? modalIsOpen(modalId)
      : // if it's an object
        modalIsOpen?.[modalId]

  /* ==========================================================================
  FUNCTIONS START
  ============================================================================= */
  /**
   * Handles click on overlay to close modal
   * @param {Event} event - Click event
   */
  const handleClickOverlay = event => {
    if (event.target === event.currentTarget) {
      handleClose(modalId)
    }
  }

  /**
   * Handles confirm button click
   * @param {Event} event - Click event
   */
  function confirmModal(event) {
    event.preventDefault()
    if (confirmaction) {
      confirmaction(event)
    }
    handleClose(modalId)
  }

  /* ==========================================================================
  VIEW START
  ============================================================================= */
  if (!isOpen) return null

  return (
    <dialog
      className="modal"
      onClick={handleClickOverlay}
      open
      {...rest}
    >
      <article>
        <header className="modal-header">
          <h3>{title || ''}</h3>
          <button
            aria-label="Close"
            rel="prev"
            onClick={() => handleClose(modalId)}
          ></button>
        </header>
        {children}
        <footer>
          <button
            className="secondary"
            onClick={() => handleClose(modalId)}
          >
            {canceltext || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={confirmModal}
            className={isDeleteModal ? 'danger' : ''}
            data-cy={isDeleteModal ? 'confirm-delete' : 'confirm-modal-button'}
          >
            {confirmtext || 'Confirm'}
          </button>
        </footer>
      </article>
    </dialog>
  )
}
