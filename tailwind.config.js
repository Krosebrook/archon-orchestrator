/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			heading: ['Poppins', 'sans-serif'],
  			body: ['Inter', 'sans-serif'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			// Core semantic colors (shadcn/ui compatible)
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))',
  				50: '#faf5ff',
  				100: '#f3e8ff',
  				200: '#e9d5ff',
  				300: '#d8b4fe',
  				400: '#c084fc',
  				500: '#a855f7',
  				600: '#9333ea',
  				700: '#7e22ce',
  				800: '#6b21a8',
  				900: '#581c87'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))',
  				50: '#fff1f2',
  				100: '#ffe4e6',
  				200: '#fecdd3',
  				300: '#fda4af',
  				400: '#fb7185',
  				500: '#f472b6',
  				600: '#ec4899',
  				700: '#db2777',
  				800: '#be185d',
  				900: '#9f1239'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			// Semantic states
  			success: {
  				DEFAULT: '#22c55e',
  				50: '#f0fdf4',
  				100: '#dcfce7',
  				200: '#bbf7d0',
  				300: '#86efac',
  				400: '#4ade80',
  				500: '#22c55e',
  				600: '#16a34a',
  				700: '#15803d',
  				800: '#166534',
  				900: '#14532d'
  			},
  			warning: {
  				DEFAULT: '#f59e0b',
  				50: '#fffbeb',
  				100: '#fef3c7',
  				200: '#fde68a',
  				300: '#fcd34d',
  				400: '#fbbf24',
  				500: '#f59e0b',
  				600: '#d97706',
  				700: '#b45309',
  				800: '#92400e',
  				900: '#78350f'
  			},
  			error: {
  				DEFAULT: '#ef4444',
  				50: '#fef2f2',
  				100: '#fee2e2',
  				200: '#fecaca',
  				300: '#fca5a5',
  				400: '#f87171',
  				500: '#ef4444',
  				600: '#dc2626',
  				700: '#b91c1c',
  				800: '#991b1b',
  				900: '#7f1d1d'
  			},
  			info: {
  				DEFAULT: '#3b82f6',
  				50: '#eff6ff',
  				100: '#dbeafe',
  				200: '#bfdbfe',
  				300: '#93c5fd',
  				400: '#60a5fa',
  				500: '#3b82f6',
  				600: '#2563eb',
  				700: '#1d4ed8',
  				800: '#1e40af',
  				900: '#1e3a8a'
  			},
  			// Neutral scale
  			neutral: {
  				50: '#fafafa',
  				100: '#f5f5f5',
  				200: '#e5e5e5',
  				300: '#d4d4d4',
  				400: '#a3a3a3',
  				500: '#737373',
  				600: '#525252',
  				700: '#404040',
  				800: '#262626',
  				900: '#171717',
  				950: '#0a0a0a'
  			},
  			// Glass overlays
  			glass: {
  				light: 'rgba(255, 255, 255, 0.05)',
  				medium: 'rgba(255, 255, 255, 0.1)',
  				strong: 'rgba(255, 255, 255, 0.15)'
  			},
  			// Core tokens
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		boxShadow: {
  			'glow-primary-sm': '0 0 10px rgba(168, 85, 247, 0.3)',
  			'glow-primary': '0 0 20px rgba(168, 85, 247, 0.4)',
  			'glow-primary-lg': '0 0 40px rgba(168, 85, 247, 0.5)',
  			'glow-secondary-sm': '0 0 10px rgba(244, 114, 182, 0.3)',
  			'glow-secondary': '0 0 20px rgba(244, 114, 182, 0.4)',
  			'glow-secondary-lg': '0 0 40px rgba(244, 114, 182, 0.5)',
  		},
  		backdropBlur: {
  			glass: '12px',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'glow-pulse': {
  				'0%, 100%': { 
  					boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' 
  				},
  				'50%': { 
  					boxShadow: '0 0 40px rgba(168, 85, 247, 0.6)' 
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'glow-pulse': 'glow-pulse 2s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}