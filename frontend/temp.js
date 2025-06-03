export const menu = (menus) => ([
    {
        title: 'Devices',
        items: [
            {
                name: 'Devices',
                icon: 'IconDevice',
                path: '/device/list/',
                children: menus.map(i => ({
                    name: i.name,
                    // path: `/device/${i.ip}/`,
                    children: i.menu.map(item => ({ ...item, path: `/device/${i.ip}${item.path}` }))
                }))
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

        ],
    },
    // {
    //     title: 'Device',
    //     items: [

    //         {
    //             name: 'Device',
    //             icon: 'IconDevice',
    //             path: '/device/192.0.2.132/',
    //         },
    //         { name: 'Saas', path: '/saas', },
    //         { name: 'stocks', path: '/stocks', },
    //     ],
    // },

    // {
    //     title: 'Video',
    //     items: [
    //         {
    //             name: 'video',
    //             icon: 'IconVideo',
    //             path: '/video',
    //         },
    //     ],
    // },
]);