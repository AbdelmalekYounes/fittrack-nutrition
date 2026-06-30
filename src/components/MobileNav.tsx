import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Accueil', icon: '🏠', end: true },
  { to: '/nutrition', label: 'Nutrition', icon: '🍽️' },
  { to: '/programme', label: 'Programme', icon: '🏋️' },
  { to: '/activites', label: 'Activités', icon: '🔥' },
  { to: '/progression', label: 'Progrès', icon: '📈' },
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `mobile-nav__link ${isActive ? 'active' : ''}`}
        >
          <span className="mobile-nav__icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
