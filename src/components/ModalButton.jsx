import {useModal} from '@/contexts/ModalContext'

export default function ModalButton({modalId, children, onclick, ...props}) {
  /* ==========================================================================
  ATTRIBUTES START
  ============================================================================= */
  const {handleOpen} = useModal()

  /* ==========================================================================
  FUNCTIONS START
  ============================================================================= */
  /**
   * Handles button click - calls optional onclick and opens modal
   */
  const handleClick = () => {
    if (onclick) onclick()
    handleOpen(modalId)
  }

  /* ==========================================================================
  VIEW START
  ============================================================================= */
  return (
    <button
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}
