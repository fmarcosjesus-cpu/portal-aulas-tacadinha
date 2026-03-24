const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Método não permitido",
      };
    }

    const body = JSON.parse(event.body || "{}");
    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "E-mail obrigatório" }),
      };
    }

    const preference = {
      items: [
        {
          title: "Acesso ao curso Tacadinha",
          quantity: 1,
          unit_price: 10,
          currency_id: "BRL",
        },
      ],
      payer: {
        email,
      },
      external_reference: email,
      notification_url: "https://snazzy-raindrop-a62381.netlify.app/.netlify/functions/mp-webhook",
      back_urls: {
        success: "https://snazzy-raindrop-a62381.netlify.app/",
        failure: "https://snazzy-raindrop-a62381.netlify.app/",
        pending: "https://snazzy-raindrop-a62381.netlify.app/",
      },
      auto_return: "approved",
    };

    const response = await mercadopago.preferences.create(preference);

    return {
      statusCode: 200,
      body: JSON.stringify({
        init_point: response.body.init_point,
      }),
    };
  } catch (error) {
    console.error("Erro ao criar preferência:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao criar preferência" }),
    };
  }
};