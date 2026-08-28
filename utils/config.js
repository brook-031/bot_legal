const POLICE_RANKS = [
    { name: 'Comando', level: 1, emoji: '🥇', color: '#D4AF37' },
    { name: 'Sub-Comando', level: 2, emoji: '🥈', color: '#E67E22' },
    { name: 'Coronel', level: 3, emoji: '🥉', color: '#E74C3C' },
    { name: 'Tenente-Coronel', level: 4, emoji: '🎖️', color: '#C0392B' },
    { name: 'Major', level: 5, emoji: '🏵️', color: '#D35400' },
    { name: '1 Tenente', level: 6, emoji: '🔶', color: '#F39C12' },
    { name: '2 Tenente', level: 7, emoji: '🔸', color: '#F1C40F' },
    { name: 'Sub Tenente', level: 8, emoji: '🔹', color: '#3498DB' },
    { name: '1 Sargento', level: 9, emoji: '🔰', color: '#2ECC71' },
    { name: '2 Sargento', level: 10, emoji: '❇️', color: '#27AE60' },
    { name: '3 Sargento', level: 11, emoji: '✅', color: '#16A085' },
    { name: 'Cabo', level: 12, emoji: '🔻', color: '#95A5A6' },
    { name: 'Soldado', level: 13, emoji: '💂', color: '#BDC3C7' },
    { name: 'Soldado 1 Classe', level: 14, emoji: '🛡️', color: '#95A5A6' },
    { name: 'Soldado 2 Classe', level: 15, emoji: '🛡️', color: '#7F8C8D' },
    { name: 'Recruta', level: 16, emoji: '🔰', color: '#34495E' }
];

const HOSPITAL_RANKS = [
    { name: 'Diretor', level: 1, emoji: '🥇', color: '#E74C3C' },
    { name: 'ViceDiretor', level: 2, emoji: '🥈', color: '#E67E22' },
    { name: 'Coordenador', level: 3, emoji: '🥉', color: '#F39C12' },
    { name: 'Medico', level: 4, emoji: '👨‍⚕️', color: '#3498DB' },
    { name: 'Enfermeiro', level: 5, emoji: '💉', color: '#2ECC71' },
    { name: 'Estagiario', level: 6, emoji: '🔰', color: '#BDC3C7' }
];

const MECHANIC_RANKS = [
    { name: 'Chefe', level: 1, emoji: '🥇', color: '#E67E22' },
    { name: 'Gerente', level: 2, emoji: '🥈', color: '#F39C12' },
    { name: 'Mecanico', level: 3, emoji: '🔧', color: '#3498DB' },
    { name: 'Ajudante', level: 4, emoji: '🔩', color: '#2ECC71' },
    { name: 'Estagiario', level: 5, emoji: '🔰', color: '#BDC3C7' }
];

const BUSINESS_RANKS = [
    { name: 'Chefe', level: 1, emoji: '🥇', color: '#D4AF37' },
    { name: 'Gerente', level: 2, emoji: '🥈', color: '#E67E22' },
    { name: 'SubGerente', level: 3, emoji: '🥉', color: '#F39C12' },
    { name: 'Atendente', level: 4, emoji: '☕', color: '#3498DB' },
    { name: 'Estoquista', level: 5, emoji: '📦', color: '#2ECC71' }
];

const MANSION_RANKS = [
    { name: 'Dono', level: 1, emoji: '👑', color: '#D4AF37' },
    { name: 'Membro', level: 2, emoji: '👤', color: '#3498DB' }
];

