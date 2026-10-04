export type Theme = "light" | "dark";

export const THEME_KEY = "theme";

/** Page background per theme; mirrored in the browser's theme-color. */
export const THEME_BG: Record<Theme, string> = { dark: "#0a0a0b", light: "#f2eee7" };

/**
 * Runs in <head> before the first paint: the saved choice wins, otherwise the
 * system preference. Keeps the page from flashing the wrong theme.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
