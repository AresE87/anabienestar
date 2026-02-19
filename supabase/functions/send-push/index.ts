// ═══════════════════════════════════════════════════
// Send Push Notification — Supabase Edge Function
// Sends Web Push notifications to subscribed users
// ═══════════════════════════════════════════════════
// Deploy: supabase functions deploy send-push
// Requires secrets:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:your@email.com)
//   SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@anabienestarintegral.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push requires cryptographic signing — using web-push compatible approach
// For production, use the npm web-push library via Deno npm: specifier
async function sendWebPush(subscription: any, payload: string) {
  // This is a simplified implementation.
  // For full Web Push with VAPID, you would use:
  // import webpush from "npm:web-push";
  // webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  // await webpush.sendNotification(subscription, payload);

  // For now, we'll use the web-push npm package
  const webpush = await import("npm:web-push@3.6.7");
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  return webpush.sendNotification(subscription, payload);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, body, url, destinatario_id } = await req.json();

    // Get push subscriptions
    let query = supabase
      .from("push_subscriptions")
      .select("usuario_id, subscription_json");

    if (destinatario_id && destinatario_id !== "todas") {
      query = query.eq("usuario_id", destinatario_id);
    }

    const { data: subs, error } = await query;

    if (error || !subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No hay suscriptores push", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title: title || "Anabienestar Integral",
      body: body || "Tienes una nueva notificacion",
      icon: "/logo192.png",
      badge: "/logo192.png",
      url: url || "/",
      tag: "anabienestar-" + Date.now(),
    });

    let sent = 0;
    const errors: string[] = [];

    for (const sub of subs) {
      try {
        if (sub.subscription_json) {
          await sendWebPush(sub.subscription_json, payload);
          sent++;
        }
      } catch (e) {
        errors.push(`user ${sub.usuario_id}: ${e.message}`);
        // If subscription is expired/invalid, remove it
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("usuario_id", sub.usuario_id);
        }
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
