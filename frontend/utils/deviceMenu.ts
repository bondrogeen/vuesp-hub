import type { DeviceMenu, MenuType } from '../types.ts';

export const createDeviceMenu = (menus: DeviceMenu[]): MenuType[] => ([
    {
        title: 'Devices',
        items: [
            {
                name: 'Devices',
                icon: 'IconDevice',
                path: '/device/list/',
                children: menus.map(i => ({
                    name: i.name,
                    icon: 'IconDevice',
                    // path: `/device/${i.ip}/`,
                    children: (i.menu ?? []).map(item => ({ ...item, icon: item.icon ?? 'IconDevice', path: `/device/${i.ip}${item.path ?? ''}` }))
                }))
            },
            {
                name: 'Connect device',
                icon: 'IconDevice',
                path: '/device/connect/',
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

    {
        title: 'Dashboard',
        items: [
            {
                name: 'Dashboard',
                icon: 'IconVideo',
                path: '/dashboard/',
            },
        ],
    },
    {
        title: 'Service',
        items: [
            {
                name: 'Modbus',
                icon: 'IconVideo',
                path: '/modbus/',
            },
        ],
    },
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