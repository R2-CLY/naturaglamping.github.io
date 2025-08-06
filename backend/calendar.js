const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

async function authorize() {
  // Leer las credenciales y token desde variables de entorno
  const credentials = JSON.parse(process.env.CLIENT_SECRET_JSON);
  const token = JSON.parse(process.env.TOKEN_JSON);

  // Verifica que las credenciales y el token estén disponibles
  const { client_id, client_secret, redirect_uris } = credentials.web;

  // Crea un cliente OAuth2 con las credenciales
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Establece el token actual (con refresh_token incluido)
  oAuth2Client.setCredentials(token);

  // Refresca el access_token automáticamente si es necesario
  try {
    await oAuth2Client.getAccessToken();
    return oAuth2Client;
  } catch (error) {
    console.error('❌ Error al renovar access_token:', error.response?.data || error.message);
    throw new Error('Token inválido o expirado. Necesitas reautorizar la app.');
  }
}

// Obtiene la disponibilidad de un calendario entre dos fechas
async function getAvailability(auth, calendarId, timeMin, timeMax) {
  const calendar = google.calendar({ version: 'v3', auth });
  const response = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

module.exports = { authorize, getAvailability };
// Este módulo exporta funciones para autorizar el acceso a la API de Google Calendar