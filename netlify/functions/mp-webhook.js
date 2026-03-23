exports.handler = async (event) => {
  console.log("Webhook recebido:", event.body);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Webhook recebido com sucesso" })
  };
};