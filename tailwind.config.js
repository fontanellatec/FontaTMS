/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-secondary': 'var(--surface-secondary)',
        panel: 'var(--panel)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        brand: {
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          'primary-dark': 'var(--brand-primary-dark)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
        },
        success: 'var(--success)',
        'success-bg': 'var(--success-bg)',
        'success-text': 'var(--success-text)',
        'success-dark': 'var(--success-dark)',
        warning: 'var(--warning)',
        'warning-bg': 'var(--warning-bg)',
        'warning-text': 'var(--warning-text)',
        error: 'var(--error)',
        'error-bg': 'var(--error-bg)',
        'error-text': 'var(--error-text)',
        'error-dark': 'var(--error-dark)',
        info: 'var(--info)',
        
        'sidebar-bg': 'var(--sidebar-bg)',
        'sidebar-text': 'var(--sidebar-text)',
        'sidebar-text-muted': 'var(--sidebar-text-muted)',
        'sidebar-active': 'var(--sidebar-active)',
      },
    },
  },
  plugins: [],
}