const LEGAL_ORGS = [
    // --- POLÍCIA ---
    { id: 'core', name: 'Polícia CORE', emoji: '🚓', type: 'police', ranks: POLICE_RANKS },
    { id: 'bope', name: 'Polícia BOPE', emoji: '💀', type: 'police', ranks: POLICE_RANKS },
    { id: 'rps', name: 'Polícia RPS', emoji: '🚔', type: 'police', ranks: POLICE_RANKS },
    { id: 'dac', name: 'Polícia DAC', emoji: '🦅', type: 'police', ranks: POLICE_RANKS },
    { id: 'militar', name: 'Polícia Militar', emoji: '👮', type: 'police', ranks: POLICE_RANKS },
    { id: 'speed', name: 'Polícia SPEED', emoji: '🏎️', type: 'police', ranks: POLICE_RANKS },
    { id: 'prf', name: 'Polícia P.R.F', emoji: '⚖️', type: 'police', ranks: POLICE_RANKS },
    { id: 'gsa', name: 'Polícia G.S.A', emoji: '🛡️', type: 'police', ranks: POLICE_RANKS },
    { id: 'gtm', name: 'Polícia G.T.M', emoji: '🐕', type: 'police', ranks: POLICE_RANKS },
    { id: 'civil', name: 'Polícia Civil', emoji: '🕵️', type: 'police', ranks: POLICE_RANKS },

    // --- HOSPITAL / PARAMÉDICO ---
    { id: 'hospital', name: 'Hospital Paramedic', emoji: '🏥', type: 'hospital', ranks: HOSPITAL_RANKS },

    // --- MECÂNICAS ---
    { id: 'overspeed', name: 'Mecânica OverSpeed', emoji: '🏁', type: 'mechanic', ranks: MECHANIC_RANKS },
    { id: 'stopcar', name: 'Mecânica StopCar', emoji: '🛑', type: 'mechanic', ranks: MECHANIC_RANKS },
    { id: 'underground', name: 'Mecânica Underground', emoji: '🚇', type: 'mechanic', ranks: MECHANIC_RANKS },
    { id: 'harmony', name: 'Mecânica Harmony', emoji: '🛠️', type: 'mechanic', ranks: MECHANIC_RANKS },
    { id: 'lossantos', name: 'Mecânica Los Santos', emoji: '🚗', type: 'mechanic', ranks: MECHANIC_RANKS },

    // --- RESTAURANTES / CAFÉS ---
    { id: 'cafe', name: 'Restaurante Cafe', emoji: '☕', type: 'business', ranks: BUSINESS_RANKS },
    { id: 'pearl', name: 'Restaurante Pearl', emoji: '🦪', type: 'business', ranks: BUSINESS_RANKS },
    { id: 'osaka', name: 'Restaurante Osaka', emoji: '🍣', type: 'business', ranks: BUSINESS_RANKS },

    // --- MANSÃO ---
    { id: 'mansao01', name: 'Mansao01', emoji: '🏛️', type: 'mansion', ranks: MANSION_RANKS }
];

const STANDARD_CHANNELS = [
    { name: '⏰・bater-ponto', type: 'text', private: false },
    { name: '📥・recrutamento', type: 'text', private: false },
    { name: '🏦・banco-log', type: 'text', private: false },
    { name: '📦・bau', type: 'text', private: false },
    { name: '👑・bau-lider', type: 'text', private: true, leadershipOnly: true },
    { name: '📢・avisos', type: 'text', private: false },
    { name: '📜・regras', type: 'text', private: false },
    { name: '🧬・hierarquia', type: 'text', private: false },
    { name: '💬・bate-papo', type: 'text', private: false },
    { name: '🔒・bate-papo-lider', type: 'text', private: true, leadershipOnly: true },
    { name: '🤝・contratar', type: 'text', private: true, leadershipOnly: true },
    { name: '👥・gerenciar-membros', type: 'text', private: true, leadershipOnly: true },
    { name: '🔊・Ação 1', type: 'voice', private: false },
    { name: '🔊・Ação 2', type: 'voice', private: false },
    { name: '🔊・Ação 3', type: 'voice', private: false },
    { name: '🔊・Resenha 1', type: 'voice', private: false },
    { name: '🔊・Resenha 2', type: 'voice', private: false },
    { name: '🔊・Reunião Geral', type: 'voice', private: false },
    { name: '👑・Reunião Gerência', type: 'voice', private: true, leadershipOnly: true }
];

module.exports = {
    LEGAL_ORGS,
    STANDARD_CHANNELS,
    POLICE_RANKS,
    HOSPITAL_RANKS,
    MECHANIC_RANKS,
    BUSINESS_RANKS,
    MANSION_RANKS
};
