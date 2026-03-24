const fetch = require("node-fetch");
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

exports.handler = async (event) => {
  try {
    // Evita erro ao abrir no navegador
    if (!event.body) {
      return {
        statusCode: 200,
        body: "Webhook ativo",
      };
    }

    const body = JSON.parse(event.body);

    console.log("Webhook recebido:", body);

    // 🔥 Pega ID corretamente (ESSENCIAL)
    const paymentId = event.queryStringParameters?.id || body.data?.id;

    console.log("ID recebido:", paymentId);

    if (!paymentId) {
      return {
        statusCode: 400,
        body: "Sem ID",
      };
    }

    // Buscar pagamento
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    });

    const payment = await response.json();

    console.log("Pagamento:", payment);

    // 🔥 Só libera se aprovado
    if (payment.status === "approved") {
      const email = payment.payer?.email;

      if (!email) {
        console.log("Email não encontrado");
        return { statusCode: 200, body: "Sem email" };
      }

      console.log("Liberando acesso para:", email);

      const db = admin.firestore();

      await db.collection("access").doc(email.toLowerCase()).set({
        paid: true,
      });

      console.log("Acesso liberado!");
    }

    return {
      statusCode: 200,
      body: "OK",
    };
  } catch (error) {
    console.error("Erro no webhook:", error);

    return {
      statusCode: 500,
      body: "Erro",
    };
  }
};