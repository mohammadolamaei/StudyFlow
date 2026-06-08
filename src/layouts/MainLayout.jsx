import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import '../styles/layout.css';

function MainLayout() {
  return (
    <div className="app-shell">
      <Navbar />

      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          <Outlet />
        </main>
      </div>

      <footer className="app-footer">Made by Mohammad Olamaei
        <br />
        Inspired by the open-source community
      </footer>
      
    </div>
  );
}

export default MainLayout;
