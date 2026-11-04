import { defineComponent, h } from 'vue';
import { VIconLogo, VIconLogoMini } from 'vuesp-components/components';

const paths: Record<string, IconChild[]> = {
  IconChevron: [['path', { d: 'm9 18 6-6-6-6' }]],
  IconDots: [
    ['circle', { cx: '5', cy: '12', r: '1' }],
    ['circle', { cx: '12', cy: '12', r: '1' }],
    ['circle', { cx: '19', cy: '12', r: '1' }],
  ],
  IconSearch: [
    ['circle', { cx: '11', cy: '11', r: '7' }],
    ['path', { d: 'm20 20-4-4' }],
  ],
  IconUpdate: [['path', { d: 'M20 7v5h-5M4 17v-5h5m-4-3a7 7 0 0 1 12-2l3 3M4 12l3 3a7 7 0 0 0 12-2' }]],
  IconDashboard: [
    ['rect', { x: '3', y: '3', width: '8', height: '8', rx: '1' }],
    ['rect', { x: '13', y: '3', width: '8', height: '5', rx: '1' }],
    ['rect', { x: '13', y: '10', width: '8', height: '11', rx: '1' }],
    ['rect', { x: '3', y: '13', width: '8', height: '8', rx: '1' }],
  ],
  IconDevice: [
    ['rect', { x: '4', y: '3', width: '16', height: '18', rx: '2' }],
    ['path', { d: 'M9 17h6' }],
  ],
  IconVideo: [
    ['rect', { x: '3', y: '6', width: '13', height: '12', rx: '2' }],
    ['path', { d: 'm16 10 5-3v10l-5-3' }],
  ],
  IconList: [['path', { d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' }]],
  IconMenu: [['path', { d: 'M4 6h16M4 12h16M4 18h16' }]],
  IconUser: [
    ['circle', { cx: '12', cy: '8', r: '4' }],
    ['path', { d: 'M4 21a8 8 0 0 1 16 0' }],
  ],
  IconSun: [
    ['circle', { cx: '12', cy: '12', r: '4' }],
    ['path', { d: 'M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42' }],
  ],
  IconMoon: [['path', { d: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z' }]],
  IconBell: [
    ['path', { d: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9' }],
    ['path', { d: 'M13.7 21a2 2 0 0 1-3.4 0' }],
  ],
  IconLogout: [['path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9' }]],
  IconHome: [['path', { d: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z' }]],
  IconScript: [
    ['path', { d: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z' }],
    ['path', { d: 'M14 3v6h6' }],
    ['path', { d: 'm10 13-2 2 2 2m4-4 2 2-2 2' }],
  ],
  IconStorage: [
    ['ellipse', { cx: '12', cy: '5', rx: '8', ry: '3' }],
    ['path', { d: 'M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5' }],
    ['path', { d: 'M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6' }],
  ],
  IconGpio: [
    ['rect', { x: '7', y: '7', width: '10', height: '10', rx: '2' }],
    ['path', { d: 'M9 3v4m6-4v4M9 17v4m6-4v4M3 9h4m-4 6h4m10-6h4m-4 6h4' }],
  ],
  IconSettings: [
    ['circle', { cx: '12', cy: '12', r: '3' }],
    ['path', { d: 'M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z' }],
  ],
};

type IconChild = [string, Record<string, string>];

const createIcon = (name: string, children: IconChild[]) =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () =>
        h(
          'svg',
          {
            ...attrs,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '1.8',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'aria-hidden': 'true',
          },
          children.map(([tag, attributes]) => h(tag, attributes)),
        );
    },
  });

const icons = {
  IconChevron: createIcon('IconChevron', paths.IconChevron),
  IconDots: createIcon('IconDots', paths.IconDots),
  IconSearch: createIcon('IconSearch', paths.IconSearch),
  IconUpdate: createIcon('IconUpdate', paths.IconUpdate),
  IconDashboard: createIcon('IconDashboard', paths.IconDashboard),
  IconDevice: createIcon('IconDevice', paths.IconDevice),
  IconVideo: createIcon('IconVideo', paths.IconVideo),
  IconList: createIcon('IconList', paths.IconList),
  IconMenu: createIcon('IconMenu', paths.IconMenu),
  IconUser: createIcon('IconUser', paths.IconUser),
  IconSun: createIcon('IconSun', paths.IconSun),
  IconMoon: createIcon('IconMoon', paths.IconMoon),
  IconBell: createIcon('IconBell', paths.IconBell),
  IconLogout: createIcon('IconLogout', paths.IconLogout),
  IconHome: createIcon('IconHome', paths.IconHome),
  IconScript: createIcon('IconScript', paths.IconScript),
  IconStorage: createIcon('IconStorage', paths.IconStorage),
  IconGpio: createIcon('IconGpio', paths.IconGpio),
  IconSettings: createIcon('IconSettings', paths.IconSettings),
  IconLogo: VIconLogo,
  IconLogoMini: VIconLogoMini,
};

export default icons;
