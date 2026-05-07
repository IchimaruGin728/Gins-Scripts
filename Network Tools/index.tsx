// Network Tools — Comprehensive network utilities for iOS
// Entry point with 5-tab TabView using iOS 26 Liquid Glass UI
import { Script, Navigation, useState, TabView, NavigationStack, Label, Button } from 'scripting'

import DashboardView from './views/Dashboard'
import ConnectivityView from './views/Connectivity'
import LookupView from './views/Lookup'
import ToolsView from './views/Tools'
import BGPView from './views/BGP'
import DNSBenchView from './views/DNSBench'

function App() {
  const dismiss = Navigation.useDismiss()
  const [tabIndex, setTabIndex] = useState(0)

  return (
    <TabView
      tabIndex={tabIndex}
      onTabIndexChanged={setTabIndex}
      toolbar={{
        primaryAction: <Button title="Minimize" systemImage="minus.circle" action={() => Script.minimize()} />,
        cancellationAction: <Button title="Close" systemImage="xmark.circle" action={dismiss} />,
      }}
    >
      {/* Tab 1: Dashboard — IP Info & Risk */}
      <NavigationStack
        tabItem={<Label title="Dashboard" systemImage="globe" />}
        tag={0}
      >
        <DashboardView />
      </NavigationStack>

      {/* Tab 2: Connectivity — Ping & Ports */}
      <NavigationStack
        tabItem={<Label title="Connectivity" systemImage="waveform.path.ecg" />}
        tag={1}
      >
        <ConnectivityView />
      </NavigationStack>

      {/* Tab 3: Lookup — DNS, WHOIS, SSL */}
      <NavigationStack
        tabItem={<Label title="Lookup" systemImage="magnifyingglass" />}
        tag={2}
      >
        <LookupView />
      </NavigationStack>

      {/* Tab 4: Tools — Subnet, Hash, Encoding */}
      <NavigationStack
        tabItem={<Label title="Tools" systemImage="wrench.and.screwdriver" />}
        tag={3}
      >
        <ToolsView />
      </NavigationStack>

      {/* Tab 5: BGP — bgp.tools & PeeringDB */}
      <NavigationStack
        tabItem={<Label title="BGP" systemImage="server.rack" />}
        tag={4}
      >
        <BGPView />
      </NavigationStack>

      {/* Tab 6: DNS Benchmark — DoH Speed Test */}
      <NavigationStack
        tabItem={<Label title="DNS Bench" systemImage="speedometer" />}
        tag={5}
      >
        <DNSBenchView />
      </NavigationStack>
    </TabView>
  )
}

;(async () => {
  await Navigation.present({
    element: <App />,
  })
})().finally(Script.exit)
