const admin = require("firebase-admin");
const axios = require("axios");
const cron = require("node-cron");

// 🔹 Configurar Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// 🔹 Configurar API de AQICN
const CITY = "cali";
const API_KEY = "4dbc5b687587df72e35cbb96a11571bddcea856f"; // Reemplázalo con tu API Key
const AQI_URL = `https://api.waqi.info/feed/@13323/?token=${API_KEY}`;

// 🔹 Función para obtener datos del ICA
async function updateICA() {
  try {
    const response = await axios.get(AQI_URL);
    if (response.data.status === "ok") {
      const aqiValue = response.data.data.aqi;
      console.log(`Nuevo ICA: ${aqiValue}`);

      // 🔹 Guardar en Firestore
      await db.collection("ICA").doc(CITY).set({
        value: aqiValue,
        timestamp: admin.firestore.Timestamp.now(),
      });

      console.log("📌 ICA actualizado en Firestore.");
    } else {
      console.error("❌ Error en la respuesta de la API.");
    }
  } catch (error) {
    console.error("❌ Error al obtener el ICA:", error);
  }
}
updateICA();
// 🔹 Ejecutar cada 15 minutos
cron.schedule("*/15 * * * *", () => {
  console.log("⏳ Actualizando ICA...");
  updateICA();
});

// 🔹 Iniciar el servidor (necesario para Render o Railway)
const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Servidor ICA corriendo"));
app.listen(3000, () => console.log("🚀 Servidor en puerto 3000"));
