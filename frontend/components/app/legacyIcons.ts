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
  IconLogo: VIconLogo,
  IconLogoMini: VIconLogoMini,
};

export default icons;
