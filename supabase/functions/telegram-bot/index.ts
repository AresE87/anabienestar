// ═══════════════════════════════════════════════════
// Telegram Bot — Supabase Edge Function
// Receives messages from Telegram and links users
// ═══════════════════════════════════════════════════
// Deploy: supabase functions deploy telegram-bot --no-verify-jwt
// Set secrets:
//   supabase secrets set TELEGRAM_BOT_TOKEN=your_token_here
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
//
// After deploying, set webhook:
//   curl https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<PROJECT_REF>.supabase.co/functions/v1/telegram-bot

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendTelegramMessage(chatId: number, text: string, parseMode = "HTML") {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });
  return res.json();
}

async function handleStart(chatId: number, firstName: string) {
  await sendTelegramMessage(
    chatId,
    `Hola ${firstName}! Bienvenida a <b>Anabienestar Integral</b>.\n\n` +
    `Para vincular tu cuenta, escribi tu email:\n` +
    `<code>/vincular tuemail@ejemplo.com</code>\n\n` +
    `Una vez vinculada, vas a recibir:\n` +
    `- Nuevos materiales y audios\n` +
    `- Recordatorios de citas\n` +
    `- Mensajes motivacionales de Ana Karina`
  );
}

async function handleVincular(chatId: number, email: string, firstName: string) {
  if (!email || !email.includes("@")) {
    await sendTelegramMessage(chatId, "Email invalido. Escribi: /vincular tuemail@ejemplo.com");
    return;
  }

  // Look up user by email
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, nombre, email")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (!usuario) {
    await sendTelegramMessage(
      chatId,
      `No encontre una cuenta con ese email. Verifica que sea el mismo email que usas para iniciar sesion en la app.`
    );
    return;
  }

  // Save or update telegram subscription
  const { error } = await supabase.from("telegram_suscriptores").upsert(
    {
      usuario_id: usuario.id,
      chat_id: chatId,
      nombre_telegram: firstName || null,
      activo: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "usuario_id" }
  );

  if (error) {
    console.error("Error guardando suscriptor:", error);
    await sendTelegramMessage(chatId, "Hubo un error. Intenta de nuevo.");
    return;
  }

  await sendTelegramMessage(
    chatId,
    `Listo! Tu cuenta de <b>${usuario.nombre || usuario.email}</b> esta vinculada.\n\n` +
    `Vas a recibir notificaciones de Ana Karina por aca.`
  );
}

async function handleHelp(chatId: number) {
  await sendTelegramMessage(
    chatId,
    `<b>Comandos disponibles:</b>\n\n` +
    `/start - Iniciar el bot\n` +
    `/vincular email - Vincular tu cuenta\n` +
    `/desvincular - Dejar de recibir notificaciones\n` +
    `/help - Ver esta ayuda`
  );
}

async function handleDesvincular(chatId: number) {
  const { data: sub } = await supabase
    .from("telegram_suscriptores")
    .select("id")
    .eq("chat_id", chatId)
    .maybeSingle();

  if (sub) {
    await supabase
      .from("telegram_suscriptores")
      .update({ activo: false })
      .eq("chat_id", chatId);
    await sendTelegramMessage(chatId, "Listo, dejaste de recibir notificaciones. Podes vincular de nuevo cuando quieras con /vincular");
  } else {
    await sendTelegramMessage(chatId, "No tenes una cuenta vinculada.");
  }
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("OK", { status: 200 });
    }

    const update = await req.json();
    const message = update.message;
    if (!message || !message.text) {
      return new Response("OK", { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const firstName = message.from?.first_name || "amiga";

    if (text === "/start") {
      await handleStart(chatId, firstName);
    } else if (text.startsWith("/vincular")) {
      const email = text.replace("/vincular", "").trim();
      await handleVincular(chatId, email, firstName);
    } else if (text === "/desvincular") {
      await handleDesvincular(chatId);
    } else if (text === "/help") {
      await handleHelp(chatId);
    } else {
      await sendTelegramMessage(
        chatId,
        `No entendi ese comando. Escribi /help para ver los comandos disponibles.`
      );
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Error:", err);
    return new Response("Error", { status: 500 });
  }
});
