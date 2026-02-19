-- =========================================================
-- Material PDFs de Ana Bienestar Integral
-- Ejecutar en Supabase SQL Editor para pre-cargar los 8 PDFs
-- Los archivos estan en public/pdfs/ del proyecto (servidos por Vercel/Netlify)
-- NOTA: Reemplazar DOMINIO por la URL real del deploy (ej: anabienestar.vercel.app)
-- =========================================================

-- Limpiar materiales existentes de ejemplo (opcional, descomentar si se quiere)
-- DELETE FROM material WHERE url_pdf LIKE '%/pdfs/%';

INSERT INTO material (titulo, descripcion, paginas, url_pdf, para_todas, visible) VALUES
(
  'Guia de Bienestar Integral',
  'Tu programa de transformacion en 12 semanas. Mente, cuerpo y alma en equilibrio.',
  8,
  '/pdfs/Guia_Bienestar_Integral_AnaBienestarIntegral.pdf',
  true,
  true
),
(
  'Guia de Salud Digestiva',
  'Tu intestino, tu segundo cerebro. Aprende a cuidarlo para transformar tu bienestar.',
  8,
  '/pdfs/Guia_Salud_Digestiva_AnaBienestarIntegral.pdf',
  true,
  true
),
(
  'Guia de Equilibrio Emocional',
  'Aprende a habitar el presente. Tu guia para sentir, soltar y florecer.',
  9,
  '/pdfs/Guia_Equilibrio_Emocional_AnaBienestarIntegral.pdf',
  true,
  true
),
(
  'Guia de Alimentacion Antiinflamatoria',
  'Descubri como reducir la inflamacion a traves de una alimentacion consciente.',
  null,
  '/pdfs/Guia_Alimentacion_Antiinflamatoria_AnaBienestarIntegral.pdf',
  true,
  true
),
(
  '30 Tips Rapidos para tu Bienestar Diario',
  'Un tip por dia durante un mes. Imprimilo, guardalo en el celu o pegalo en la heladera.',
  3,
  '/pdfs/Tips_Rapidos_AnaBienestarIntegral.pdf',
  true,
  true
),
(
  'Esto x Esto: Sustituciones Saludables',
  'No se trata de eliminar lo que te gusta, sino de encontrar versiones que te hagan sentir mejor.',
  2,
  '/pdfs/Esto_x_Esto_Sustituciones_AnaBienestarIntegral.pdf',
  true,
  true
),
(
  'Lista de Compras Consciente',
  'Todo lo que necesitas para una semana de alimentacion antiinflamatoria y consciente.',
  2,
  '/pdfs/Lista_Compras_Consciente_AnaBienestarIntegral.pdf',
  true,
  true
),
(
  'SOS Emergencia: Para. Respira. Lee Esto.',
  'Guarda este PDF en tu celular. Leelo antes de decidir. Para momentos de tentacion.',
  1,
  '/pdfs/SOS_Emergencia_AnaBienestarIntegral.pdf',
  true,
  true
);
