import type { Directive, DirectiveBinding } from 'vue';

declare global {
  interface HTMLElement {
    clickOutsideEvent?: (event: MouseEvent) => void;
  }
}

export const clickOutSide: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<(event: MouseEvent, el: HTMLElement) => void>) {
    el.clickOutsideEvent = function (event: MouseEvent) {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event, el);
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', el.clickOutsideEvent!);
    delete el.clickOutsideEvent;
  },
};

export default clickOutSide;
