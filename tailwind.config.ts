import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssTypography from "@tailwindcss/typography";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '1.5rem',
			screens: {
				'2xl': '1280px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				heading: ['"Bricolage Grotesque"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			},
			fontSize: {
				// Fluid display scale — clamp(min, preferred, max)
				'display-lg': ['clamp(2.5rem, 1.4rem + 4.6vw, 4rem)', { lineHeight: '1.04', letterSpacing: '-0.02em' }],
				'display': ['clamp(2rem, 1.4rem + 2.6vw, 3rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
				'heading': ['clamp(1.5rem, 1.15rem + 1.5vw, 2.25rem)', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
				'subheading': ['clamp(1.25rem, 1.1rem + 0.7vw, 1.5rem)', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				brand: {
					primary: 'hsl(var(--brand-primary))',
					secondary: 'hsl(var(--brand-secondary))',
					accent: 'hsl(var(--brand-accent))'
				},
				complementary: {
					DEFAULT: 'hsl(var(--complementary))',
					foreground: 'hsl(var(--complementary-foreground))'
				},
				ink: {
					DEFAULT: 'hsl(var(--ink))',
					foreground: 'hsl(var(--ink-foreground))'
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
			backgroundImage: {
				'gradient-tropical': 'var(--gradient-tropical)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-complementary': 'var(--gradient-complementary)',
				'gradient-subtle': 'var(--gradient-subtle)',
			},
			boxShadow: {
				'sm': 'var(--shadow-sm)',
				'card': 'var(--shadow-card)',
				'card-hover': 'var(--shadow-card-hover)',
				'elevated': 'var(--shadow-lg)',
				'tropical': 'var(--shadow-tropical)',
				'complementary': 'var(--shadow-complementary)',
			},
			borderRadius: {
				card: 'var(--radius-card)',
				control: 'var(--radius-control)',
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			transitionTimingFunction: {
				'out-expo': 'var(--ease-out)',
				'in-out-quad': 'var(--ease-in-out)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				marquee: {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(-50%)' }
				},
				'ken-burns': {
					'0%': { transform: 'scale(1)' },
					'100%': { transform: 'scale(1.06)' }
				},
				// A once-per-cycle soft glow pulse for the hero's primary CTA — the
				// button rests still for most of the cycle, then breathes gently for
				// a moment. Deliberately subtle: a concierge cue, not a shimmer sweep.
				// Uses `filter: drop-shadow(...)`, not `box-shadow` — CSS animations
				// take exclusive ownership of the properties they animate for their
				// whole duration (they beat :hover/:focus-visible outright, not just
				// by specificity), so animating box-shadow here would silently blank
				// out the hover/focus glow for most of every 7s cycle.
				'cta-idle-glow': {
					'0%, 88%, 100%': { filter: 'drop-shadow(0 0 0 hsl(var(--primary) / 0))' },
					'94%': { filter: 'drop-shadow(0 0 14px hsl(var(--primary) / 0.45))' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				marquee: 'marquee 40s linear infinite',
				'ken-burns': 'ken-burns 18s ease-out forwards',
				'cta-idle-glow': 'cta-idle-glow 7s ease-in-out infinite'
			}
		}
	},
	plugins: [tailwindcssAnimate, tailwindcssTypography],
} satisfies Config;
