import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import HomePage from './pages/HomePage';
import './App.css';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Layout>
  );
}

export default App;
