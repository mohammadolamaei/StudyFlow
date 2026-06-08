import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import SchedulePage from './pages/SchedulePage';
import TimerPage from './pages/TimerPage';
import GoalsPage from './pages/GoalsPage';
import NotesPage from './pages/NotesPage';
import StatisticsPage from './pages/StatisticsPage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="timer" element={<TimerPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}

export default App;
