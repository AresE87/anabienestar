# Guia de Setup — Integraciones Anabienestar

## 1. Crear tablas en Supabase

Ejecutar el SQL de `supabase/migrations/001_nuevas_tablas_v3.sql` en el SQL Editor de Supabase Dashboard.

Esto crea:
- `recetas` — recetas que ven las clientas
- `telegram_suscriptores` — vincula Telegram con cuentas
- `push_subscriptions` — suscripciones de push notifications
- `tenants` — estructura multi-tenant para futuro SaaS
- `tenant_config` — configuracion por tenant

## 2. Telegram Bot (GRATIS)

### Paso 1: Crear el bot
1. Abrir Telegram y buscar @BotFather
2. Enviar `/newbot`
3. Elegir nombre: `Anabienestar Bot`
4. Elegir username: `anabienestar_bot` (debe terminar en "bot")
5. BotFather te da un token como: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

### Paso 2: Configurar secrets en Supabase
```bash
supabase secrets set TELEGRAM_BOT_TOKEN=tu_token_aqui
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Paso 3: Deploy Edge Functions
```bash
# Instalar Supabase CLI si no lo tenes
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref rnbyxwcrtulxctplerqs

# Deploy funciones
supabase functions deploy telegram-bot --no-verify-jwt
supabase functions deploy send-telegram
supabase functions deploy send-push
```

### Paso 4: Configurar webhook de Telegram
```bash
curl "https://api.telegram.org/bot<TU_TOKEN>/setWebhook?url=https://rnbyxwcrtulxctplerqs.supabase.co/functions/v1/telegram-bot"
```

### Paso 5: Probar
1. Buscar tu bot en Telegram
2. Enviar `/start`
3. Enviar `/vincular tuemail@ejemplo.com`

## 3. Push Notifications (GRATIS)

### Paso 1: Generar VAPID keys
```bash
npx web-push generate-vapid-keys
```

Esto da algo como:
```
Public Key: BNbx...
Private Key: T3Yj...
```

### Paso 2: Configurar
- En `.env`: agregar `REACT_APP_VAPID_PUBLIC_KEY=BNbx...`
- En Supabase secrets:
```bash
supabase secrets set VAPID_PUBLIC_KEY=BNbx...
supabase secrets set VAPID_PRIVATE_KEY=T3Yj...
supabase secrets set VAPID_SUBJECT=mailto:tu@email.com
```

### Paso 3: Deploy
```bash
supabase functions deploy send-push
```

## 4. Deploy a Vercel

```bash
git add .
git commit -m "v3.0: recetas, telegram, push, multi-tenant"
git push
```

Vercel deploys automaticamente desde main.

## 5. Futuro: WhatsApp

Requiere:
1. Meta Business Account (verificacion tarda 1-2 dias)
2. Numero de WhatsApp Business verificado
3. Templates de mensajes aprobados por Meta
4. Costo: ~$0.01-0.04 por mensaje

Se implementa cuando haya clientes pagando el SaaS.
