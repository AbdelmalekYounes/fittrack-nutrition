import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Nutrition from './pages/Nutrition';
import Recipes from './pages/Recipes';
import Program from './pages/Program';
import Activities from './pages/Activities';
import Progress from './pages/Progress';
import Calendar from './pages/Calendar';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/recettes" element={<Recipes />} />
        <Route path="/programme" element={<Program />} />
        <Route path="/activites" element={<Activities />} />
        <Route path="/calendrier" element={<Calendar />} />
        <Route path="/progression" element={<Progress />} />
      </Route>
    </Routes>
  );
}
