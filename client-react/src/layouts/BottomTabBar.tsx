import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

export default function BottomTabBar() {
  return (
    <nav className="shell-tabbar">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `shell-tab ${isActive ? 'is-active' : ''}`
          }
        >
          <span className="shell-tab-icon">{item.icon}</span>
          <span className="shell-tab-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
