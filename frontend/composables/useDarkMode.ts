export interface UseDarkModeReturn {
  toggleDarkMode: () => void;
}

export const useDarkMode = (): UseDarkModeReturn => ({
  toggleDarkMode: () => document.documentElement.classList.toggle('dark'),
});
