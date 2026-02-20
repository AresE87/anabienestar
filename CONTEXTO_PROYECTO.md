# AnabienestarIntegral - Contexto del Proyecto

> Este archivo lo usa Claude Code para retomar contexto si se corta la sesion.
> **Lee este archivo SIEMPRE al inicio de una nueva sesion.**
> Actualizado: 2026-02-20

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
    Login.js                - Login email/password + Google OAuth [v4.4]
    Home.js                 - Dashboard clienta (checklist, mood, frase, receta)
    Progreso.js             - Graficos de peso (recharts)
    Chat.js                 - Chat con Ana (texto, fotos, videos, typing indicator) [v4.4.1]
    Recetas.js              - Catalogo de recetas (con fallback local)
    Material.js             - eBooks y videos (filtra por asignacion de usuario)
    Citas.js                - Agenda y notas de sesion
    Admin.js                - Dashboard admin completo (10 pestanas)
  components/
    BottomNav.js            - Nav inferior 6 items: Inicio, Progreso, Chat, Material, Recetas, Citas
    AdminClientas.js        - CRUD clientas
    AdminFichas.js          - CRUD fichas de programas
    AdminMaterial.js        - CRUD eBooks/PDFs
    AdminVideos.js          - CRUD videos/audios
    AdminRecetas.js         - CRUD recetas
    AdminMensajes.js        - Panel chat admin: sonido, typing, respuestas rapidas, busqueda, audio [v5.3]
    AdminEstadisticas.js    - Dashboard estadisticas de engagement (Recharts) [v5.4]
    AdminGrupos.js          - Placeholder programa grupal [v5.5]
  hooks/
    usePresence.js          - Hook Supabase Presence (indicador en linea) [v5.1]
    useVoiceRecorder.js     - Hook MediaRecorder (grabar audio) [v5.2]
  utils/
    pushNotifications.js    - Push notifications (VAPID, SW)
    seedData.js             - Insertar datos de ejemplo
    i18n.js                 - Traducciones ES/PT (scaffolding) [v5.5]
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
| v4.4 | Login OAuth (Google/Apple) + BottomNav 6 pestanas + auto-crear perfil |
| v4.4.1 | Sonido notificacion admin + typing indicator bidireccional + respuestas rapidas + quitar Apple |
| v5.0 | Push notifications bidireccionales para chat (clienta→admin, admin→clienta) |
| v5.1 | Indicador "en linea" con Supabase Presence |
| v5.2 | Mensajes de voz (grabar, enviar, reproducir audio en chat) |
| v5.3 | Busqueda en mensajes (admin + clienta) |
| v5.4 | Estadisticas de engagement (Recharts) + exportar ficha a PDF |
| v5.5 | Scaffolding: modo oscuro (ThemeContext), multi-idioma (i18n ES/PT), programa grupal (schema + placeholder) |
| v5.6 | Fix auth: sesion corrupta al reabrir pestana (limpieza automatica de tokens expirados) |
| v5.7 | **Fix auth definitivo**: desactivar Web Locks API en Supabase JS client (causa raiz de queries colgadas) |

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

### Paso 8: Ejecutar migracion v5 en Supabase
1. Ir a Supabase → SQL Editor
2. Copiar TODO el contenido de `supabase_v5_migration.sql`
3. Ejecutar el SQL
4. Esto hace:
   - Agrega tipo 'audio' al constraint de mensajes (para mensajes de voz)
   - Crea tablas `grupos`, `grupo_miembros`, `grupo_metas`, `grupo_progreso` (para programa grupal futuro)
   - Crea politicas RLS para las tablas de grupos
5. **Sin esto, los mensajes de voz NO se pueden guardar**

---

## PASOS FUTUROS DEL PROYECTO (para proximas sesiones con Claude)

### Prioridad Alta
- [x] **Acceso a Material**: Agregada pestana Material al BottomNav con 6 items (v4.4)
- [x] **Push notifications bidireccionales para chat**: Clienta→admin y admin→clienta via edge function `send-push` (v5.0)
- [ ] **Archivo public/sw.js**: Crear el Service Worker para manejar push events (mostrar notificacion nativa en el celular de Ana)

