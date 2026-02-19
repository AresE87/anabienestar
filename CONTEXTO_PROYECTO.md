# AnabienestarIntegral - Contexto del Proyecto

> Este archivo lo usa Claude Code para retomar contexto si se corta la sesion.
> **Lee este archivo SIEMPRE al inicio de una nueva sesion.**
> Actualizado: 2026-02-19

---

## Que es este proyecto
App de wellness/nutricion para **Ana Karina** (nutricionista y coach en Uruguay).
Tiene 2 interfaces:
- **App movil** (max 390px, PWA) para las clientas
- **Dashboard admin** (desktop, sidebar) para Ana Karina

## Stack tecnico
- React 19 + React Router 7 (SPA)
- Supabase (auth, DB, storage, realtime)
- Recharts (graficos de peso)
- Lucide React (iconos)
- Deploy en Vercel/Netlify (PWA)
- Service Worker para push notifications

## Estructura de archivos clave
```
src/
  App.js                    - Router principal con AuthGate (admin vs clienta)
  supabaseClient.js         - Config Supabase
  context/
    AuthContext.js           - Auth global (login, logout, perfil, roles)
    AppContext.js            - Estado app (checklist, mood, peso, racha)
  screens/
    Login.js                - Pantalla de login
    Home.js                 - Dashboard clienta (checklist, mood, frase, receta)
    Progreso.js             - Graficos de peso (recharts)
    Chat.js                 - Chat con Ana (texto, fotos, videos) [v4.0]
    Recetas.js              - Catalogo de recetas (con fallback local)
    Material.js             - eBooks y videos (existe pero NO esta en BottomNav)
    Citas.js                - Agenda y notas de sesion
    Admin.js                - Dashboard admin completo (10 pestanas)
  components/
    BottomNav.js            - Nav inferior: Inicio, Progreso, Chat, Recetas, Citas
    AdminClientas.js        - CRUD clientas
    AdminFichas.js          - CRUD fichas de programas
    AdminMaterial.js        - CRUD eBooks/PDFs
    AdminVideos.js          - CRUD videos/audios
    AdminRecetas.js         - CRUD recetas
    AdminMensajes.js        - Panel de mensajes/chat para admin [v4.0]
  utils/
    pushNotifications.js    - Push notifications (VAPID, SW)
    seedData.js             - Insertar datos de ejemplo
```

## Tablas de Supabase
| Tabla | Descripcion |
|-------|-------------|
| usuarios | Perfiles (id, nombre, email, rol, avatar) |
| fichas | Programa de cada clienta (peso_inicial, actual, objetivo, fecha_inicio) |
| checklist_items | Daily checklist (5 items, upsert por dia) |
| estados_animo | Mood diario (happy/neutral/sad/fire) |
| registros_peso | Historico de pesos por semana |
| notas_sesion | Notas de la clienta para hablar con Ana |
| citas | Sesiones agendadas (fecha, tipo, modalidad) |
| frases | Frases motivacionales del dia |
| recetas | Recetas con emoji, categoria, tiempo, calorias |
| material | eBooks/PDFs |
| videos | Videos y audios por categoria |
| notificaciones | Notificaciones enviadas por admin |
| telegram_suscriptores | Suscriptores del bot de Telegram |
| push_subscriptions | Suscripciones push (VAPID) |
| conversaciones | Chat: una por clienta (no_leidos_admin, ultimo_mensaje) [v4.0] |
| mensajes | Chat: mensajes con tipo texto/imagen/video, media_url [v4.0] |

**Storage bucket:** `chat-media` (publico, para fotos/videos del chat)

## Paleta de colores
- Verde oscuro: #3d5c41 (sageDark)
- Verde claro: #7a9e7e (sage)
- Crema: #f8f4ee (cream)
- Dorado: #b8956a (gold)
- Naranja: #c4762a (orange, alertas)

## Tipografias
- Titulos: "Playfair Display" (serif, elegante)
- Body/UI: "Jost" (sans-serif, moderna)

## Historial de versiones
| Version | Descripcion |
|---------|-------------|
| v1.0 | App base con localStorage |
| v2.0 | Conectar Admin, Citas y Home a Supabase + 3 bug fixes |
| v3.0 | Recetas Supabase, Telegram bot, push notifications, multi-tenant |
| v3.1 | Resiliencia (fallbacks si tablas no existen) + seedData |
| v4.0 | Sistema de chat clienta-Ana (texto, fotos, videos, realtime, notificaciones) |

## Notas importantes
- Supabase URL: https://rnbyxwcrtulxctplerqs.supabase.co
- VAPID keys necesitan ser generadas con `npx web-push generate-vapid-keys`
- Las tablas del chat requieren ejecutar `supabase_chat.sql` en el SQL Editor
- Los constraints basicos estan en `supabase_constraints.sql`
- El archivo `.env` tiene REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY, REACT_APP_VAPID_PUBLIC_KEY

---

## COSAS QUE EDGARDO TIENE QUE HACER MANUALMENTE

### Paso 1: Push de los commits (URGENTE)
Hay 3 commits locales sin pushear:
```
git push
```
Esto sube v3.1 + v4.0 + docs al remoto.

