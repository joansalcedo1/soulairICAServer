const admin = require("firebase-admin");
const axios = require("axios");
const cron = require("node-cron");
const express = require("express");

// Configurar Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY); // Asegúrate de configurar esto en Render
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Configurar API de AQICN
const API_KEY = process.env.API_KEY; // Agregar la clave como variable de entorno
const SENSORS = {
  pance: `https://api.waqi.info/feed/@13323/?token=${API_KEY}`,  // ID del sensor en Pance
  univalle: `https://api.waqi.info/feed/@13326/?token=${API_KEY}` // ID del sensor en Univalle 
};

//  Función para obtener y guardar datos de AQI
async function updateICA(location, url) {
  try {
    const response = await axios.get(url);
    if (response.data.status === "ok") {
      const data = response.data.data;
      const aqiValue = data.aqi;
      const latitude = data.city.geo[0];
      const longitude = data.city.geo[1];
      const sensorName = data.city.name;

      console.log(`📍 ${location.toUpperCase()}: ICA ${aqiValue}, Lat: ${latitude}, Lon: ${longitude}`);

      // Guardar en Firestore sin sobrescribir
      await db.collection("ICA").doc(sensorName).collection("registros").add({
        aqi: aqiValue,
        latitude: latitude,
        longitude: longitude,
        sensor: sensorName,
        timestamp: admin.firestore.Timestamp.now(),
      });

      console.log(`✅ Datos guardados en Firestore para ${location}`);
    } else {
      console.error(`❌ Error en la respuesta de la API para ${location}`);
    }
  } catch (error) {
    console.error(`❌ Error al obtener el ICA de ${location}:`, error);
  }
}

// 🔹 Función para actualizar ambos sensores
async function updateAllSensors() {
  console.log("⏳ Actualizando datos de ICA...");
  await updateICA("pance", SENSORS.pance);
  await updateICA("univalle", SENSORS.univalle);
}

// 🔹 Ejecutar cada 15 minutos
cron.schedule("*/15 * * * *", updateAllSensors);

// 🔹 Iniciar el servidor (para Render)
const app = express();
app.get("/", (req, res) => res.send("Servidor ICA corriendo"));
app.listen(3000, () => console.log("🚀 Servidor en puerto 3000"));

// 🔹 Primera ejecución al iniciar
updateAllSensors();
