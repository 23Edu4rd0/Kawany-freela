import { createClient } from "redis";

let redis = null;

export default async (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Admin-Password",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    if (!redis) {
      const redisUrl = process.env.moments_REDIS_URL;

      if (!redisUrl) {
        console.error(
          "ERRO: Variável moments_REDIS_URL não está no process.env",
        );
        return res
          .status(500)
          .json({ error: "Configuração do banco ausente." });
      }

      redis = createClient({ url: redisUrl });

      redis.on("error", (err) => console.error("Erro Interno Redis:", err));

      await redis.connect();
    } else if (!redis.isOpen) {
      await redis.connect();
    }
  } catch (connError) {
    console.error("Falha crítica ao conectar no Redis:", connError);
    return res
      .status(503)
      .json({ error: "Falha de conexão com o banco de dados." });
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "kawany2025";

  try {
    if (req.method === "GET") {
      const result = await redis.get("moments");
      const moments = result ? JSON.parse(result) : [];
      return res.status(200).json(moments);
    }

    if (req.method === "POST") {
      if (req.headers["x-admin-password"] !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Senha incorreta." });
      }

      const newItem = req.body;
      if (!newItem || !newItem.title) {
        return res.status(400).json({ error: "Dados inválidos." });
      }

      const result = await redis.get("moments");
      const moments = result ? JSON.parse(result) : [];

      moments.push(newItem);
      await redis.set("moments", JSON.stringify(moments));

      return res.status(200).json({ success: true, item: newItem });
    }

    if (req.method === "DELETE") {
      if (req.headers["x-admin-password"] !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Senha incorreta." });
      }

      const { id, clearAll } = req.query;

      if (clearAll === "true") {
        await redis.del("moments");
        return res
          .status(200)
          .json({ success: true, message: "Tudo apagado." });
      }

      if (!id) {
        return res.status(400).json({ error: "ID não informado." });
      }

      const result = await redis.get("moments");
      let moments = result ? JSON.parse(result) : [];

      moments = moments.filter((item) => item.id !== id);
      await redis.set("moments", JSON.stringify(moments));

      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: "Método não permitido." });
  } catch (error) {
    console.error("Erro na requisição da API:", error);
    return res
      .status(500)
      .json({ error: "Erro interno.", details: error.message });
  }
};