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
    const qs = event.queryStringParameters || {};
    const topic = qs.topic || qs.type || null;
    const queryId = qs.id || qs["data.id"] || null;

    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        body = {};
      }
    }

    console.log("Webhook query:", qs);
    console.log("Webhook body:", body);

    const bodyId = body?.data?.id || null;
    const paymentId = queryId || bodyId;

    if (!paymentId) {
      return {
        statusCode: 200,
        body: "Webhook ativo",
      };
    }

    console.log("ID recebido:", paymentId);
    console.log("Topic recebido:", topic);

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    });

    const payment = await response.json();

    console.log("Pagamento:", payment);

    if (payment.status === "approved") {
      const email =
        payment?.payer?.email ||
        payment?.metadata?.email ||
        payment?.external_reference ||
        null;

      if (!email) {
        console.log("E-mail não encontrado no pagamento.");
        return {
          statusCode: 200,
          body: "Sem email",
        };
      }

      console.log("Liberando acesso para:", email);

      const db = admin.firestore();

      await db.collection("access").doc(email.toLowerCase()).set(
        {
          paid: true,
        },
        { merge: true }
      );

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