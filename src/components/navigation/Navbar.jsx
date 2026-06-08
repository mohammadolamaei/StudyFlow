import { useTheme } from '../../features/settings/context/ThemeContext';
import moonIcon from '../../assets/icons/moon.svg';
import starIcon from '../../assets/icons/star.svg';
import '../../styles/navigation.css';

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const nextThemeLabel = theme === 'light' ? 'حالت تیره' : 'حالت روشن';
  const iconSrc = theme === 'light' ? moonIcon : starIcon;

  return (
    <header className="navbar">
      <div>
        <h1 className="navbar-title">استادی‌فلو</h1>
        <p className="navbar-subtitle">مدیریت مطالعه دانشجویی</p>
      </div>

      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={nextThemeLabel}
        title={nextThemeLabel}
      >
        <img src={iconSrc} alt="" aria-hidden="true" className="theme-toggle-icon" />
      </button>
    </header>
  );
}

export default Navbar;
