import { supabase } from '../supabaseClient';

/**
 * Crea la tabla recetas si no existe y llena con datos de muestra.
 * Tambien llena material y videos si estan vacios.
 * Retorna un log de lo que hizo.
 */
export async function seedAllData() {
  const log = [];

  // ── 1. Intentar crear tabla recetas via SQL (requiere que RPC exista o tabla ya exista)
  // Si la tabla no existe, la query fallara. Intentamos insert directamente.
  // ──────────────────────────────────────────────

  // ── 2. Seed RECETAS ──────────────────────────
  try {
    const { data: existing } = await supabase.from('recetas').select('id').limit(1);
    if (!existing || existing.length === 0) {
      const recetas = [
        { nombre: 'Tostada de palta con huevo', categoria: 'Desayuno', emoji: '🥑', tiempo: '10 min', calorias: '280 kcal', visible: true },
        { nombre: 'Bowl de quinoa con verduras', categoria: 'Almuerzo', emoji: '🥗', tiempo: '20 min', calorias: '420 kcal', visible: true },
        { nombre: 'Huevos revueltos con espinaca', categoria: 'Desayuno', emoji: '🍳', tiempo: '8 min', calorias: '220 kcal', visible: true },
        { nombre: 'Sopa de lentejas express', categoria: 'Cena', emoji: '🍲', tiempo: '25 min', calorias: '310 kcal', visible: true },
        { nombre: 'Snack de manzana y almendras', categoria: 'Snack', emoji: '🍎', tiempo: '2 min', calorias: '150 kcal', visible: true },
        { nombre: 'Salmon al horno con limon', categoria: 'Cena', emoji: '🐟', tiempo: '30 min', calorias: '380 kcal', visible: true },
        { nombre: 'Smoothie verde detox', categoria: 'Desayuno', emoji: '🥤', tiempo: '5 min', calorias: '190 kcal', visible: true },
        { nombre: 'Wrap de pollo y vegetales', categoria: 'Almuerzo', emoji: '🌯', tiempo: '15 min', calorias: '350 kcal', visible: true },
        { nombre: 'Ensalada cesar light', categoria: 'Almuerzo', emoji: '🥬', tiempo: '12 min', calorias: '290 kcal', visible: true },
        { nombre: 'Yogur con granola y frutas', categoria: 'Desayuno', emoji: '🫐', tiempo: '3 min', calorias: '210 kcal', visible: true },
        { nombre: 'Pollo grillado con batata', categoria: 'Cena', emoji: '🍗', tiempo: '35 min', calorias: '450 kcal', visible: true },
        { nombre: 'Barritas energeticas caseras', categoria: 'Snack', emoji: '🍫', tiempo: '15 min', calorias: '180 kcal', visible: true },
      ];
      const { error } = await supabase.from('recetas').insert(recetas).select();
      if (error) {
        log.push('Recetas: Error - ' + error.message);
      } else {
        log.push('Recetas: 12 recetas creadas');
      }
    } else {
      log.push('Recetas: Ya tiene datos (' + existing.length + '+)');
    }
  } catch (err) {
    log.push('Recetas: Tabla no existe. Ejecuta el SQL de migracion primero.');
  }

  // ── 3. Seed MATERIAL ─────────────────────────
  try {
    const { data: existing } = await supabase.from('material').select('id').limit(1);
    if (!existing || existing.length === 0) {
      const material = [
        { titulo: 'Guia de Bienestar Integral', descripcion: 'Tu programa de transformacion en 12 semanas. Mente, cuerpo y alma en equilibrio.', paginas: 8, url_pdf: '/pdfs/Guia_Bienestar_Integral_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
        { titulo: 'Guia de Salud Digestiva', descripcion: 'Tu intestino, tu segundo cerebro. Aprende a cuidarlo para transformar tu bienestar.', paginas: 8, url_pdf: '/pdfs/Guia_Salud_Digestiva_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
        { titulo: 'Guia de Equilibrio Emocional', descripcion: 'Aprende a habitar el presente. Tu guia para sentir, soltar y florecer.', paginas: 9, url_pdf: '/pdfs/Guia_Equilibrio_Emocional_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
        { titulo: 'Guia de Alimentacion Antiinflamatoria', descripcion: 'Descubri como reducir la inflamacion a traves de una alimentacion consciente.', paginas: null, url_pdf: '/pdfs/Guia_Alimentacion_Antiinflamatoria_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
        { titulo: '30 Tips Rapidos para tu Bienestar', descripcion: 'Un tip por dia durante un mes. Imprimilo, guardalo en el celu o pegalo en la heladera.', paginas: 3, url_pdf: '/pdfs/Tips_Rapidos_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
        { titulo: 'Esto x Esto: Sustituciones Saludables', descripcion: 'No se trata de eliminar lo que te gusta, sino de encontrar versiones que te hagan sentir mejor.', paginas: 2, url_pdf: '/pdfs/Esto_x_Esto_Sustituciones_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
        { titulo: 'Lista de Compras Consciente', descripcion: 'Todo lo que necesitas para una semana de alimentacion antiinflamatoria y consciente.', paginas: 2, url_pdf: '/pdfs/Lista_Compras_Consciente_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
        { titulo: 'SOS Emergencia: Para. Respira. Lee Esto.', descripcion: 'Guarda este PDF en tu celular. Leelo antes de decidir. Para momentos de tentacion.', paginas: 1, url_pdf: '/pdfs/SOS_Emergencia_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
      ];
      const { error } = await supabase.from('material').insert(material).select();
      if (error) log.push('Material: Error - ' + error.message);
      else log.push('Material: 8 guias PDF de Ana Bienestar creadas');
    } else {
      log.push('Material: Ya tiene datos');
    }
  } catch (err) {
    log.push('Material: Error - ' + (err.message || err));
  }

  // ── 4. Seed VIDEOS ───────────────────────────
  try {
    const { data: existing } = await supabase.from('videos').select('id').limit(1);
    if (!existing || existing.length === 0) {
      const videos = [
        { titulo: 'Respiracion 4-7-8 para calmar ansiedad', categoria: 'Respiracion', tipo: 'audio', duracion: '5:30', visible: true, descripcion: 'Tecnica de respiracion guiada para momentos de estres' },
        { titulo: 'Meditacion matutina de 10 minutos', categoria: 'Respiracion', tipo: 'audio', duracion: '10:00', visible: true, descripcion: 'Empieza tu dia con calma y enfoque' },
        { titulo: 'Motivacion: Por que empezaste', categoria: 'Motivacion', tipo: 'video', duracion: '3:45', visible: true, descripcion: 'Recordatorio de tus razones y objetivos' },
        { titulo: 'Desayuno express en 5 minutos', categoria: 'Recetas', tipo: 'video', duracion: '5:00', visible: true, descripcion: 'Tres opciones rapidas y nutritivas' },
        { titulo: 'Mindset: La constancia gana', categoria: 'Mindset', tipo: 'audio', duracion: '8:20', visible: true, descripcion: 'Como mantener la motivacion cuando se pone dificil' },
        { titulo: 'Preparacion de snacks semanales', categoria: 'Recetas', tipo: 'video', duracion: '12:00', visible: true, descripcion: 'Meal prep de snacks saludables para toda la semana' },
      ];
      const { error } = await supabase.from('videos').insert(videos).select();
      if (error) log.push('Videos: Error - ' + error.message);
      else log.push('Videos: 6 videos creados');
    } else {
      log.push('Videos: Ya tiene datos');
    }
  } catch (err) {
    log.push('Videos: Error - ' + (err.message || err));
  }

  // ── 5. Seed FRASES ───────────────────────────
  try {
    const { data: existing } = await supabase.from('frases').select('id').limit(1);
    if (!existing || existing.length === 0) {
      const frases = [
        { texto: 'Cada pequeno paso cuenta. No necesitas ser perfecta, necesitas ser constante.', activa: true },
        { texto: 'Tu cuerpo es tu templo. Cuidalo con amor y paciencia.', activa: true },
        { texto: 'No se trata de ser la mejor, se trata de ser mejor que ayer.', activa: true },
        { texto: 'La salud no es un destino, es un viaje que disfrutas cada dia.', activa: true },
        { texto: 'Respira profundo. Hoy es un buen dia para empezar de nuevo.', activa: true },
        { texto: 'Tu progreso no siempre es lineal, pero siempre es progreso.', activa: true },
      ];
      const { error } = await supabase.from('frases').insert(frases).select();
      if (error) log.push('Frases: Error - ' + error.message);
      else log.push('Frases: 6 frases creadas');
    } else {
      log.push('Frases: Ya tiene datos');
    }
  } catch (err) {
    log.push('Frases: Error - ' + (err.message || err));
  }

  return log;
}
