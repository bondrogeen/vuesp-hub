import outside from './outside';
import type { Directive } from 'vue';

interface ItemDirective {
  name: string;
  directive: Directive;
}

const arr: ItemDirective[] = [{ name: 'outside', directive: outside }];

export default arr;
