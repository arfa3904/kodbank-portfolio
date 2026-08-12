import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

export default function SidebarNav() {
  return (
    <aside className="shell-sidebar">
      <div className="shell-brand">
        <span className="shell-brand-icon">🏦</span>
        <span className="shell-brand-name">KODBANK</span>
      </div>
      <nav className="shell-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `shell-nav-link ${isActive ? 'is-active' : ''}`
            }
          >
            <span className="shell-nav-icon">{item.icon}</span>
            <span className="shell-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="shell-sidebar-foot">
        <div className="shell-secure">🔒 Secure banking</div>
      </div>
    </aside>
  )
}
