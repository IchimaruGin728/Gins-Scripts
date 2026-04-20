import { defineConfig, presetUno } from "unocss"

export default defineConfig({
  presets: [presetUno()],
  theme: {
    colors: {
      paper: "#f7f3ea",
      "paper-strong": "#fffdf8",
      ink: "#1c2430",
      muted: "#677489",
      line: "#d9d5cc",
      card: "#fffdf8",
      accent: "#e8713a",
      "accent-soft": "#fff0e7",
      link: "#1b5fa7",
      chip: "#f0ece4",
    },
    keyframes: {
      rise: "{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
    },
    boxShadow: {
      soft: "0 1px 0 rgba(28, 36, 48, 0.02)",
      float: "0 16px 28px rgba(28, 36, 48, 0.05)",
      accent: "0 8px 18px rgba(232, 113, 58, 0.14)",
    },
  },
  shortcuts: {
    shell:
      "min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(232,113,58,0.10),transparent_22rem),linear-gradient(180deg,#fcfaf6_0%,#f7f3ea_100%)] text-ink",
    page: "mx-auto max-w-[1160px] px-5 pb-18 pt-6",
    topbar:
      "mb-8 flex flex-col gap-4 border-b border-line py-4 md:flex-row md:items-center md:justify-between",
    navpill:
      "inline-flex min-h-9 items-center rounded-full border border-line bg-paper-strong px-3.5 text-sm font-semibold text-ink no-underline transition duration-200 hover:-translate-y-0.25 hover:border-[#c7bfb0] hover:bg-white",
    hero: "mb-6 grid gap-4 py-2 animate-[rise_.55s_ease_both]",
    pill: "inline-flex w-fit rounded-full bg-accent-soft px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-accent",
    cta: "inline-flex min-h-11 items-center rounded-[14px] border border-transparent bg-accent px-4.5 text-white no-underline font-bold transition duration-200 hover:-translate-y-0.25 hover:shadow-accent",
    "cta-secondary": "bg-paper-strong text-ink border-line",
    sectiontitle: "mb-3.5 mt-8 text-2xl font-bold tracking-[-0.02em]",
    card: "rounded-5 border border-line bg-card p-5 shadow-soft transition duration-250 animate-[rise_.55s_ease_both] hover:-translate-y-0.5 hover:border-[#cfc5b6] hover:shadow-float",
    eyebrow: "mb-2.5 text-[11px] uppercase tracking-[0.06em] text-muted",
    empty: "rounded-4 border border-dashed border-line bg-chip p-4.5 text-sm text-muted",
  },
})
