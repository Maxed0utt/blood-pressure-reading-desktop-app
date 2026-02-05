import '@/css/layouts/applayout.css'
import {Nav} from '@/components/Nav'
import {ModalProvider} from '@/contexts/ModalContext'
import {ThemeProvider} from '@/contexts/ThemeContext'

export default function AppLayout({children}) {
  return (
    <ThemeProvider>
      <ModalProvider>
        <div id="KxWAX5">
          <Nav />
          <main>{children}</main>
        </div>
      </ModalProvider>
    </ThemeProvider>
  )
}