### Prioridad Media
- [x] **Sonido de notificacion**: Ding sutil via AudioContext cuando llega mensaje de clienta (v4.4.1)
- [x] **Indicador "escribiendo..."**: Supabase Broadcast bidireccional entre Chat.js y AdminMensajes.js (v4.4.1)
- [x] **Indicador "en linea"**: Supabase Presence con hook usePresence.js (v5.1)
- [x] **Mensajes de voz**: Grabar, enviar y reproducir audio con MediaRecorder API (v5.2)
- [x] **Respuestas rapidas para Ana**: Boton ⚡ con 7 templates frecuentes en AdminMensajes.js (v4.4.1)
- [x] **Buscar en mensajes**: Busqueda con scroll-to-message en admin y clienta (v5.3)

### Prioridad Baja
- [ ] **Telegram bot mejorado**: Conectar el chat de la app con el bot de Telegram (mensajes bidireccionales)
- [x] **Estadisticas de engagement**: Dashboard Recharts con checklist, mood, mensajes (v5.4)
- [x] **Exportar datos**: Exportar ficha de clienta a PDF via window.print() (v5.4)
- [x] **Modo oscuro**: ThemeContext scaffolding con toggle en Home (v5.5)
- [x] **Multi-idioma**: i18n scaffolding ES/PT con selector en Home (v5.5)
- [x] **Programa grupal**: Schema SQL + placeholder AdminGrupos (v5.5)

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

### Sesion 7 — 2026-02-19 (v4.4: OAuth Google + BottomNav 6 pestanas)
1. **Login con Google**:
   - Login.js: boton "Continuar con Google" debajo del form
   - Icono SVG inline de Google (sin dependencias externas)
   - Divider "o continuar con" separa form de boton OAuth
   - Usa `signInWithOAuth` de Supabase con redirect a `window.location.origin`
   - Apple removido (requiere cuenta de developer de $99/ano)
2. **Auto-crear perfil para usuarios nuevos**:
   - `supabase_oauth_setup.sql`: trigger PostgreSQL en `auth.users` INSERT
   - Crea automaticamente fila en `usuarios` con rol='clienta', nombre del provider
   - `ON CONFLICT (id) DO NOTHING` para no afectar usuarios existentes
3. **BottomNav rediseñado con 6 pestañas**:
   - Agregada pestana Material (📚) que faltaba desde v4.0
   - Items: Inicio, Progreso, Chat, Material, Recetas, Citas
   - CSS optimizado para 390px: iconos 1.1rem, labels 0.6rem, padding reducido
4. **Pasos manuales para Edgardo**:
   - Ejecutar `supabase_oauth_setup.sql` en SQL Editor
   - Habilitar Google provider en Supabase Dashboard → Authentication → Providers

### Sesion 8 — 2026-02-19 (v4.4.1: Sonido, Typing, Respuestas rapidas)
1. **Boton Apple removido del Login**:
   - Eliminado AppleIcon SVG, boton "Continuar con Apple" y estilo appleBtn
   - Solo queda login email/password + Google
2. **Sonido de notificacion para admin**:
   - AdminMensajes.js: funcion `playNotificationSound()` usa AudioContext para generar un ding sutil (830Hz, sine wave, 0.4s)
   - Suena cuando llega mensaje de clienta y: la conversacion activa es otra, o el tab no esta enfocado
   - Catch silencioso para navegadores que bloquean autoplay
3. **Indicador "Escribiendo..."** (bidireccional):
   - Usa Supabase Broadcast (sin tabla extra): canal `typing-{conversacionId}`
   - Chat.js: envia broadcast `user_typing` con debounce de 2s al escribir, muestra "Ana esta escribiendo..." con animacion de puntos
   - AdminMensajes.js: envia broadcast al escribir, muestra "Escribiendo..." arriba del input
   - Auto-desaparece despues de 3 segundos sin actividad
4. **Respuestas rapidas para Ana**:
   - Boton ⚡ al lado del input en AdminMensajes.js
   - 7 templates predefinidos en menu desplegable con animacion fadeIn
   - Al seleccionar, se inserta en el input (no se envia directo) para que Ana pueda editar
   - Toggle: boton cambia color gold cuando el menu esta abierto
