const translations = {
  es: {
    nav: {
      home: 'Inicio',
      progress: 'Progreso',
      chat: 'Chat',
      material: 'Material',
      recipes: 'Recetas',
      appointments: 'Citas',
    },
    home: {
      greeting: 'Hola, hermosa',
      title: 'Tu dia empieza bien',
      streak: 'dias consecutivos',
      dailyPhrase: 'Frase del dia',
      todayRecipe: 'Receta de hoy',
      checklist: 'Tu checklist diario',
      mood: 'Como te sentis hoy?',
      logout: 'Cerrar sesion',
    },
    chat: {
      placeholder: 'Escribe un mensaje...',
      send: 'Enviar',
      search: 'Buscar en mensajes...',
      typing: 'Ana esta escribiendo...',
      online: 'En linea',
      nutritionist: 'Tu nutricionista',
      voiceMessage: 'Mensaje de voz',
      uploading: 'Subiendo archivo...',
    },
    material: {
      title: 'Tu Material',
      subtitle: 'eBooks y recursos de tu programa',
      library: 'Tu Biblioteca',
      videos: 'Videos y Audios',
      all: 'Todas',
    },
    common: {
      loading: 'Cargando...',
      error: 'Error',
      retry: 'Reintentar',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      new: 'Nuevo',
    },
  },
  pt: {
    nav: {
      home: 'Inicio',
      progress: 'Progresso',
      chat: 'Chat',
      material: 'Material',
      recipes: 'Receitas',
      appointments: 'Consultas',
    },
    home: {
      greeting: 'Ola, linda',
      title: 'Seu dia comeca bem',
      streak: 'dias consecutivos',
      dailyPhrase: 'Frase do dia',
      todayRecipe: 'Receita de hoje',
      checklist: 'Seu checklist diario',
      mood: 'Como voce se sente hoje?',
      logout: 'Sair',
    },
    chat: {
      placeholder: 'Escreva uma mensagem...',
      send: 'Enviar',
      search: 'Buscar em mensagens...',
      typing: 'Ana esta escrevendo...',
      online: 'Online',
      nutritionist: 'Sua nutricionista',
      voiceMessage: 'Mensagem de voz',
      uploading: 'Enviando arquivo...',
    },
    material: {
      title: 'Seu Material',
      subtitle: 'eBooks e recursos do seu programa',
      library: 'Sua Biblioteca',
      videos: 'Videos e Audios',
      all: 'Todos',
    },
    common: {
      loading: 'Carregando...',
      error: 'Erro',
      retry: 'Tentar novamente',
      cancel: 'Cancelar',
      save: 'Salvar',
      delete: 'Excluir',
      new: 'Novo',
    },
  },
};

let currentLang = 'es';
try {
  currentLang = localStorage.getItem('anabienestar-lang') || 'es';
} catch {}

export function t(key) {
  const keys = key.split('.');
  let value = translations[currentLang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

export function setLanguage(lang) {
  currentLang = lang;
  try {
    localStorage.setItem('anabienestar-lang', lang);
  } catch {}
}

export function getLanguage() {
  return currentLang;
}

export function getAvailableLanguages() {
  return [
    { code: 'es', label: 'Espanol' },
    { code: 'pt', label: 'Portugues' },
  ];
}
