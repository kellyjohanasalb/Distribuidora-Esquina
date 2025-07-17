import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import VistaPedidoPage from './Pages/vistaPedidoPage';
import OrdersView from './Pages/ordersView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pedido" element={<VistaPedidoPage />} />
        <Route path="/ordenes" element={<OrdersView />} />
      </Routes>
    </Router>
  );
}

export default App;