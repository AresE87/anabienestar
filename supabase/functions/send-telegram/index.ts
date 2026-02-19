// ═══════════════════════════════════════════════════
// Send Telegram Message — Supabase Edge Function
// Called from Admin to send content to clientas
// ═══════════════════════════════════════════════════
// Deploy: supabase functions deploy send-telegram
// Requires: TELEGRAM_BOT_TOKEN, SUPABASE_SERVICE_ROLE_KEY secrets

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendMessage(chatId: number, text: string) {
  return fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function sendAudio(chatId: number, audioUrl: string, caption: string) {
  return fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendAudio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, audio: audioUrl, caption, parse_mode: "HTML" }),
  });
}

async function sendVideo(chatId: number, videoUrl: string, caption: string) {
  return fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVideo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, video: videoUrl, caption, parse_mode: "HTML" }),
  });
}

async function sendDocument(chatId: number, documentUrl: string, caption: string) {
  return fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, document: documentUrl, caption, parse_mode: "HTML" }),
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, message, url, destinatario_id, titulo } = await req.json();

    // Get target subscribers
    let query = supabase
      .from("telegram_suscriptores")
      .select("chat_id, usuario_id")
      .eq("activo", true);

    if (destinatario_id && destinatario_id !== "todas") {
      query = query.eq("usuario_id", destinatario_id);
    }

    const { data: subs, error } = await query;

    if (error || !subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No hay suscriptores activos", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    const errors: string[] = [];

    for (const sub of subs) {
      try {
        const caption = titulo
          ? `<b>${titulo}</b>\n${message || ""}`
          : message || "";

        switch (type) {
          case "audio":
            if (url) await sendAudio(sub.chat_id, url, caption);
            else await sendMessage(sub.chat_id, caption);
            break;
          case "video":
            if (url) await sendVideo(sub.chat_id, url, caption);
            else await sendMessage(sub.chat_id, caption);
            break;
          case "document":
          case "pdf":
            if (url) await sendDocument(sub.chat_id, url, caption);
            else await sendMessage(sub.chat_id, caption);
            break;
          case "message":
          default:
            await sendMessage(sub.chat_id, caption);
            break;
        }
        sent++;
      } catch (e) {
        errors.push(`chat_id ${sub.chat_id}: ${e.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, total: subs.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
