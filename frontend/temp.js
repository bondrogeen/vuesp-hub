export const menu = (menus) => ([
    {
        title: 'Devices',
        items: [
            {
                name: 'List',
                icon: 'IconList',
                path: '/device/list/',
            },
            // {
            //     name: 'Device',
            //     icon: 'IconDevice',
            //     path: '/device/',
            //     children: [
            //         { name: 'List', path: '/device/list', },
            //         { name: 'main', path: '/device/main', },
            //         { name: 'profile', path: '/device/profile', },
            //     ],
            // },
            ...menus.map(i => ({
                name: i.name,
                icon: 'IconDevice',
                path: `/device/${i.id}/`,
                children: i.menu.map(item => ({ ...item, path: `/device/${i.ip}${item.path}` }))
            }))
        ],
    },
    {
        title: 'Device',
        items: [

            {
                name: 'Device',
                icon: 'IconDevice',
                path: '/device/192.0.2.132/',
            },
            { name: 'Saas', path: '/saas', },
            { name: 'stocks', path: '/stocks', },
        ],
    },

    {
        title: 'Video',
        items: [
            {
                name: 'video',
                icon: 'IconVideo',
                path: '/video',
            },
        ],
    },
]);