5. **Animaciones CSS**:
   - Agregadas `@keyframes pulse` y `@keyframes fadeIn` en index.css

### Sesion 9 — 2026-02-20 (v5.0→v5.6: todos los pendientes + fix auth)
1. **Push notifications bidireccionales (v5.0)**:
   - Chat.js: `notifyAdmin()` fire-and-forget tras enviar texto/foto/video
   - AdminMensajes.js: push a clienta tras responder
   - Admin.js: `subscribeToPush(adminPerfil.id)` al montar
2. **Indicador "en linea" (v5.1)**:
   - Nuevo `src/hooks/usePresence.js`: Supabase Presence en canal `online-users`
   - Chat.js: punto verde + "En linea" si Ana esta conectada
   - AdminMensajes.js: punto verde en avatar de conversaciones + "En linea"/"Desconectada" en header
3. **Mensajes de voz (v5.2)**:
   - Nuevo `src/hooks/useVoiceRecorder.js`: MediaRecorder con audio/webm
   - Chat.js y AdminMensajes.js: boton mic, UI de grabacion (barra roja + timer), envio a storage, reproduccion con `<audio controls>`
   - SQL: `supabase_v5_migration.sql` agrega tipo 'audio' al constraint de mensajes
4. **Busqueda en mensajes (v5.3)**:
   - AdminMensajes.js: boton 🔍 en header, panel busqueda con debounce 400ms, click-to-scroll con highlight dorado
   - Chat.js: misma funcionalidad simplificada
5. **Estadisticas de engagement (v5.4)**:
   - Nuevo `src/components/AdminEstadisticas.js`: BarChart (checklist %), PieChart (mood), LineChart (mensajes), cards resumen
   - Selector de rango 7d/30d/90d, datos de Supabase en paralelo
6. **Exportar ficha a PDF (v5.4)**:
   - AdminClientas.js: boton "📄 PDF" genera HTML con datos de clienta + `window.print()`
7. **Modo oscuro scaffolding (v5.5)**:
   - Nuevo `src/context/ThemeContext.js`: temas light/dark, persistencia localStorage
   - App.js: envuelto con `<ThemeProvider>`
   - Home.js: toggle 🌙/☀️ en header
8. **Multi-idioma scaffolding (v5.5)**:
   - Nuevo `src/utils/i18n.js`: traducciones ES/PT, funciones t(), setLanguage(), getLanguage()
   - Home.js: toggle ES/PT en header
9. **Programa grupal placeholder (v5.5)**:
   - Nuevo `src/components/AdminGrupos.js`: card "Proximamente" con preview
   - SQL: tablas grupos/miembros/metas/progreso en `supabase_v5_migration.sql`
   - Admin.js: nuevas pestanas Estadisticas (📈) y Grupos (👥)
10. **Fix auth sesion corrupta (v5.6)**:
    - **Bug**: Al cerrar pestana y reabrir, Supabase intentaba restaurar sesion con token expirado (error 400). `onAuthStateChange` no emitia SIGNED_OUT limpiamente, el timeout de 8s saltaba, `user` quedaba con datos stale pero `perfil` null → mostraba "Tu cuenta no tiene perfil asignado" en vez del Login. Solo funcionaba en modo incognito (sin localStorage viejo).
    - **Fix en AuthContext.js**: 3 capas de proteccion:
      1. `getSession()` ahora atrapa errores → si falla (400, token expirado) hace `signOut()` inmediato para limpiar localStorage
      2. En `INITIAL_SESSION` sin perfil: verifica sesion con `getUser()` → si token invalido → `signOut()` limpio
      3. Timeout mejorado: si 8s sin resolver → `signOut()` + limpiar user/perfil → muestra Login
    - Flag `isMounted` para evitar updates en componentes desmontados
11. **Compilacion exitosa** con `npx react-scripts build`

