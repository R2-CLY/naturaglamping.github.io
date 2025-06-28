// const express = require('express');
// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware para parsear JSON
// app.use(express.json());

// // Ruta simple de prueba
// app.get('/', (req, res) => {
//   res.send('Servidor de reservas funcionando 🚀');
// });

// // Arrancar el servidor
// app.listen(PORT, () => {
//   console.log(`Servidor corriendo en http://localhost:${PORT}`);
// });


const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware para servir archivos estáticos desde /frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Ruta raíz que sirve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
