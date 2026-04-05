const admin = require("firebase-admin");
const fetch = require("node-fetch");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

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
    const thumbnailFileName =
      video.thumbnailFileName || video.ThumbnailFileName || null;

    if (!title || !guid) continue;

    if (thumbnailFileName) {
      thumbMap[title] = `https://${BUNNY_CDN_HOST}/${guid}/${thumbnailFileName}`;
    }
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
  description: "Conteúdo completo e estratégico para evolução no 8 Ball Pool.",
  lessons: [
    {
      title: "AULA 01 - PLANEJAMENTO DE JOGO - A ARTE DE NÃO ERRAR",
      description: "Aprenda a estruturar suas jogadas e reduzir erros com planejamento estratégico.",
      embed: "https://iframe.mediadelivery.net/embed/625484/849c4d54-54b0-41a6-94c4-84c32a512430",
      thumb: bunnyThumbMap["AULA 01 - PLANEJAMENTO DE JOGO - A ARTE DE NÃO ERRAR"] || "capa.png"
    },
    {
      title: "AULA 02 - APRENDA A DAR A TACADA MAIS IMPORTANTE DO JOGO - A TACADA INICIAL",
      description: "Domine a tacada inicial e comece cada partida com vantagem.",
      embed: "https://iframe.mediadelivery.net/embed/625484/48349713-acf5-4eba-bdb7-cff88c3e0e32",
      thumb: bunnyThumbMap["AULA 02 - APRENDA A DAR A TACADA MAIS IMPORTANTE DO JOGO - A TACADA INICIAL"] || "capa.png"
    },
    {
      title: "AULA 03 - COMO DAR TACADA INICIAL COM QUALQUER TACO",
      description: "Aprenda a adaptar sua tacada inicial independentemente do taco utilizado.",
      embed: "https://iframe.mediadelivery.net/embed/625484/1686a5c0-797d-425f-a7b0-5111c1bc1634",
      thumb: bunnyThumbMap["AULA 03 - COMO DAR TACADA INICIAL COM QUALQUER TACO"] || "capa.png"
    },
    {
      title: "AULA 04 - MIRA SECUNDÁRIA_ APRENDA USÁ-LA",
      description: "Entenda e aplique a mira secundária para aumentar sua precisão.",
      embed: "https://iframe.mediadelivery.net/embed/625484/f2b11e22-2f6e-42b9-9ad6-70a607732e61",
      thumb: bunnyThumbMap["AULA 04 - MIRA SECUNDÁRIA_ APRENDA USÁ-LA"] || "capa.png"
    },
    {
      title: "AULA 05 - EFEITO PARA TRÁS  - DOMÍNIO TOTAL",
      description: "Domine o efeito para trás e controle melhor a posição da bola branca.",
      embed: "https://iframe.mediadelivery.net/embed/625484/f34b2334-c12f-4a21-801d-cdff02b9a6ae",
      thumb: bunnyThumbMap["AULA 05 - EFEITO PARA TRÁS  - DOMÍNIO TOTAL"] || "capa.png"
    },
    {
      title: "AULA 06 - EFEITOS LATERAIS - APRENDA A USÁ-LOS",
      description: "Aprenda a utilizar efeitos laterais para posicionamento e estratégia.",
      embed: "https://iframe.mediadelivery.net/embed/625484/ff044046-be0d-4284-81f9-5daffe856d6e",
      thumb: bunnyThumbMap["AULA 06 - EFEITOS LATERAIS - APRENDA A USÁ-LOS"] || "capa.png"
    },
    {
      title: "AULA 07 - APRENDA A USAR EFEITOS COMBINADOS",
      description: "Combine diferentes efeitos para jogadas mais avançadas.",
      embed: "https://iframe.mediadelivery.net/embed/625484/6cf28833-e081-4da1-af9b-c82446f26647",
      thumb: bunnyThumbMap["AULA 07 - APRENDA A USAR EFEITOS COMBINADOS"] || "capa.png"
    },
    {
      title: "AULA 08 - COMO DESBLOQUEAR BOLAS E DESTRAVAR O JOGO - O CAMINHO DA VITÓRIA",
      description: "Aprenda a liberar bolas travadas e retomar o controle da partida.",
      embed: "https://iframe.mediadelivery.net/embed/625484/98351d7a-4fcc-4f7c-9173-7c019a4bbda1",
      thumb: bunnyThumbMap["AULA 08 - COMO DESBLOQUEAR BOLAS E DESTRAVAR O JOGO - O CAMINHO DA VITÓRIA"] || "capa.png"
    },
    {
      title: "AULA 09 - COMO ENCAÇAPAR BOLAS BLOQUEADAS - APRENDA COMO MATÁ-LAS",
      description: "Técnicas para encaçapar bolas mesmo em situações difíceis.",
      embed: "https://iframe.mediadelivery.net/embed/625484/907b4f9d-49af-47aa-8ad8-3b3640cb7c47",
      thumb: bunnyThumbMap["AULA 09 - COMO ENCAÇAPAR BOLAS BLOQUEADAS - APRENDA COMO MATÁ-LAS"] || "capa.png"
    },
    {
      title: "AULA 10 -COMO ENCAÇAPAR BOLAS NA CAÇAPA DO MEIO SEM ÂNGULO",
      description: "Domine jogadas difíceis nas caçapas do meio.",
      embed: "https://iframe.mediadelivery.net/embed/625484/cf5b9620-5ce8-44b9-ad40-8b62654895d3",
      thumb: bunnyThumbMap["AULA 10 -COMO ENCAÇAPAR BOLAS NA CAÇAPA DO MEIO SEM ÂNGULO"] || "capa.png"
    },
    {
      title: "AULA 11 - APRENDA A BLOQUEAR SEU ADVERSÁRIO",
      description: "Estratégias defensivas para limitar o jogo do adversário.",
      embed: "https://iframe.mediadelivery.net/embed/625484/e549a7fb-c86c-4816-8364-d12e9975be98",
      thumb: bunnyThumbMap["AULA 11 - APRENDA A BLOQUEAR SEU ADVERSÁRIO"] || "capa.png"
    },
    {
      title: "AULA 12 - COMO EXECUATAR UM MERGULHO DUPLO",
      description: "Aprenda a executar jogadas técnicas avançadas com precisão.",
      embed: "https://iframe.mediadelivery.net/embed/625484/f4ae64ec-b5ec-4d0a-affe-2ce3924afdd4",
      thumb: bunnyThumbMap["AULA 12 - COMO EXECUATAR UM MERGULHO DUPLO"] || "capa.png"
    },
    {
      title: "AULA 13 - COMO NÃO FALIR_ MELHORES TACOS NA ORDEM CRESCENTE",
      description: "Escolha os melhores tacos e evolua seu desempenho no jogo.",
      embed: "https://iframe.mediadelivery.net/embed/625484/70e91df3-519e-41a1-b576-ad20d77581dd",
      thumb: bunnyThumbMap["AULA 13 - COMO NÃO FALIR_ MELHORES TACOS NA ORDEM CRESCENTE"] || "capa.png"
    },
    {
      title: "AULA 14 - A LÓGICA POR TRÁS DAS TABELAS NO 8 BALL POOL",
      description: "Entenda a lógica das tabelas para jogadas mais eficientes.",
      embed: "https://iframe.mediadelivery.net/embed/625484/6bdf735b-22f5-4cf0-b904-3cb82232fac9",
      thumb: bunnyThumbMap["AULA 14 - A LÓGICA POR TRÁS DAS TABELAS NO 8 BALL POOL"] || "capa.png"
    },
    {
      title: "AULA 15 - COMO NÃO ERRAR TABELAS NO 8 BALL POOL",
      description: "Aprimore sua precisão nas jogadas com tabela.",
      embed: "https://iframe.mediadelivery.net/embed/625484/ce76dc75-81d0-4dc1-b8d8-d27607ae60f9",
      thumb: bunnyThumbMap["AULA 15 - COMO NÃO ERRAR TABELAS NO 8 BALL POOL"] || "capa.png"
    },
    {
      title: "AULA 16 - PLANEJAMENTO DE JOGO COM TABELA NA BOLA 8",
      description: "Planeje jogadas decisivas usando tabelas na bola final.",
      embed: "https://iframe.mediadelivery.net/embed/625484/adaf0c1a-c1b7-419e-aefd-4195903660fa",
      thumb: bunnyThumbMap["AULA 16 - PLANEJAMENTO DE JOGO COM TABELA NA BOLA 8"] || "capa.png"
    },
    {
      title: "AULA 17 -  COMO MATAR BOLAS SEM MIRA - APRENDA JOGAR SEM LINHA GUIA",
      description: "Aprenda a jogar sem linha guia e desenvolva percepção avançada.",
      embed: "https://iframe.mediadelivery.net/embed/625484/f3835791-5f3e-433e-b2f0-8b649528f050",
      thumb: bunnyThumbMap["AULA 17 -  COMO MATAR BOLAS SEM MIRA - APRENDA JOGAR SEM LINHA GUIA"] || "capa.png"
    },
    {
      title: "AULA 18 - A DIFERENÇA DO JOGO SEM MIRA (PLANEJAMENTO)",
      description: "Entenda o impacto do jogo sem mira no planejamento estratégico.",
      embed: "https://iframe.mediadelivery.net/embed/625484/cc4a9e4f-23a7-4560-9b92-76372dcc715c",
      thumb: bunnyThumbMap["AULA 18 - A DIFERENÇA DO JOGO SEM MIRA (PLANEJAMENTO)"] || "capa.png"
    }
  ]
}
];

    return {
      statusCode: 200,
      body: JSON.stringify({ courses }),
    };

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno" }),
    };
  }
};