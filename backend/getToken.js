const { authorize } = require('./calendar');

authorize().then(auth => {
  console.log("Autenticado exitosamente.");
}).catch(error => {
  console.error("Error de autenticación:", error);
});