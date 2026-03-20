module.exports = {
    RANKS: [
        { name: 'Comando', emoji: '🥇', color: 'Gold' },
        { name: 'Sub-Comando', emoji: '🥈', color: 'Orange' },
        { name: 'Coronel', emoji: '🥉', color: 'Red' },
        { name: 'Tenente-Coronel', emoji: '🎖️', color: 'DarkRed' },
        { name: 'Major', emoji: '🏵️', color: 'DarkOrange' },
        { name: '1 Tenente', emoji: '🔶', color: 'Yellow' },
        { name: '2 Tenente', emoji: '🔸', color: 'Yellow' },
        { name: 'Sub Tenente', emoji: '🔹', color: 'Blue' },
        { name: '1 Sargento', emoji: '🔰', color: 'Green' },
        { name: '2 Sargento', emoji: '❇️', color: 'DarkGreen' },
        { name: '3 Sargente', emoji: '✅', color: 'DarkGreen' },
        { name: 'Cabo', emoji: '🔻', color: 'Grey' },
        { name: 'Soldado', emoji: '💂', color: 'LightGrey' },
        { name: 'Soldado 1 Classe', emoji: '🛡️', color: 'LightGrey' },
        { name: 'Soldado 2 Classe', emoji: '🛡️', color: 'LightGrey' },
        { name: 'Recruta', emoji: '🔰', color: 'Default' }
    ],
    ORGS: [
        {
            name: 'C.O.R.E',
            id: 'core',
            emoji: '🚓',
            color: 'Blue',
            roleId: '1480832639882629230',
            recrutaRoleId: '1480832678671552594',
            hiringChannelId: '1480832684262690938'
        },
        {
            name: 'MILITAR',
            id: 'militar',
            emoji: '👮',
            color: 'DarkBlue',
            roleId: '1480832712251146351',
            recrutaRoleId: '1480832749790167040',
            hiringChannelId: '1480832756182155298'
        },
        {
            name: 'SPEED',
            id: 'speed',
            emoji: '🏎️',
            color: 'Red',
            roleId: '1480832780836405279',
            recrutaRoleId: '1480832824352309269',
            hiringChannelId: '1480832830706552854'
        },
        {
            name: 'P.R.F',
            id: 'prf',
            emoji: '⚖️',
            color: 'Gold',
            roleId: '1480832860096168017',
            recrutaRoleId: '1480832902110642201',
            hiringChannelId: '1480832907689070685'
        },
        {
            name: 'G.S.A',
            id: 'gsa',
            emoji: '🛡️',
            color: 'DarkGreen',
            roleId: '1480832938865201193',
            recrutaRoleId: '1480832976907669507',
            hiringChannelId: '1480832983224291348'
        },
        {
            name: 'G.T.M',
            id: 'gtm',
            emoji: '🐕',
            color: 'Orange',
            roleId: '1480833008784379925',
            recrutaRoleId: '1480833046977581106',
            hiringChannelId: '1480833052539355199'
        },
        {
            name: 'CIVIL',
            id: 'civil',
            emoji: '🕵️',
            color: 'Grey',
            roleId: '1480833082180374695',
            recrutaRoleId: '1480833127076331591',
            hiringChannelId: '1480833133321392290'
        }
    ],
    STANDARD_CHANNELS: [
        { name: '🤝-contratar', type: 'text', private: true, hc_only: true },
        { name: '📥-recrutamento', type: 'text', private: true, hc_only: true },
        { name: '🏦-banco-log', type: 'text', private: true, hc_only: true },
        { name: '📢-avisos', type: 'text' },
        { name: '📜-regras', type: 'text' },
        { name: '🧬-hierarquia', type: 'text' },
        { name: '💬-bate-papo', type: 'text' },
        { name: '🔊 Ação 1', type: 'voice' },
        { name: '🔊 Ação 2', type: 'voice' },
        { name: '🔊 Ação 3', type: 'voice' }
    ]
};
