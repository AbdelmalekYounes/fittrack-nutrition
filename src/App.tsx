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
import Settings from './pages/Settings';
import ExerciseLibrary from './pages/ExerciseLibrary';
import LiveSession from './pages/LiveSession';
import MealPlan from './pages/MealPlan';
import Privacy from './pages/Privacy';
import SmartAnalysis from './pages/SmartAnalysis';
import Recovery from './pages/Recovery';

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
        <Route path="/parametres" element={<Settings />} />
        <Route path="/exercices" element={<ExerciseLibrary />} />
        <Route path="/seance-en-direct/:seanceId" element={<LiveSession />} />
        <Route path="/plan-repas" element={<MealPlan />} />
        <Route path="/confidentialite" element={<Privacy />} />
        <Route path="/analyse-intelligente" element={<SmartAnalysis />} />
        <Route path="/recuperation" element={<Recovery />} />
      </Route>
    </Routes>
  );
}
