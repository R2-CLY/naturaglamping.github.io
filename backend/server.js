// const express = require('express');
// const path = require('path');
// const bodyParser = require('body-parser');
// const { authorize, getAvailability } = require('./calendar');

// const app = express();
// const PORT = process.env.PORT || 3000;
// const TOTAL_DOMOS = 4;

// const cors = require('cors');

// app.use(cors());
// app.use(bodyParser.json());

// function formatearFecha(date) {
//   return date.toISOString().split('T')[0];
// }

// app.post('/api/disponibilidad', async (req, res) => {
//   try {
//     const { checkin, checkout } = req.body;

//     if (!checkin || !checkout) {
//       return res.status(400).json({ error: 'Debes enviar checkin y checkout en formato YYYY-MM-DD' });
//     }

//     const checkinDate = new Date(checkin);
//     const checkoutDate = new Date(checkout);

//     if (checkinDate >= checkoutDate) {
//       return res.status(400).json({ error: 'La fecha de check-in debe ser anterior a la de check-out' });
//     }

//     const diffDias = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
//     if (diffDias > 31) {
//       return res.status(400).json({ error: 'No puedes reservar más de 31 días seguidos.' });
//     }

//     const auth = await authorize();
//     const calendarId = 'primary';

//     const events = await getAvailability(
//       auth,
//       calendarId,
//       checkinDate.toISOString(),
//       checkoutDate.toISOString()
//     );

//     // Agrupar eventos válidos por día
//     const ocupacionPorDia = {};

//     events.forEach(event => {
//       const summary = event.summary || '';
//       if (!summary.toLowerCase().startsWith('reserva')) return;

//       const start = new Date(event.start.date || event.start.dateTime);
//       const end = new Date(event.end.date || event.end.dateTime);

//       for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
//         const key = formatearFecha(d);
//         ocupacionPorDia[key] = (ocupacionPorDia[key] || 0) + 1;
//       }
//     });

//     // Verificar si todos los días del rango tienen disponibilidad
//     let hayEspacioTodoElRango = true;
//     const diasSinEspacio = [];

//     for (let d = new Date(checkinDate); d < checkoutDate; d.setDate(d.getDate() + 1)) {
//       const key = formatearFecha(d);
//       const ocupados = ocupacionPorDia[key] || 0;

//       if (ocupados >= TOTAL_DOMOS) {
//         hayEspacioTodoElRango = false;
//         diasSinEspacio.push(key);
//       }
//     }

//     const mensaje = hayEspacioTodoElRango
//       ? "¡Excelente, si hay disponibilidad para tu reserva!"
//       : "Desafortunadamente no contamos con disponibilidad para tu reserva";

//     res.json({
//       disponible: hayEspacioTodoElRango,
//       mensaje,
//       dias_sin_espacio: diasSinEspacio,
//       dias_evaluados: diffDias
//     });

//   } catch (error) {
//     console.error('Error en /api/disponibilidad:', error.message);
//     res.status(500).json({ error: 'Ocurrió un error al consultar la disponibilidad.' });
//   }
// });

// app.use(express.static(path.join(__dirname, '../frontend')));

// app.listen(PORT, () => {
//   console.log(`Servidor corriendo en http://localhost:${PORT}`);
// });

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { authorize, getAvailability } = require('./calendar');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const TOTAL_DOMOS = 4;

// Middlewares ANTES de las rutas
app.use(cors());
app.use(bodyParser.json());

// 📊 Contador analítico
let dailyStats = {};

app.use((req, res, next) => {
  const today = new Date().toISOString().split('T')[0];
  if (!dailyStats[today]) {
    dailyStats[today] = { requests: 0, calendar_calls: 0 };
  }
  dailyStats[today].requests++;
  
  console.log(`📊 Total requests hoy (${today}): ${dailyStats[today].requests}`);
  next();
});

// Función auxiliar
function formatearFecha(date) {
  return date.toISOString().split('T')[0];
}

// RUTA PRINCIPAL: Disponibilidad (conteo llamadas al calendario)
app.post('/api/disponibilidad', async (req, res) => {
  try {
    // Conteno de consultas al calendario
    const today = new Date().toISOString().split('T')[0];
    dailyStats[today].calendar_calls++;
    console.log(`📅 Consultas calendario hoy: ${dailyStats[today].calendar_calls}`);

    const { checkin, checkout } = req.body;

    if (!checkin || !checkout) {
      return res.status(400).json({ error: 'Debes enviar checkin y checkout en formato YYYY-MM-DD' });
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);

    if (checkinDate >= checkoutDate) {
      return res.status(400).json({ error: 'La fecha de check-in debe ser anterior a la de check-out' });
    }

    const diffDias = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    if (diffDias > 31) {
      return res.status(400).json({ error: 'No puedes reservar más de 31 días seguidos.' });
    }

    const auth = await authorize();
    const calendarId = 'primary';

    const events = await getAvailability(
      auth,
      calendarId,
      checkinDate.toISOString(),
      checkoutDate.toISOString()
    );

    // Agrupar eventos válidos por día
    const ocupacionPorDia = {};

    events.forEach(event => {
      const summary = event.summary || '';
      if (!summary.toLowerCase().startsWith('reserva')) return;

      const start = new Date(event.start.date || event.start.dateTime);
      const end = new Date(event.end.date || event.end.dateTime);

      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const key = formatearFecha(d);
        ocupacionPorDia[key] = (ocupacionPorDia[key] || 0) + 1;
      }
    });

    // Verificar si todos los días del rango tienen disponibilidad
    let hayEspacioTodoElRango = true;
    const diasSinEspacio = [];

    for (let d = new Date(checkinDate); d < checkoutDate; d.setDate(d.getDate() + 1)) {
      const key = formatearFecha(d);
      const ocupados = ocupacionPorDia[key] || 0;

      if (ocupados >= TOTAL_DOMOS) {
        hayEspacioTodoElRango = false;
        diasSinEspacio.push(key);
      }
    }

    const mensaje = hayEspacioTodoElRango
      ? "¡Excelente, si hay disponibilidad para tu reserva!"
      : "Desafortunadamente no contamos con disponibilidad para tu reserva";

    res.json({
      disponible: hayEspacioTodoElRango,
      mensaje,
      dias_sin_espacio: diasSinEspacio,
      dias_evaluados: diffDias
    });

  } catch (error) {
    console.error('Error en /api/disponibilidad:', error.message);
    res.status(500).json({ error: 'Ocurrió un error al consultar la disponibilidad.' });
  }
});

// 📈 Ruta para ver estadísticas (opcional)
app.get('/api/stats', (req, res) => {
  res.json({
    stats: dailyStats,
    total_days: Object.keys(dailyStats).length,
    total_requests: Object.values(dailyStats).reduce((sum, day) => sum + day.requests, 0),
    total_calendar_calls: Object.values(dailyStats).reduce((sum, day) => sum + day.calendar_calls, 0)
  });
});

// Se sirven archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});