### Paso 2: Crear tablas del chat en Supabase
1. Ir a https://supabase.com → tu proyecto → SQL Editor
2. Copiar TODO el contenido de `supabase_chat.sql` (esta en la raiz del repo)
3. Ejecutar el SQL
4. Esto crea: tablas `conversaciones` y `mensajes`, indices, politicas RLS, y el bucket de storage

### Paso 3: Verificar bucket de storage
1. Ir a Supabase → Storage
2. Verificar que existe el bucket `chat-media`
3. Si no existe, crearlo manualmente:
   - Nombre: `chat-media`
   - Public: SI
4. Verificar que las politicas de storage estan activas (el SQL las crea)

### Paso 4: Habilitar Realtime en Supabase
1. Ir a Supabase → Database → Replication
2. Asegurarse que las tablas `mensajes` y `conversaciones` tienen Realtime habilitado
3. Si no, activarlo desde ahi (toggle ON)

### Paso 5: Probar el chat end-to-end
1. Abrir la app como clienta desde el celular
2. Ir a la pestana "Chat" (icono 💬 en la nav inferior)
3. Enviar un mensaje de texto
4. Enviar una foto
5. Abrir el dashboard admin como Ana
6. Ir a "Mensajes" en el sidebar (deberia mostrar badge con numero)
7. Seleccionar la conversacion y responder
8. Verificar que la clienta recibe la respuesta en tiempo real

### Paso 6: Push Notifications (opcional, puede hacerse despues)
1. Generar VAPID keys: `npx web-push generate-vapid-keys`
2. Copiar la public key al `.env` como `REACT_APP_VAPID_PUBLIC_KEY=...`
3. Guardar la private key como secreto en Supabase (para edge functions)
4. Crear archivo `public/sw.js` con el handler de push events
5. Crear edge function en Supabase para enviar push cuando llega un mensaje

---

## PASOS FUTUROS DEL PROYECTO (para proximas sesiones con Claude)

### Prioridad Alta
- [ ] **Acceso a Material**: La pantalla Material.js existe pero ya no esta en el BottomNav (fue reemplazada por Chat). Opciones: (a) agregar enlace desde Home, (b) crear un menu hamburguesa, (c) poner 6 items en el BottomNav con scroll
- [ ] **Edge function push notifications para chat**: Cuando una clienta envia un mensaje, enviar push notification al celular de Ana (no solo la notificacion del navegador)
- [ ] **Archivo public/sw.js**: Crear el Service Worker para manejar push events (mostrar notificacion nativa en el celular de Ana)

### Prioridad Media
- [ ] **Sonido de notificacion**: Reproducir un sonido sutil cuando Ana recibe un mensaje en el dashboard
- [ ] **Indicador "escribiendo..."**: Mostrar cuando la otra persona esta escribiendo
- [ ] **Indicador "en linea"**: Mostrar cuando la clienta/Ana esta conectada
- [ ] **Mensajes de voz**: Boton para grabar y enviar audios
- [ ] **Respuestas rapidas para Ana**: Templates de respuestas frecuentes en el chat admin
- [ ] **Buscar en mensajes**: Buscar texto dentro de las conversaciones

### Prioridad Baja
- [ ] **Telegram bot mejorado**: Conectar el chat de la app con el bot de Telegram (mensajes bidireccionales)
- [ ] **Estadisticas de engagement**: Dashboard con metricas de uso (checklist completion rate, dias activos, etc.)
- [ ] **Exportar datos**: Que Ana pueda exportar fichas/progreso a PDF
- [ ] **Modo oscuro**: Tema dark para la app movil
- [ ] **Multi-idioma**: Soporte para portugues (clientas de Brasil)
- [ ] **Programa grupal**: Funcionalidad para grupos/challenges entre clientas

---

## RESUMEN DE LA ULTIMA SESION (2026-02-19)

### Lo que se hizo:
1. Revisamos todo el repositorio completo para entender el estado
2. Los cambios pendientes de la sesion anterior (v3.1: fallbacks de resiliencia + seedData) se commitearon
3. Se implemento el sistema de chat completo (v4.0):
   - Chat.js: pantalla para clientas con texto, fotos, videos
   - AdminMensajes.js: panel de mensajes para Ana en el dashboard
   - Badge de mensajes no leidos en sidebar del admin
   - Notificaciones nativas del navegador para Ana
   - Flash en titulo de pagina cuando llega mensaje
   - Supabase Realtime para mensajes instantaneos
   - supabase_chat.sql con todas las tablas, RLS y storage
4. Se actualizo BottomNav (Chat reemplazo Material) y App.js (nueva ruta /chat)
5. Se verifico que la app compila sin errores ni warnings
6. Se crearon 3 commits detallados
7. Se creo este archivo de contexto

### Comunicacion con el usuario:
- El usuario prefiere comunicacion en espanol
- Pide commits detallados con version
- Quiere que se revise todo el repo antes de hacer cambios
- Valora la persistencia de contexto entre sesiones
- El proyecto es para una nutricionista real (Ana Karina) en Uruguay
