import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Config from './pages/Config';
import Charts from './pages/Charts';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="graficas" element={<Charts />} />
          <Route path="configuracion" element={<Config />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
