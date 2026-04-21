import { defineConfig, presetUno } from "unocss"

export default defineConfig({
  presets: [presetUno()],
  theme: {
    fontFamily: {
      sans: [
        "SF Pro Text",
        "SF Pro Display",
        "SF Pro",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Helvetica Neue",
        "Arial",
        "system-ui",
        "sans-serif",
      ],
      mono: [
        "SF Mono",
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Monaco",
        "Consolas",
        "Liberation Mono",
        "Courier New",
        "monospace",
      ],
    },
    colors: {
      paper: "#f7f7fb",
      panel: "#ffffff",
      ink: "#2e3138",
      "ink-soft": "#666b77",
      line: "#dbdee7",
      primary: "#6366f1",
      "primary-soft": "#f0f1ff",
      chip: "#f4f5fa",
      "chip-active": "#eceeff",
    },
    keyframes: {
      rise: "{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
      drift: "{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}",
      pulsebar:
        "{0%{transform:scaleY(.4);opacity:.4}50%{transform:scaleY(1);opacity:1}100%{transform:scaleY(.4);opacity:.4}}",
      glow: "{0%,100%{box-shadow:0 0 0 rgba(99,102,241,0)}50%{box-shadow:0 0 0 6px rgba(99,102,241,.12)}}",
    },
    boxShadow: {
      panel: "0 1px 1px rgba(42, 48, 61, 0.04), 0 10px 30px rgba(42, 48, 61, 0.05)",
      soft: "0 2px 8px rgba(42, 48, 61, 0.05)",
    },
  },
  shortcuts: {
    shell: "min-h-screen bg-paper text-ink antialiased font-sans",
    page: "mx-auto max-w-[1280px] px-4 pb-20 md:px-6",
    govbar:
      "mx--4 h-9 flex items-center gap-2 border-b border-line bg-white px-4 text-[13px] text-ink-soft md:mx--6",
    topbar:
      "mt-3 flex items-center justify-between rounded-2xl border border-line bg-panel px-5 py-4 shadow-soft",
    navpill:
      "inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-ink no-underline transition duration-200 hover:bg-chip data-[active=true]:bg-primary-soft data-[active=true]:text-primary",
    hero: "relative mt-4 overflow-hidden rounded-3xl border border-line bg-panel px-6 pt-16 pb-22 text-center shadow-panel animate-[rise_.55s_ease_both] md:px-10",
    search:
      "mx-auto mt-6 flex h-13 w-full max-w-[560px] items-center rounded-full border border-[#c7cad4] bg-white px-5 text-[16px] text-ink-soft shadow-soft",
    chip: "inline-flex h-11 items-center gap-2 rounded-full border border-line bg-chip px-4 text-[15px] font-semibold text-ink transition duration-200 hover:bg-chip-active hover:border-primary/40 hover:text-primary",
    sectiontitle: "mb-3.5 mt-8 text-2xl font-bold tracking-[-0.02em]",
    card: "rounded-5 border border-line bg-panel p-5 shadow-soft transition duration-250 animate-[rise_.55s_ease_both] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-panel",
    eyebrow: "mb-2.5 text-[11px] uppercase tracking-[0.06em] text-ink-soft",
    empty: "rounded-4 border border-dashed border-line bg-chip p-4.5 text-sm text-ink-soft",
    trend: "flex h-8 items-end gap-1 text-primary",
    trendbar:
      "w-1.5 rounded-full bg-primary/80 origin-bottom animate-[pulsebar_1.6s_ease-in-out_infinite]",
  },
})