**Errores conocidos encontrados durante implementacion:**
- `"Can't resolve 'react'"` — worktree sin node_modules resuelto. Fix: usar `NODE_ENV=production`
- `"'selected' is not defined"` en AdminClientas.js — variable incorrecta en codigo PDF. Fix: reemplazar `selected?.` por `selectedClienta?.`
- `"'NOTIFICATION_SOUND' is assigned but never used"` — constante obsoleta en AdminMensajes.js. Fix: eliminada
- **Auth sesion corrupta**: token refresh falla al reabrir pestana → pantalla "sin perfil". Fix: v5.6 (limpieza automatica)

### Sesion 10 — 2026-02-20 (setup Supabase + fix auth race condition + Google OAuth)

**Contexto**: Edgardo trabajo en el proyecto desde otra PC y pusheo hasta v5.6. Esta sesion fue para: ejecutar SQLs en Supabase, configurar Google OAuth, y resolver el bug persistente de "Tu cuenta no tiene perfil asignado".

#### Parte 1: Setup de Supabase (pasos manuales completados)
1. **5 SQLs ejecutados exitosamente** en el SQL Editor de Supabase:
   - `supabase_chat.sql` — tablas conversaciones, mensajes, indices, RLS, bucket chat-media
   - `supabase_material_alter.sql` — columnas para_todas, visible, url_pdf en tabla material
   - `supabase_material_usuarios.sql` — junction table material↔usuarios, RLS
   - `supabase_oauth_setup.sql` — trigger auto-crear perfil en login OAuth
   - `supabase_v5_migration.sql` — tipo 'audio' en mensajes + tablas programa grupal
2. **Storage verificado**: bucket `chat-media` PUBLIC con 2 politicas activas
3. **Realtime verificado**: tablas `mensajes` y `conversaciones` con toggle activado (y muchas mas)
4. **Google OAuth verificado**: provider habilitado en Supabase con Client ID y Secret

#### Parte 2: Investigacion del bug de auth
**Sintoma**: Al abrir la app en navegacion normal, muestra "Tu cuenta no tiene perfil asignado". En incognito funciona perfecto. Pasa tanto con admin como con clienta.

**Intentos que NO funcionaron:**
1. `refreshSession()` + retry de fetchPerfil → el perfil seguia sin encontrarse
2. fetchPerfil con 3 capas (ID → email → crear) → las queries del Supabase JS client se colgaban

**Hallazgo clave con pantalla de diagnostico (raw fetch):**
- Se agrego un componente `DebugNoPerfil` en App.js que usa `fetch()` directo al REST API de Supabase
- **Raw fetch funciona perfecto** (status 200, devuelve las 3 filas de usuarios)
- Los IDs coinciden entre auth y tabla
- PERO el Supabase JS client se cuelga al hacer queries

**Hallazgo del usuario**: "el perfil aparecio brevemente y despues desaparecio"

**Causa raiz identificada: RACE CONDITION entre INITIAL_SESSION y TOKEN_REFRESHED**
1. Supabase restaura sesion de localStorage → dispara `INITIAL_SESSION`
2. `fetchPerfil` se ejecuta con token viejo → **funciona** (RLS deshabilitado en usuarios)
3. Supabase refresca el token en background → dispara `TOKEN_REFRESHED`
4. `fetchPerfil` se ejecuta OTRA VEZ → se cuelga o falla → **sobreescribe perfil con null**
5. El usuario ve el perfil por un instante y luego desaparece

**Fix aplicado: sequence counter (eventSeqRef)**
- Cada evento de `onAuthStateChange` recibe un numero de secuencia incremental
- Despues del `await queryPerfil()`, se verifica si el evento sigue siendo el mas reciente
- Si llego un evento mas nuevo mientras esperabamos, el resultado viejo se DESCARTA
- `queryPerfil` ya no modifica estado directamente (solo retorna data)
- Solo se actualiza `perfil` si `queryPerfil` devuelve datos (no sobreescribe con null)

**Estado del componente DebugNoPerfil**: sigue activo en App.js como red de seguridad. Muestra diagnostico completo si el perfil no carga. Incluye:
- Info del auth user (ID, email)
- Raw fetch directo al REST API (bypass del JS client)
- Deteccion de IDs que no coinciden con auto-fix
- Botones Reintentar y Cerrar sesion

