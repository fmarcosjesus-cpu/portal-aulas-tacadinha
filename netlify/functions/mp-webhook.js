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
    const body = JSON.parse(event.body);

    console.log("Webhook recebido:", body);

    const paymentId = body.data.id;

    // buscar detalhes do pagamento
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    });

    const payment = await response.json();

    console.log("Pagamento:", payment);

    if (payment.status === "approved") {
      const email = payment.payer.email;

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