import { createClient } from "redis";
import fs from "fs";
import path from "path";

let redis = null;

async function getRedis() {
  const redisUrl = process.env.moments_REDIS_URL;
  if (!redisUrl) return null; // Retorna null se não tiver banco configurado

  if (!redis) {
    redis = createClient({ url: redisUrl });
    redis.on("error", (err) => console.error("Erro Redis:", err));
    await redis.connect();
  } else if (!redis.isOpen) {
    await redis.connect();
  }
  return redis;
}

export default async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,DELETE,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Admin-Password",
  );

  if (req.method === "OPTIONS") return res.status(200).end();

  const db = await getRedis();
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "kawany2025";

  // --- BOOTSTRAP DO ADMIN: junta moments + músicas em 1 única resposta ---
  if (req.query.action === "admin-bootstrap") {
    let files = [];
    try {
      const musicDir = path.join(process.cwd(), "assets", "music");
      files = fs
        .readdirSync(musicDir)
        .filter((f) => /\.(mp3|wav|ogg|aac)$/i.test(f));
    } catch (e) {
      files = [];
    }

    try {
      const [momentsRaw, activeFile] = await Promise.all([
        db ? db.get("moments") : Promise.resolve(null),
        db ? db.get("active-music") : Promise.resolve(null),
      ]);

      return res.status(200).json({
        moments: momentsRaw ? JSON.parse(momentsRaw) : [],
        musicFiles: files,
        activeMusic: activeFile || "Só Você - Tim Maia.mp3",
      });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao carregar dados do admin." });
    }
  }

  // --- MÚSICAS: LISTAR ---
  if (req.query.action === "list-music") {
    try {
      const musicDir = path.join(process.cwd(), "assets", "music");
      const files = fs
        .readdirSync(musicDir)
        .filter((f) => /\.(mp3|wav|ogg|aac)$/i.test(f));
      return res.status(200).json(files);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao ler pasta" });
    }
  }

  // --- MÚSICAS: GET ATIVA ---
  if (req.query.action === "get-active-music") {
    const activeFile = db ? await db.get("active-music") : "Só Você - Tim Maia.mp3";
    return res
      .status(200)
      .json({ activeFile: activeFile || "Só Você - Tim Maia.mp3" });
  }

  // --- MÚSICAS: SET ATIVA ---
  if (req.method === "POST" && req.query.action === "set-music") {
    if (req.headers["x-admin-password"] !== ADMIN_PASSWORD)
      return res.status(401).json({ error: "Senha incorreta." });
    if (db) await db.set("active-music", req.body.fileName);
    return res.status(200).json({ success: true });
  }

  // --- MOMENTOS ---
  if (!db) return res.status(503).json({ error: "Banco de dados indisponível" });

  try {
    if (req.method === "GET") {
      const result = await db.get("moments");
      return res.status(200).json(result ? JSON.parse(result) : []);
    }

    if (req.method === "POST") {
      if (req.headers["x-admin-password"] !== ADMIN_PASSWORD)
        return res.status(401).json({ error: "Senha incorreta." });
      const result = await db.get("moments");
      const moments = result ? JSON.parse(result) : [];
      moments.push(req.body);
      await db.set("moments", JSON.stringify(moments));
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      if (req.headers["x-admin-password"] !== ADMIN_PASSWORD)
        return res.status(401).json({ error: "Senha incorreta." });
      if (req.query.clearAll === "true") await db.del("moments");
      else {
        const result = await db.get("moments");
        let moments = result ? JSON.parse(result) : [];
        moments = moments.filter((i) => i.id !== req.query.id);
        await db.set("moments", JSON.stringify(moments));
      }
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: "Erro interno." });
  }
};