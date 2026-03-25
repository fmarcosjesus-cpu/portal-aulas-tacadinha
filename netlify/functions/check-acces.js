const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Método não permitido" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ authorized: false, error: "E-mail obrigatório" }),
      };
    }

    const db = admin.firestore();
    const snap = await db.collection("access").doc(email).get();

    if (!snap.exists) {
      return {
        statusCode: 200,
        body: JSON.stringify({ authorized: false }),
      };
    }

    const data = snap.data() || {};

    return {
      statusCode: 200,
      body: JSON.stringify({
        authorized: data.paid === true,
      }),
    };
  } catch (error) {
    console.error("Erro ao verificar acesso:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        authorized: false,
        error: "Erro interno",
      }),
    };
  }
};