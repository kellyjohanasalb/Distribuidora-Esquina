import React, { useState } from 'react';
import { Button, Table, Form } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Pedido = () => {
  const [startDate, setStartDate] = useState(new Date());

  return (
    <div style={{ backgroundColor: 'var(--amarillo-bg)', minHeight: '100vh' }}>
      {/* 🟡 Encabezado */}
      <header className="bg-custom-header shadow-sm w-100 mb-4">
        <div className="container">
          <div className="row align-items-center g-3 py-2">
            <div className="col-12 col-md-4 d-flex align-items-center gap-3 justify-content-md-start justify-content-center">
              <img
                src="/logo-distruidora/logo.png"
                alt="Distribuidora Esquina"
                className="logo-img"
              />
              <h1 className="text-success fw-bold fs-5 m-0">Distribuidora Esquina</h1>
            </div>
          </div>
        </div>
      </header>

      {/* 🔍 Filtros */}
      <div className="container mb-4">
        <div className="row g-3 align-items-start">
          {/* Búsqueda + Rubros */}
          <div className="col-12 col-md-8">
            <div className="d-flex flex-column gap-2">
              <Form.Control
                type="text"
                placeholder="🔍 Buscar productos"
                className="w-100"
                style={{ fontSize: '0.9rem' }}
              />
              <Form.Select
                className="w-100"
                style={{ fontSize: '0.9rem' }}
              >
                <option>Todos los rubros</option>
                <option>Bebidas</option>
                <option>Snacks</option>
              </Form.Select>
            </div>
          </div>

          {/* Fecha + Botón */}
          <div className="col-12 col-md-4 d-flex flex-column gap-2 align-items-md-end align-items-center">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              className="form-control"
              dateFormat="dd/MM/yyyy"
              style={{ fontSize: '0.9rem' }}
            />
            <Button
              variant="success"
              className="w-100 w-md-auto"
              style={{ fontSize: '0.9rem', padding: '6px 12px' }}
            >
              Añadir
            </Button>
          </div>
        </div>
      </div>

      {/* 📋 Tabla de productos */}
      <div className="container">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Código</th>
              <th>Artículo</th>
              <th>Cantidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* Mapea los productos aquí */}
          </tbody>
        </Table>
      </div>

      {/* 🚀 Navegación inferior */}
      <div className="d-flex justify-content-around mt-5">
        <Button variant="secondary">Catálogo</Button>
        <Button variant="primary">Pedido Nuevo</Button>
        <Button variant="warning">Órdenes</Button>
      </div>
    </div>
  );
};

export default Pedido;