const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// const CREDENTIALS_PATH = path.join(__dirname, 'client_secret.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

//**************Esta opción esta habilitada únicamente para el desarrollo local**************

// Autoriza la aplicación usando OAuth2
// async function authorize() {
//   const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
//   const { client_secret, client_id, redirect_uris } = credentials.web;
//   const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

//   if (fs.existsSync(TOKEN_PATH)) {
//     const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
//     oAuth2Client.setCredentials(token);
//     return oAuth2Client;
//   } else {
//     return getNewToken(oAuth2Client);
//   }
// }

//**************Esta opción esta habilitada únicamente para Producción**************
//Autoriza la aplicación usando OAuth2

if (process.env.TOKEN_JSON && !fs.existsSync(TOKEN_PATH)) {
  fs.writeFileSync(TOKEN_PATH, process.env.TOKEN_JSON);
}

//************** Autorización para Producción **************
async function authorize() {
  const credentials = {
  web: {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uris: [process.env.REDIRECT_URI]
  }
};

  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } else {
    throw new Error('No se encontró token.json y no se puede generar automáticamente en entorno no interactivo.');
  }

// Si no existe token.json, lanza una URL para generar uno nuevo
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Autoriza esta app visitando esta URL:', authUrl);

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    readline.question('Pega el código que obtuviste aquí: ', (code) => {
      readline.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          reject('Error al recuperar el token de acceso', err);
          return;
        }
        oAuth2Client.setCredentials(token);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        console.log('Token guardado en', TOKEN_PATH);
        resolve(oAuth2Client);
      });
    });
  });
}

// Obtiene eventos de Google Calendar entre dos fechas
async function getAvailability(auth, calendarId, timeMin, timeMax) {
  const calendar = google.calendar({ version: 'v3', auth });
  const response = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];
  return events;
}

module.exports = { authorize, getAvailability };
