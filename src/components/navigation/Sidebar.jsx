import { NavLink } from 'react-router-dom';
import navigationLinks from '../../data/navigationLinks';
import '../../styles/navigation.css';

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <ul className="sidebar-links">
          {navigationLinks.map((link) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
