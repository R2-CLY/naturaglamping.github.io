// const express = require('express');
// const path = require('path');
// const bodyParser = require('body-parser');
// const { authorize, getAvailability } = require('./calendar');
// const cors = require('cors');

// const app = express();
// const PORT = process.env.PORT || 3000;
// const TOTAL_DOMOS = 4;

// // Middlewares ANTES de las rutas
// app.use(cors());
// app.use(bodyParser.json());

// // 📊 Contador analítico
// let dailyStats = {};

// app.use((req, res, next) => {
//   const today = new Date().toISOString().split('T')[0];
//   if (!dailyStats[today]) {
//     dailyStats[today] = { requests: 0, calendar_calls: 0 };
//   }
//   dailyStats[today].requests++;
  
//   console.log(`📊 Total requests hoy (${today}): ${dailyStats[today].requests}`);
//   next();
// });

// // Función auxiliar
// function formatearFecha(date) {
//   return date.toISOString().split('T')[0];
// }

// // RUTA PRINCIPAL: Disponibilidad (conteo llamadas al calendario)
// app.post('/api/disponibilidad', async (req, res) => {
//   try {
//     // Conteno de consultas al calendario
//     const today = new Date().toISOString().split('T')[0];
//     dailyStats[today].calendar_calls++;
//     console.log(`📅 Consultas calendario hoy: ${dailyStats[today].calendar_calls}`);

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

// // Ruta para ver estadísticas (opcional)
// app.get('/api/stats', (req, res) => {
//   res.json({
//     stats: dailyStats,
//     total_days: Object.keys(dailyStats).length,
//     total_requests: Object.values(dailyStats).reduce((sum, day) => sum + day.requests, 0),
//     total_calendar_calls: Object.values(dailyStats).reduce((sum, day) => sum + day.calendar_calls, 0)
//   });
// });

// // Se sirven archivos estáticos del frontend
// app.use(express.static(path.join(__dirname, '../frontend')));

// // 🚀 Iniciar servidor
// app.listen(PORT, () => {
//   console.log(`Servidor corriendo en http://localhost:${PORT}`);
// });

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs').promises; // ← NUEVO: Para guardar archivos
const { authorize, getAvailability } = require('./calendar');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const TOTAL_DOMOS = 4;

// ← NUEVO: Archivo donde se guardan las estadísticas
const STATS_FILE = path.join(__dirname, 'stats.json');

// Middlewares ANTES de las rutas
app.use(cors());
app.use(bodyParser.json());

// 📊 Contador analítico
let dailyStats = {};

// ← NUEVO: Función para cargar estadísticas del archivo
async function loadStats() {
  try {
    const data = await fs.readFile(STATS_FILE, 'utf8');
    dailyStats = JSON.parse(data);
    console.log('📂 Estadísticas cargadas desde archivo');
  } catch (error) {
    console.log('📂 No se encontró archivo de stats, empezando desde cero');
    dailyStats = {};
  }
}

// ← NUEVO: Función para guardar estadísticas en archivo
async function saveStats() {
  try {
    await fs.writeFile(STATS_FILE, JSON.stringify(dailyStats, null, 2));
    console.log('💾 Estadísticas guardadas en archivo');
  } catch (error) {
    console.error('❌ Error guardando estadísticas:', error.message);
  }
}

// ← NUEVO: Cargar estadísticas al iniciar
loadStats();

// Middleware contador (ACTUALIZADO para guardar en archivo)
app.use(async (req, res, next) => {
  const today = new Date().toISOString().split('T')[0];
  if (!dailyStats[today]) {
    dailyStats[today] = { requests: 0, calendar_calls: 0 };
  }
  dailyStats[today].requests++;
  
  console.log(`📊 Total requests hoy (${today}): ${dailyStats[today].requests}`);
  
  // ← NUEVO: Guardar cada 10 requests
  if (dailyStats[today].requests % 10 === 0) {
    await saveStats();
  }
  
  next();
});

// Función auxiliar (igual que antes)
function formatearFecha(date) {
  return date.toISOString().split('T')[0];
}

// RUTA PRINCIPAL: Disponibilidad (ACTUALIZADA para guardar inmediatamente)
app.post('/api/disponibilidad', async (req, res) => {
  try {
    // Contador de consultas al calendario
    const today = new Date().toISOString().split('T')[0];
    dailyStats[today].calendar_calls++;
    console.log(`📅 Consultas calendario hoy: ${dailyStats[today].calendar_calls}`);
    
    // ← NUEVO: Guardar inmediatamente las consultas importantes
    await saveStats();

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

// 📈 Ruta para ver estadísticas (ACTUALIZADA)
app.get('/api/stats', async (req, res) => {
  // ← NUEVO: Asegurar datos actualizados
  await saveStats();
  
  res.json({
    stats: dailyStats,
    total_days: Object.keys(dailyStats).length,
    total_requests: Object.values(dailyStats).reduce((sum, day) => sum + day.requests, 0),
    total_calendar_calls: Object.values(dailyStats).reduce((sum, day) => sum + day.calendar_calls, 0),
    file_saved: true, // ← NUEVO: Confirmación de guardado
    last_updated: new Date().toISOString() // ← NUEVO: Timestamp
  });
});

// ← NUEVO: Ruta para ver histórico completo
app.get('/api/history', (req, res) => {
  const sortedDays = Object.keys(dailyStats).sort();
  const history = sortedDays.map(day => ({
    date: day,
    requests: dailyStats[day].requests,
    calendar_calls: dailyStats[day].calendar_calls
  }));
  
  res.json({
    history,
    total_days: history.length,
    date_range: {
      from: sortedDays[0] || null,
      to: sortedDays[sortedDays.length - 1] || null
    }
  });
});

// ← NUEVO: Guardar antes de cerrar el servidor
process.on('SIGTERM', async () => {
  console.log('💾 Guardando estadísticas antes de cerrar...');
  await saveStats();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('💾 Guardando estadísticas antes de cerrar...');
  await saveStats();
  process.exit(0);
});

// Se sirven archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// 🚀 Iniciar servidor (ACTUALIZADO con nuevas URLs)
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Stats: https://backend-ng-wfvh.onrender.com/api/stats`);
  console.log(`📈 History: https://backend-ng-wfvh.onrender.com/api/history`);
});