// Network Tools - App Intents for Widget Interactivity
import { AppIntentManager, AppIntentProtocol, Widget } from 'scripting'
import { fetchAllIPSources, calculateRisk } from './utils/ip'
import { ping } from './utils/shell'

// Refresh IP information and reload widget
export const RefreshIPIntent = AppIntentManager.register({
  name: 'RefreshIP',
  protocol: AppIntentProtocol.AppIntent,
  perform: async () => {
    try {
      await fetchAllIPSources()
    } catch { /* ignore */ }
    Widget.reloadAll()
  }
})

// Quick ping to Cloudflare DNS (1.1.1.1) and reload widget
export const QuickPingIntent = AppIntentManager.register({
  name: 'QuickPing',
  protocol: AppIntentProtocol.AppIntent,
  perform: async () => {
    try {
      await ping('1.1.1.1', 3)
    } catch { /* ignore */ }
    Widget.reloadAll()
  }
})

// Quick ping to Google DNS (8.8.8.8)
export const QuickPingGoogleIntent = AppIntentManager.register({
  name: 'QuickPingGoogle',
  protocol: AppIntentProtocol.AppIntent,
  perform: async () => {
    try {
      await ping('8.8.8.8', 3)
    } catch { /* ignore */ }
    Widget.reloadAll()
  }
})
