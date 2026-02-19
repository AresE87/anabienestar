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
| material | eBooks/PDFs (campo para_todas + visible) |
| material_usuarios | Asignacion de material a clientas individuales (junction table) [v4.3] |
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
| v4.1 | PDFs de guias reales en public/pdfs/ + seedData actualizado |
| v4.2 | Fix auth race condition (login→logout→login colgado) + fix Login.js error handling |
| v4.3 | Sistema de asignacion de material a clientas individuales |
| v4.3.1 | Fix material admin: SQL migracion columnas + mejor UX carga guias |

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

### Paso 6: Crear tabla material_usuarios en Supabase
1. Ir a Supabase → SQL Editor
2. Copiar TODO el contenido de `supabase_material_usuarios.sql`
3. Ejecutar el SQL
4. Esto crea: tabla `material_usuarios`, indices y politicas RLS
5. **Sin esto, la asignacion individual de material NO funciona**

### Paso 7: Push Notifications (opcional, puede hacerse despues)
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

## BITACORA DE SESIONES

> Cada sesion de Claude Code agrega aqui lo que se hizo, para que la proxima sesion pueda continuar sin perder contexto.

### Sesion 1 — 2026-02-19 (v3.1 → v4.0)
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

### Sesion 2 — 2026-02-19 (revision de estado)
1. Se reviso todo el codigo vs las notas de CONTEXTO_PROYECTO.md
2. **Resultado: 100% alineado** — el codigo real coincide perfectamente con lo documentado
3. Se agrego esta seccion de bitacora para registrar cambios futuros
4. Estado actual: v4.0 completa, arbol de trabajo limpio, sin cambios pendientes
5. Tareas manuales de Edgardo siguen pendientes (push, SQL, bucket, realtime, testing)

### Sesion 3 — 2026-02-19 (PDFs de material)
1. Se copiaron los 8 PDFs de guias de Ana Bienestar a `public/pdfs/`:
   - Guia de Bienestar Integral
   - Guia de Salud Digestiva
   - Guia de Equilibrio Emocional
   - Guia de Alimentacion Antiinflamatoria
   - 30 Tips Rapidos para tu Bienestar
   - Esto x Esto: Sustituciones Saludables
   - Lista de Compras Consciente
   - SOS Emergencia
2. Se actualizo `seedData.js`: los materiales de ejemplo se reemplazaron por los 8 PDFs reales con url_pdf apuntando a `/pdfs/...`
3. Se creo `supabase_material_pdfs.sql` con INSERTs alternativos (por si se prefiere SQL directo)
4. **Flujo para Ana**: Panel admin → Configuracion → "Insertar datos de ejemplo" carga los 8 PDFs automaticamente en la tabla `material`
5. Las clientas ven los PDFs en la pantalla Material (requiere acceso, ver tarea pendiente de BottomNav)

### Sesion 4 — 2026-02-19 (fix auth bugs + mejoras)
1. **Bug fix principal**: login→logout→login se quedaba en "Cargando..." infinito
   - Causa: race condition entre `getSession()` y `onAuthStateChange` — ambos manipulaban loading/user/perfil en paralelo
   - Solucion: unificar todo en un solo listener `onAuthStateChange` que maneja INITIAL_SESSION, SIGNED_IN, SIGNED_OUT y TOKEN_REFRESHED
   - Se agrego timeout de seguridad (8s) para que nunca quede en loading infinito
2. **Bug fix Login.js**: `signInWithPassword` de Supabase no hace throw, devuelve `{ error }`. El catch nunca atrapaba errores. Ahora se revisa `authError` directamente.
3. **Fix supabaseClient.js**: se quito `lock: false` y `storage: window.localStorage` (defaults de Supabase son mejores). Se agrego `autoRefreshToken: true` y `detectSessionInUrl: true`.
4. Boton de logout ya existia en Home.js (verificado)

### Sesion 5 — 2026-02-19 (v4.3: asignacion de material a clientas)
1. **Nueva tabla `material_usuarios`** (junction table): permite asignar material individual a clientas especificas
   - Archivo: `supabase_material_usuarios.sql` con tabla, indices y RLS
   - Admin tiene acceso total, clienta solo lee sus asignaciones
2. **AdminMaterial.js reescrito completamente**:
   - Boton "Cargar guias de Ana Bienestar" que inserta los 8 PDFs directamente (aparece cuando la tabla esta vacia)
   - Modal de asignacion: cuando un material tiene `para_todas: false`, aparece boton para asignar clientas individuales
   - Checkboxes con lista de clientas, botones "Asignar todas" / "Quitar todas"
   - Badge mostrando cantidad de clientas asignadas en cada tarjeta
   - Optimistic UI con rollback on error
3. **Material.js actualizado**: ahora filtra material segun usuario autenticado
   - Muestra material con `para_todas: true` (acceso global)
   - PLUS material asignado individualmente via `material_usuarios`
   - Usa `useAuth()` para obtener el usuario actual
4. **Paso manual para Edgardo**: ejecutar `supabase_material_usuarios.sql` en Supabase SQL Editor

### Sesion 6 — 2026-02-19 (v4.3.1: fix material admin + SQL migracion)
1. **Problema**: las guias no aparecian en el panel admin de Material — la tabla `material` no tenia las columnas `para_todas` ni `visible`
2. **SQL de migracion**: `supabase_material_alter.sql` agrega las columnas faltantes de forma segura (idempotente)
3. **AdminMaterial.js mejorado**:
   - Boton "Cargar guias de Ana" ahora siempre visible en el header (no solo cuando lista vacia)
   - Detecta si las guias ya estan cargadas (por titulo) para evitar duplicados
   - Muestra "✅ Guias cargadas" cuando ya estan en la BD
   - Fallback: si el insert falla por columna faltante, reintenta sin `para_todas`
   - Nuevo estado de error visible con boton "Reintentar"
   - Empty state mejorado con icono y texto descriptivo
   - Formulario "+ Agregar material" para que Ana suba nuevos documentos a futuro
4. **Paso manual para Edgardo**: ejecutar `supabase_material_alter.sql` en Supabase SQL Editor

---

## PREFERENCIAS DEL USUARIO
- Comunicacion en espanol
- Commits detallados con version
- Revisar todo el repo antes de hacer cambios
- Persistencia de contexto entre sesiones (bitacora)
- El proyecto es para una nutricionista real (Ana Karina) en Uruguay
- Cada cambio debe quedar registrado en la bitacora de este archivo
