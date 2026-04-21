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
      paper: "#0b0b12",
      panel: "#ffffff",
      ink: "#f7f7ff",
      "ink-soft": "#a6a7bb",
      line: "#2b2d43",
      primary: "#8b5cf6",
      "primary-soft": "#241a3d",
      chip: "#171826",
      "chip-active": "#201b37",
    },
    keyframes: {
      rise: "{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
      drift: "{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}",
      pulsebar:
        "{0%{transform:scaleY(.4);opacity:.4}50%{transform:scaleY(1);opacity:1}100%{transform:scaleY(.4);opacity:.4}}",
      glow: "{0%,100%{box-shadow:0 0 0 rgba(99,102,241,0)}50%{box-shadow:0 0 0 6px rgba(99,102,241,.12)}}",
    },
    boxShadow: {
      panel: "0 18px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      soft: "0 8px 24px rgba(0, 0, 0, 0.28)",
    },
  },
  shortcuts: {
    shell: "min-h-screen bg-paper text-ink antialiased font-sans",
    page: "mx-auto max-w-[1280px] px-4 pb-20 md:px-6",
    govbar:
      "mx--4 h-9 flex items-center gap-2 border-b border-line bg-[#0f101a]/92 px-4 text-[13px] text-ink-soft backdrop-blur-md md:mx--6",
    topbar:
      "sticky top-3 z-40 mt-3 flex items-center justify-between rounded-full border border-white/12 bg-[#121322]/72 px-5 py-3 shadow-soft backdrop-blur-xl",
    navpill:
      "inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-ink no-underline transition duration-200 hover:bg-chip/90 hover:text-white data-[active=true]:bg-primary-soft data-[active=true]:text-primary",
    hero: "relative mt-5 overflow-hidden rounded-[28px] border border-white/12 bg-[#121322]/74 px-6 pt-16 pb-22 text-center shadow-panel backdrop-blur-xl animate-[rise_.55s_ease_both] md:px-10",
    search:
      "mx-auto mt-6 flex h-13 w-full max-w-[560px] items-center rounded-full border border-white/15 bg-[#0f1020]/85 px-5 text-[16px] text-ink-soft shadow-soft",
    chip: "inline-flex h-11 items-center gap-2 rounded-full border border-white/12 bg-chip px-4 text-[15px] font-semibold text-ink transition duration-250 hover:bg-chip-active hover:border-primary/45 hover:text-white",
    sectiontitle: "mb-5 mt-12 text-2xl font-bold tracking-[-0.02em] text-[#ddd8ff]",
    card: "rounded-[22px] border border-white/12 bg-[#121322]/74 p-5 shadow-soft backdrop-blur-xl transition duration-250 animate-[rise_.55s_ease_both] hover:-translate-y-0.75 hover:border-primary/45 hover:shadow-panel",
    eyebrow: "mb-2.5 text-[11px] uppercase tracking-[0.06em] text-ink-soft",
    empty: "rounded-4 border border-dashed border-white/14 bg-chip p-4.5 text-sm text-ink-soft",
    trend: "flex h-8 items-end gap-1 text-primary",
    trendbar:
      "w-1.5 rounded-full bg-primary/80 origin-bottom animate-[pulsebar_1.6s_ease-in-out_infinite]",
  },
})
