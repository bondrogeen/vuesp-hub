export interface IUseDarkModeReturn {
  toggleDarkMode: () => void;
}

export const useDarkMode = (): IUseDarkModeReturn => ({
  toggleDarkMode: () => document.documentElement.classList.toggle('dark'),
});
