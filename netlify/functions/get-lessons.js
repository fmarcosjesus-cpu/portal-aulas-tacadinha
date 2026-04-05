const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const fetch = require("node-fetch");

const BUNNY_LIBRARY_ID = 625484;
const BUNNY_CDN_HOST = "vz-da02adc7-ceb.b-cdn.net";
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;

async function getBunnyThumbMap() {
  if (!BUNNY_API_KEY) {
    throw new Error("BUNNY_API_KEY não configurada");
  }

  const response = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos?page=1&itemsPerPage=100`,
    {
      method: "GET",
      headers: {
        AccessKey: BUNNY_API_KEY,
        accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao listar vídeos no Bunny: ${response.status} - ${text}`);
  }

  const data = await response.json();

  const items = Array.isArray(data) ? data : (data.items || data.Items || []);

  const thumbMap = {};

  for (const video of items) {
    const title = (video.title || video.Title || "").trim();
    const guid = video.guid || video.Guid;

    if (!title || !guid) continue;

    thumbMap[title] = `https://${BUNNY_CDN_HOST}/${guid}/thumbnail.jpg`;
  }

  return thumbMap;
}
exports.handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body || "{}");

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email obrigatório" }),
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    const ref = db.collection("access").doc(normalizedEmail);
    const snap = await ref.get();

    if (!snap.exists) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Acesso não autorizado" }),
      };
    }

    const accessData = snap.data();

    if (!accessData || accessData.paid !== true) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Acesso não autorizado" }),
      };
    }

   let bunnyThumbMap = {};

    try {
      bunnyThumbMap = await getBunnyThumbMap();
      console.log("Thumbs carregadas do Bunny:", Object.keys(bunnyThumbMap).length);
    } catch (err) {
      console.error("Falha ao buscar thumbs no Bunny:", err.message);
    }

    const courses = [
  {
    id: "tacadinha",
    title: "Curso Tacadinha",
    description: "Aulas completas sobre o jogo Tacadinha.",
    lessons: [
      {
        title: "Aula 1 – Fundamentos da Mira e Introdução ao Curso",
        description: "Base inicial do curso, com os fundamentos da mira e a introdução ao método.",
        embed: "https://iframe.mediadelivery.net/embed/625484/5fd1f8c8-d240-4e44-a7b1-1e667f9fbd12",
        thumb: bunnyThumbMap["Aula 1 – Fundamentos da Mira e Introdução ao Curso"] || "https://vz-da02adc7-ceb.b-cdn.net/5fd1f8c8-d240-4e44-a7b1-1e667f9fbd12/thumbnail_5e215b90.jpg"
      },
      {
        title: "Aula 2 – Ajuste de Mira: A Técnica para Encaçapar com Precisão",
        description: "Aprenda a ajustar a mira com mais precisão e consistência nas jogadas.",
        embed: "https://iframe.mediadelivery.net/embed/625484/144e3546-9a1a-4096-a7c4-fdfeffbecda0",
        thumb: bunnyThumbMap["Aula 2 – Ajuste de Mira: A Técnica para Encaçapar com Precisão"] || "https://vz-da02adc7-ceb.b-cdn.net/144e3546-9a1a-4096-a7c4-fdfeffbecda0/thumbnail_711bb149.jpg"
      },
      {
        title: "Aula 3 – Efeitos: Domínio Total da Bola Branca",
        description: "Entenda os efeitos e domine o controle da bola branca com mais segurança.",
        embed: "https://iframe.mediadelivery.net/embed/625484/6633a79e-587e-4c0b-9309-5030630f560f",
        thumb: bunnyThumbMap["Aula 3 – Efeitos: Domínio Total da Bola Branca"] || "https://vz-da02adc7-ceb.b-cdn.net/6633a79e-587e-4c0b-9309-5030630f560f/thumbnail_28ac7846.jpg"
      },
      {
        title: "Aula 4 – Planejamento e Estratégia: A Arte de Não Errar",
        description: "Desenvolva visão de jogo, planejamento e estratégia para reduzir erros.",
        embed: "https://iframe.mediadelivery.net/embed/625484/2d80449b-836a-4a12-990e-0e2fb2d7f5f8",
        thumb: bunnyThumbMap["Aula 4 – Planejamento e Estratégia: A Arte de Não Errar"] || "https://vz-da02adc7-ceb.b-cdn.net/2d80449b-836a-4a12-990e-0e2fb2d7f5f8/thumbnail_a2b4b6da.jpg"
      },
      {
        title: "Aula 5 – Técnica Avançada para Memorizar e Aplicar os Efeitos",
        description: "Aprenda um método prático para memorizar e aplicar os efeitos no jogo.",
        embed: "https://iframe.mediadelivery.net/embed/625484/c20da10e-3066-40dd-8b4e-e8d34b74b710",
        thumb: bunnyThumbMap["Aula 5 – Técnica Avançada para Memorizar e Aplicar os Efeitos"] || "https://vz-da02adc7-ceb.b-cdn.net/c20da10e-3066-40dd-8b4e-e8d34b74b710/thumbnail_04a3fc76.jpg"
      },
      {
        title: "ATUALIZAÇÃO - TUDO SOBRE PEQUENAS MUDANÇAS APÓS RECENTES ATUALIZAÇÕES DO JOGO",
        description: "Conteúdo em breve. Esta aula será adicionada na próxima atualização do curso.",
        embed: "",
        thumb: "capa.png",
        comingSoon: true
      }
    ]
  },
  {
    id: "8ball",
    title: "Curso 8 Ball Pool",
    description: "Conteúdo exclusivo sobre 8 Ball.",
    lessons: [
      {
        title: "Em breve",
        description: "As primeiras aulas de 8 Ball serão adicionadas em breve.",
        embed: "",
        thumb: "capa.png",
        comingSoon: true
      }
    ]
  }
];

    return {
      statusCode: 200,
      body: JSON.stringify({ courses }),
    };
  } catch (error) {
    console.error("Erro em get-lessons:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno" }),
    };
  }
};