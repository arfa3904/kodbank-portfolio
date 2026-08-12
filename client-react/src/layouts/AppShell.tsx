import { Outlet, useLocation } from 'react-router-dom'
import SidebarNav from './SidebarNav'
import BottomTabBar from './BottomTabBar'
import TopBar from './TopBar'
import Kai from '../components/kai/Kai'
import './shell.css'

export default function AppShell() {
  const location = useLocation()
  return (
    <div className="shell">
      <SidebarNav />
      <div className="shell-main">
        <TopBar />
        <main className="shell-content">
          {/* key on pathname so each route re-triggers the enter animation */}
          <div key={location.pathname} className="view-enter shell-view">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomTabBar />
      <Kai />
    </div>
  )
}