#### Parte 3: Google OAuth
1. **Redirect a localhost**: Al hacer login con Google, Supabase redirigia a `localhost:3000` en vez de la app en Vercel. **Fix**: cambiar Site URL en Supabase → Authentication → URL Configuration a `https://anabienestar.vercel.app`
2. **"Unable to exchange external code"**: Despues de corregir la URL, Google OAuth daba error de intercambio de codigo. **Fix**: en Google Cloud Console → Credentials → OAuth Client ID:
   - Authorized JavaScript origins: `https://anabienestar.vercel.app`
   - Authorized redirect URIs: `https://rnbyxwcrtulxctplerqs.supabase.co/auth/v1/callback`
3. **Estado**: credenciales configuradas, falta probar si el exchange funciona despues de la propagacion de Google (puede tardar 5 min a unas horas)

#### Parte 4: Descubrimiento — Supabase JS client se cuelga
**Prueba con diagnostico**: TANTO en navegacion normal como en incognito:
- ✅ Raw fetch funciona perfecto (status 200, devuelve datos, IDs coinciden)
- ❌ `supabase.from('usuarios').select()` se cuelga SIEMPRE
- ❌ `refetchPerfil` (que usa el JS client) tambien falla

Esto descarto race condition y tokens expirados como causa. Se probo raw fetch como workaround intermedio.

#### Parte 5: CAUSA RAIZ ENCONTRADA — Web Locks API ✅ RESUELTO
**Causa raiz**: Supabase JS v2.97.0 usa `navigator.locks` (Web Locks API) para coordinar el refresh de tokens entre pestanas. En la red corporativa del usuario (ccu.uy), esta API se **cuelga indefinidamente** → TODAS las queries de `supabase.from().select()` quedan bloqueadas esperando el lock que nunca se libera.

**Por que el raw fetch funcionaba**: `fetch()` directo no pasa por el sistema de locks de Supabase. Va directo al REST API.

**Fix definitivo** (1 linea en `src/supabaseClient.js`):
```javascript
lock: async (_name, _acquireTimeout, fn) => fn(),
```
Esto provee una funcion lock no-op que ejecuta el callback inmediatamente sin usar `navigator.locks`. Tambien se agrego `flowType: 'implicit'` para OAuth.

**Confirmado por el usuario**: login/logout funciona correctamente para admin y clienta en todos los escenarios (sesion guardada, login manual, cambio entre cuentas, incognito).

**AuthContext.js vuelto a la normalidad**: usa `supabase.from().select()` normal (ya no necesita raw fetch). Mantiene 3 capas de fallback (ID → email → crear) y sequence counter para race conditions.

**App.js limpiado**: DebugNoPerfil removido, pantalla simple "Cargando perfil..." con botones Reintentar y Cerrar sesion como red de seguridad.

#### Commits de esta sesion
- `cf46b84` — fix: auth sesion expirada (refreshSession + retry)
- `44732c7` — fix: solucion definitiva auth (3 capas fallback)
- `21480cf` — debug: pantalla diagnostico con raw fetch
- `8b79217` — fix: diagnostico con raw fetch + auto-fix IDs
- `db6f66f` — fix: race condition INITIAL_SESSION vs TOKEN_REFRESHED
- `a6d3dbc` — fix: reemplazar queryPerfil por raw fetch (bypass JS client)
- `e1049fd` — fix: separar carga de perfil del listener de auth
- `19f6ed8` — **fix: desactivar Web Locks API (SOLUCION DEFINITIVA)**

#### Lecciones aprendidas
- **Web Locks API puede colgarse** en redes corporativas, VPNs o navegadores con ciertas extensiones. Siempre proveer un lock no-op como fallback si la app se va a usar en entornos corporativos.
- **Raw fetch como herramienta de diagnostico**: cuando el JS client falla, un fetch directo al REST API permite aislar si el problema es del cliente o del servidor.
- **Supabase JS client v2.97**: el lock se introdujo para coordinar refresh entre tabs. Es seguro desactivarlo para apps single-tab o PWAs.

