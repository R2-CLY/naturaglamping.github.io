const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

const credentials = JSON.parse(fs.readFileSync('client_secret.json'));
const { client_secret, client_id, redirect_uris } = credentials.web;

const oAuth2Client = new google.auth.OAuth2(
  client_id, client_secret, redirect_uris[0]
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

console.log('👉 Visita esta URL para autorizar la app:\n', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\n🔐 Pega el código aquí: ', (code) => {
  rl.close();
  oAuth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('❌ Error al recuperar el token', err);
      return;
    }
    fs.writeFileSync('token.json', JSON.stringify(token, null, 2));
    console.log('✅ Nuevo token.json guardado exitosamente');
  });
});
