import { createClient } from "redis";
import fs from "fs";
import path from "path";

let redis = null;

export default async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,DELETE,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Password");

  if (req.method === "OPTIONS") return res.status(200).end();

  // 1. Endpoint para Listar Músicas (Sem Redis, lê da pasta correta)
  if (req.method === "GET" && req.query.action === "list-music") {
    try {
      // CORREÇÃO: Caminho apontando para /assets/music na raiz do projeto
      const musicDir = path.join(process.cwd(), "assets", "music");
      
      console.log("Buscando músicas em:", musicDir); 
      
      const files = fs.readdirSync(musicDir).filter(file => 
        /\.(mp3|wav|ogg|aac)$/i.test(file)
      );
      return res.status(200).json(files);
    } catch (err) {
      console.error("Erro ao ler pasta de músicas:", err);
      return res.status(500).json({ error: "Erro ao ler pasta: " + err.message });
    }
  }

  // --- Lógica do Redis (Conexão para Momentos) ---
  try {
    if (!redis) {
      const redisUrl = process.env.moments_REDIS_URL;
      if (!redisUrl) throw new Error("Configuração ausente");
      redis = createClient({ url: redisUrl });
      await redis.connect();
    } else if (!redis.isOpen) {
      await redis.connect();
    }
  } catch (connError) {
    console.error("Erro de conexão Redis:", connError);
    return res.status(503).json({ error: "Falha de conexão com banco." });
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "kawany2025";

  // 2. Endpoints do Redis (CRUD de Momentos)
  try {
    if (req.method === "GET") {
      const result = await redis.get("moments");
      return res.status(200).json(result ? JSON.parse(result) : []);
    }

    if (req.method === "POST") {
      if (req.headers["x-admin-password"] !== ADMIN_PASSWORD) return res.status(401).json({ error: "Senha incorreta." });
      
      const result = await redis.get("moments");
      const moments = result ? JSON.parse(result) : [];
      moments.push(req.body);
      await redis.set("moments", JSON.stringify(moments));
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      if (req.headers["x-admin-password"] !== ADMIN_PASSWORD) return res.status(401).json({ error: "Senha incorreta." });
      
      const { id, clearAll } = req.query;
      if (clearAll === "true") {
        await redis.del("moments");
        return res.status(200).json({ success: true });
      }
      
      const result = await redis.get("moments");
      let moments = result ? JSON.parse(result) : [];
      moments = moments.filter((item) => item.id !== id);
      await redis.set("moments", JSON.stringify(moments));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Método não permitido." });
  } catch (error) {
    console.error("Erro na API de Momentos:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};