// // calendar.js
// const fs = require('fs');
// const path = require('path');
// const readline = require('readline');
// const { google } = require('googleapis');

// const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// const TOKEN_PATH = path.join(__dirname, 'token.json');
// const CREDENTIALS_PATH = path.join(__dirname, 'client_secret.json');

// // Leer credenciales del archivo
// function loadCredentials() {
//   const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
//   return JSON.parse(content);
// }

// // Obtener un nuevo token de acceso mediante readline
// async function getNewToken(oAuth2Client) {
//   const authUrl = oAuth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: SCOPES,
//   });
//   // Mostrar la URL de autorización al usuario
//   console.log('Autoriza esta app visitando esta URL:', authUrl);

//   // Crear una interfaz readline para capturar el código de autorización
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   // Esperar a que el usuario pegue el código de autorización
//   const code = await new Promise((resolve) => {
//     rl.question('Pega el código que obtuviste aquí: ', (input) => {
//       rl.close();
//       resolve(input);
//     });
//   });

//   // Intercambiar el código por un token de acceso
//   const { tokens } = await oAuth2Client.getToken(code);
//   oAuth2Client.setCredentials(tokens);
//   await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(tokens));
//   console.log('Token guardado en', TOKEN_PATH);

//   return oAuth2Client;
// }

// // Función principal de autorización OAuth2
// async function authorize() {
//   const { installed } = loadCredentials();
//   const { client_id, client_secret, redirect_uris } = installed;

//   // Crear un cliente OAuth2 con las credenciales
//   const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

//   // Intentar cargar el token existente
//   try {
//     const token = await fs.promises.readFile(TOKEN_PATH, 'utf-8');
//     oAuth2Client.setCredentials(JSON.parse(token));
//     return oAuth2Client;
//   } catch (err) {
//     return await getNewToken(oAuth2Client);
//   }
// }

// // Obtener eventos del calendario entre dos fechas
// async function getAvailability(auth, calendarId, timeMin, timeMax) {
//   const calendar = google.calendar({ version: 'v3', auth });

//   // Convertir las fechas a formato RFC3339
//   const response = await calendar.events.list({
//     calendarId,
//     timeMin,
//     timeMax,
//     singleEvents: true,
//     orderBy: 'startTime',
//   });

//   // Verificar si hay eventos
//   return response.data.items;
// }
// // Exportar funciones para su uso en otros módulos
// module.exports = { authorize, getAvailability };

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const CREDENTIALS_PATH = path.join(__dirname, 'client_secret.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Autoriza la aplicación usando OAuth2
async function authorize() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } else {
    return getNewToken(oAuth2Client);
  }
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
