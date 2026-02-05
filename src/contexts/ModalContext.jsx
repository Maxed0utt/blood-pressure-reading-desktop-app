import {createContext, useContext, useEffect, useState} from 'react'
import {getScrollBarWidth} from '@/utils/index'

const ModalContext = createContext({})
const useModal = () => useContext(ModalContext)

const ModalProvider = ({children, ...props}) => {
  const isSSR = typeof window === 'undefined'
  const htmlTag = !isSSR && document.querySelector('html')
  const [openModals, setOpenModals] = useState({})
  const modalAnimationDuration = 400

  // Open modal by ID
  const handleOpen = modalId => {
    if (!modalId) return
    if (htmlTag) {
      setOpenModals(prev => ({...prev, [modalId]: true}))
      htmlTag.classList.add('modal-is-open', 'modal-is-opening')
      setTimeout(() => {
        htmlTag.classList.remove('modal-is-opening')
      }, modalAnimationDuration)
    }
  }

  // Close modal by ID
  const handleClose = modalId => {
    if (!modalId) return
    if (htmlTag) {
      htmlTag.classList.add('modal-is-closing')
      setTimeout(() => {
        setOpenModals(prev => ({...prev, [modalId]: false}))
        htmlTag.classList.remove('modal-is-open', 'modal-is-closing')
      }, modalAnimationDuration)
    }
  }

  // Escape key should close all open modals
  useEffect(() => {
    const handleEscape = event => {
      if (event.key === 'Escape') {
        Object.keys(openModals).forEach(modalId => {
          if (openModals[modalId]) {
            handleClose(modalId)
          }
        })
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [openModals])

  // Set scrollbar width on mount
  useEffect(() => {
    const scrollBarWidth = getScrollBarWidth()
    if (htmlTag) {
      htmlTag.style.setProperty('--pico-scrollbar-width', `${scrollBarWidth}px`)
    }
    return () => {
      if (htmlTag) {
        htmlTag.style.removeProperty('--pico-scrollbar-width')
      }
    }
  }, [])

  const modalIsOpen = modalId => !!openModals[modalId]

  return (
    <ModalContext.Provider
      value={{
        modalIsOpen,
        handleOpen,
        handleClose,
        ...props
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}

export {ModalProvider, useModal}