#### Mejoras pendientes para proximas sesiones
- [ ] **Google OAuth end-to-end**: probar login con Google completo (crear cuenta, redirect, auto-crear perfil via trigger)
- [ ] **Habilitar RLS en usuarios**: crear politicas SELECT/UPDATE para usuarios + full access para admin
- [ ] **Service Worker (public/sw.js)**: sigue pendiente para push notifications nativas
- [ ] **Probar toda la app end-to-end**: Chat, Progreso, Recetas, Material, Citas — verificar que todas las pantallas funcionan con el fix de Web Locks

### Sesion 11 — 2026-02-20 (post-presentacion: planificacion de 4 tareas)

**Contexto**: La presentacion salio bien. Se planificaron 4 tareas para mejorar la app.

#### Estado de las 4 tareas planificadas

**Tarea 1: Google OAuth end-to-end**
- Estado: PENDIENTE DE PRUEBA por el usuario
- Codigo ya implementado (Login.js tiene `handleOAuth('google')`)
- Google Cloud Console ya configurado (Client ID, Secret, redirect URIs)
- Supabase Google provider habilitado
- Trigger `handle_new_user` auto-crea perfil en `usuarios`
- **Lo que falta**: Que Edgardo pruebe el boton "Continuar con Google" en la app desplegada
- Si da error `Unable to exchange external code` de nuevo, regenerar Client Secret en Google Cloud y actualizar en Supabase

**Tarea 2: Probar app end-to-end**
- Estado: PENDIENTE DE PRUEBA por el usuario
- Pantallas a verificar: Home, Progreso, Chat, Material, Recetas, Citas (como clienta) + todas las pestanas de Admin
- Con el fix de Web Locks, todas las queries de Supabase deberian funcionar
- **Lo que falta**: Que Edgardo navegue cada pantalla y reporte errores

**Tarea 3: Service Worker y Push Notifications**
- Estado: ✅ CODIGO COMPLETO — falta VAPID key
- `public/sw.js` ya existe con cache offline + push handler + notification click
- Se registra automaticamente en `src/index.js`
- `subscribeToPush()` se llama en Admin.js y Home.js
- **Lo que falta**: Generar VAPID keys y configurar `.env`:
  ```
  npx web-push generate-vapid-keys
  ```
  Poner la public key en `.env` como `REACT_APP_VAPID_PUBLIC_KEY=...`
  Guardar la private key como secreto en Supabase (para edge functions)

**Tarea 4: Habilitar RLS en tabla usuarios**
- Estado: ✅ SQL CREADO — falta ejecutar
- Archivo: `supabase_rls_usuarios.sql` (en la raiz del repo)
- **Lo que falta**: Que Edgardo ejecute el SQL en Supabase SQL Editor
- Politicas creadas:
  - Admin acceso completo (FOR ALL)
  - Usuario lee su propio perfil (FOR SELECT)
  - Usuario actualiza su propio perfil (FOR UPDATE)
  - Insertar perfil propio (FOR INSERT)
  - ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY
- **IMPORTANTE**: Despues de ejecutar el SQL, probar login/logout para verificar que no se rompio nada

#### Pasos manuales para Edgardo (proxima sesion)
1. Ir a Supabase SQL Editor → ejecutar `supabase_rls_usuarios.sql` → verificar Success
2. Probar login/logout admin y clienta (verificar que RLS no rompio nada)
3. Probar boton "Continuar con Google" en la app
4. Navegar TODAS las pantallas como clienta y como admin, reportar errores
5. (Opcional) Generar VAPID keys: `npx web-push generate-vapid-keys` → agregar al `.env`

---

## PREFERENCIAS DEL USUARIO
- Comunicacion en espanol
- Commits detallados con version
- Revisar todo el repo antes de hacer cambios
- Persistencia de contexto entre sesiones (bitacora)
- El proyecto es para una nutricionista real (Ana Karina) en Uruguay
- Cada cambio debe quedar registrado en la bitacora de este archivo
- **REGLA OBLIGATORIA**: Despues de CADA push, actualizar inmediatamente esta bitacora con lo que se hizo, lo que se hablo, sospechas, decisiones tomadas y contexto relevante. NADA se debe perder entre sesiones. Si hay conversacion importante (bugs encontrados, ideas, pendientes), incluirla en la bitacora antes de terminar.
