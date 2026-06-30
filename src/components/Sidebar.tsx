import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Tableau de bord', icon: '🏠', end: true },
  { to: '/profil', label: 'Profil', icon: '👤' },
  { to: '/nutrition', label: 'Nutrition', icon: '🍽️' },
  { to: '/recettes', label: 'Recettes', icon: '📖' },
  { to: '/programme', label: 'Programme', icon: '🏋️' },
  { to: '/activites', label: 'Activités', icon: '🔥' },
  { to: '/calendrier', label: 'Calendrier', icon: '📅' },
  { to: '/progression', label: 'Progression', icon: '📈' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <span>💪</span>
        <span>FitTrack Nutrition</span>
      </div>
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
