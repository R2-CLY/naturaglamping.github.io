const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { authorize, getAvailability } = require('./calendar');

const app = express();
const PORT = process.env.PORT || 3000;
const TOTAL_DOMOS = 4;

app.use(bodyParser.json());

function formatearFecha(date) {
  return date.toISOString().split('T')[0];
}

app.post('/api/disponibilidad', async (req, res) => {
  try {
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

app.use(express.static(path.join(__dirname, '../frontend')));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


// const express = require('express');
// const path = require('path');
// const { authorize, getAvailability } = require('./calendar');

// const app = express();
// const PORT = 3000;

// app.use(express.json());
// app.use(express.static(path.join(__dirname, '../frontend')));

// // Endpoint temporal para listar calendarios
// app.get('/api/calendarios', async (req, res) => {
//   try {
//     const auth = await authorize();
//     const { google } = require('googleapis');
//     const calendar = google.calendar({ version: 'v3', auth });
    
//     const response = await calendar.calendarList.list();
//     const calendars = response.data.items;
    
//     console.log('Calendarios disponibles:');
//     calendars.forEach(cal => {
//       console.log(`ID: ${cal.id}`);
//       console.log(`Nombre: ${cal.summary}`);
//       console.log(`Descripción: ${cal.description || 'N/A'}`);
//       console.log('---');
//     });
    
//     res.json(calendars.map(cal => ({
//       id: cal.id,
//       nombre: cal.summary,
//       descripcion: cal.description || 'N/A'
//     })));
//   } catch (error) {
//     console.error('Error al listar calendarios:', error);
//     res.status(500).json({ error: 'Error al consultar calendarios' });
//   }
// });

// app.post('/api/disponibilidad', async (req, res) => {
//   try {
//     const { checkin, checkout } = req.body;

//     if (!checkin || !checkout) {
//       return res.status(400).json({ error: 'Debes enviar checkin y checkout en formato YYYY-MM-DD' });
//     }

//     const checkinDate = new Date(checkin);
//     const checkoutDate = new Date(checkout);

//     if (isNaN(checkinDate) || isNaN(checkoutDate)) {
//       return res.status(400).json({ error: 'Formato de fecha inválido. Usa YYYY-MM-DD' });
//     }

//     if (checkinDate >= checkoutDate) {
//       return res.status(400).json({ error: 'La fecha de check-in debe ser anterior a la de check-out' });
//     }

//     const diffInDays = (checkoutDate - checkinDate) / (1000 * 60 * 60 * 24);
//     if (diffInDays > 31) {
//       return res.status(400).json({ error: 'La reserva no puede exceder los 31 días naturales' });
//     }

//     const auth = await authorize();
//     const calendarId = 'primary'; // Cambia esto por el ID del calendario correcto
//     const events = await getAvailability(
//       auth,
//       calendarId,
//       checkinDate.toISOString(),
//       checkoutDate.toISOString()
//     );

//     // Para debug - puedes comentar esta línea en producción
//     console.log('Eventos encontrados:', events.map(e => ({ 
//       summary: e.summary, 
//       start: e.start, 
//       end: e.end 
//     })));

//     const totalDomos = 4;
//     const reservados = new Set();

//     // Procesar cada evento
//     events.forEach(event => {
//       if (!event.summary) return; // Saltar eventos sin título
      
//       const eventStart = new Date(event.start?.date || event.start?.dateTime);
//       const eventEnd = new Date(event.end?.date || event.end?.dateTime);

//       // Validar si el evento se solapa con el rango solicitado
//       const overlap = checkinDate < eventEnd && checkoutDate > eventStart;

//       if (overlap) {
//         console.log(`Evento que se solapa: "${event.summary}"`);
        
//         // Expresión regular para capturar "Reservado" seguido de un número (con o sin punto)
//         const match = event.summary.match(/Reservado\s+(\d+)\.?/i);
        
//         if (match) {
//           const domo = parseInt(match[1]);
//           console.log(`Domo encontrado: ${domo}`);
          
//           if (domo >= 1 && domo <= totalDomos) {
//             reservados.add(domo);
//             console.log(`Domo ${domo} agregado a reservados`);
//           }
//         } else {
//           console.log(`No se encontró patrón "Reservado X" en: "${event.summary}"`);
//         }
//       }
//     });

//     console.log('Domos reservados:', Array.from(reservados));
    
//     const disponibles = totalDomos - reservados.size;
//     const mensaje = disponibles > 0
//       ? '¡Excelente, tenemos espacio para tu reserva!'
//       : 'Desafortunadamente no contamos con disponibilidad para ese(os) día(s) para tu reserva';

//     res.json({
//       disponible: disponibles > 0,
//       mensaje,
//       cantidad_disponible: disponibles,
//       domos_ocupados: Array.from(reservados).sort((a, b) => a - b)
//     });

//   } catch (error) {
//     console.error('Error en /api/disponibilidad:', error.message);
//     res.status(500).json({ error: 'Error al consultar disponibilidad' });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Servidor corriendo en http://localhost:${PORT}`);
// });