import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import VistaPedidoPage from './Pages/VistaPedidoPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pedido" element={<VistaPedidoPage />} />
      </Routes>
    </Router>
  );
}

export default App;