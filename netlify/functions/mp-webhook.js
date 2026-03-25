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
    const receivedId = queryId || bodyId;

    if (!receivedId) {
      return {
        statusCode: 200,
        body: "Webhook ativo",
      };
    }

    console.log("ID recebido:", receivedId);
    console.log("Topic recebido:", topic);

    let payment = null;

    if (topic === "merchant_order") {
      const orderResponse = await fetch(
        `https://api.mercadopago.com/merchant_orders/${receivedId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          },
        }
      );

      const order = await orderResponse.json();
      console.log("Merchant order:", order);

      if (order.payments && order.payments.length > 0) {
        const realPaymentId = order.payments[0].id;

        const paymentResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${realPaymentId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            },
          }
        );

        payment = await paymentResponse.json();
      } else {
        console.log("Nenhum pagamento encontrado dentro do merchant_order.");
      }
    } else {
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${receivedId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          },
        }
      );

      payment = await paymentResponse.json();
    }

    console.log("Pagamento:", payment);

    if (payment && payment.status === "approved") {
      const email =
        payment?.metadata?.email ||
        payment?.external_reference ||
        payment?.payer?.email ||
        null;

      if (!email) {
        console.log("E-mail não encontrado no pagamento.");
        return {
          statusCode: 200,
          body: "Sem email",
        };
      }

      const normalizedEmail = email.trim().toLowerCase();
      const paymentId = payment?.id || null;
      const amount = payment?.transaction_amount || null;
      const status = payment?.status || null;
      const paidAt =
        payment?.date_approved ||
        payment?.date_last_updated ||
        new Date().toISOString();

      console.log("Liberando acesso para:", normalizedEmail);

      const db = admin.firestore();

      await db.collection("access").doc(normalizedEmail).set(
        {
          paid: true,
          email: normalizedEmail,
          paymentId: paymentId,
          status: status,
          amount: amount,
          paidAt: paidAt,
          topic: topic || "payment",
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