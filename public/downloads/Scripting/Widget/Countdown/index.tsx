import {
  Button,
  DatePicker,
  HStack,
  Image,
  List,
  Navigation,
  NavigationStack,
  Picker,
  Script,
  Section,
  Spacer,
  Text,
  TextField,
  useState,
  VStack,
  Widget,
} from "scripting"
import {
  COLOR_KEYS,
  COLOR_MAP,
  type ColorKey,
  type CountdownItem,
  HEATMAP_LABELS,
  ICON_OPTIONS,
  formatDate,
  isValidDateText,
  itemState,
  loadHeatmapColor,
  loadItems,
  loadTheme,
  normalizeDate,
  parseDate,
  saveItems,
  toggleHeatmapColor,
  toggleTheme,
} from "./shared"

function createItem(): CountdownItem {
  const nextMonth = new Date()
  nextMonth.setDate(nextMonth.getDate() + 30)
  return {
    id: `countdown-${Date.now()}`,
    name: "",
    icon: "hourglass",
    iconType: "sys",
    date: formatDate(nextMonth),
    colorKey: "blue",
    created: Date.now(),
  }
}

function iconLabel(item: CountdownItem) {
  if (item.iconType === "txt") return item.icon || "TXT"
  return ICON_OPTIONS.find((option) => option.icon === item.icon)?.label || "系统图标"
}

function ItemRow({ item }: { item: CountdownItem }) {
  const state = itemState(item)
  return (
    <HStack spacing={10}>
      {item.iconType === "sys" ? (
        <Image systemName={item.icon} resizable scaleToFit frame={{ width: 20, height: 20 }} foregroundStyle={COLOR_MAP[item.colorKey]} />
      ) : (
        <Text font={{ size: 20 }}>{item.icon}</Text>
      )}
      <VStack alignment="leading" spacing={2}>
        <Text font={{ size: 16, weight: "semibold" }} foregroundStyle={state.isUrgent ? "systemRed" : "primary"}>
          {item.name}
        </Text>
        <Text font={{ size: 12, weight: "regular" }} foregroundStyle="secondary">
          {item.date} · {state.diff} 天
        </Text>
      </VStack>
      <Spacer />
      <Image systemName="chevron.right" resizable scaleToFit frame={{ width: 8, height: 12 }} foregroundStyle="secondary" />
    </HStack>
  )
}

function EditorView(props: {
  initial: CountdownItem
  onSave: (item: CountdownItem) => void
  onDelete?: () => void
}) {
  const dismiss = Navigation.useDismiss()
  const [name, setName] = useState(props.initial.name)
  const [date, setDate] = useState(parseDate(props.initial.date).getTime())
  const [iconIndex, setIconIndex] = useState(() => Math.max(0, ICON_OPTIONS.findIndex((option) => option.icon === props.initial.icon)))
  const [customIcon, setCustomIcon] = useState(props.initial.iconType === "txt" ? props.initial.icon : "")
  const [colorKey, setColorKey] = useState<ColorKey>(props.initial.colorKey)
  const [useCustomIcon, setUseCustomIcon] = useState(props.initial.iconType === "txt")

  const dateText = formatDate(new Date(date))
  const canSave = name.trim().length > 0 && isValidDateText(normalizeDate(dateText))

  function save() {
    if (!canSave) return
    const option = ICON_OPTIONS[iconIndex] || ICON_OPTIONS[0]
    props.onSave({
      ...props.initial,
      name: name.trim(),
      icon: useCustomIcon ? customIcon.trim() || "📌" : option.icon,
      iconType: useCustomIcon ? "txt" : option.iconType,
      date: dateText,
      colorKey,
    })
    dismiss()
  }

  return (
    <NavigationStack
      title={props.initial.name ? "编辑倒计时" : "添加倒计时"}
      toolbar={{
        cancellationAction: <Button title="取消" action={() => dismiss()} />,
        confirmationAction: <Button title="保存" action={save} disabled={!canSave} />,
      }}
    >
      <List listStyle="insetGroup">
        <Section header={<Text>基本信息</Text>}>
          <TextField title="项目名称" value={name} onChanged={setName} prompt="例如：考试、生日、旅行" />
          <DatePicker
            title="目标日期"
            value={date}
            onChanged={setDate}
            displayedComponents={["date"]}
            datePickerStyle="compact"
          />
          <Text font={{ size: 12 }} foregroundStyle={canSave ? "secondary" : "systemRed"}>
            {canSave ? `保存日期：${dateText}` : "请填写项目名称"}
          </Text>
        </Section>

        <Section header={<Text>图标</Text>}>
          <Picker value={useCustomIcon ? "custom" : "system"} onChanged={(value) => setUseCustomIcon(value === "custom")} pickerStyle="segmented">
            <Text tag="system">系统</Text>
            <Text tag="custom">自定义</Text>
          </Picker>
          {useCustomIcon ? (
            <TextField title="Emoji/文字" value={customIcon} onChanged={setCustomIcon} prompt="例如：🚀" />
          ) : (
            <Picker value={iconIndex} onChanged={setIconIndex} pickerStyle="menu" title={`图标：${iconLabel(props.initial)}`}>
              {ICON_OPTIONS.map((option, index) => (
                <Text tag={index}>{option.label}</Text>
              ))}
            </Picker>
          )}
        </Section>

        <Section header={<Text>主题色</Text>}>
          <Picker value={colorKey} onChanged={(value) => setColorKey(value as ColorKey)} pickerStyle="segmented">
            {COLOR_KEYS.map((key) => (
              <Text tag={key}>{key}</Text>
            ))}
          </Picker>
        </Section>

        {props.onDelete ? (
          <Section>
            <Button
              title="删除项目"
              role="destructive"
              action={() => {
                props.onDelete?.()
                dismiss()
              }}
            />
          </Section>
        ) : null}
      </List>
    </NavigationStack>
  )
}

function App() {
  const [items, setItems] = useState(loadItems())
  const [theme, setTheme] = useState(loadTheme())
  const [heatmap, setHeatmap] = useState(loadHeatmapColor())

  function persist(nextItems: CountdownItem[]) {
    setItems(nextItems)
    saveItems(nextItems)
  }

  function saveItem(item: CountdownItem) {
    const exists = items.some((entry) => entry.id === item.id)
    persist(exists ? items.map((entry) => (entry.id === item.id ? item : entry)) : [...items, item])
  }

  return (
    <NavigationStack
      title="倒计时管理中心"
      toolbar={{
        primaryAction: (
          <Button
            title="添加"
            action={() => {
              Navigation.present({
                element: <EditorView initial={createItem()} onSave={saveItem} />,
              })
            }}
          />
        ),
      }}
    >
      <List listStyle="insetGroup">
        <Section header={<Text>项目</Text>}>
          {items.map((item) => (
            <Button
              action={() => {
                Navigation.present({
                  element: (
                    <EditorView
                      initial={item}
                      onSave={saveItem}
                      onDelete={() => persist(items.filter((entry) => entry.id !== item.id))}
                    />
                  ),
                })
              }}
            >
              <ItemRow item={item} />
            </Button>
          ))}
        </Section>

        <Section header={<Text>显示</Text>}>
          <Button
            action={() => {
              setTheme(toggleTheme())
            }}
          >
            <HStack>
              <Text>主题</Text>
              <Spacer />
              <Text foregroundStyle="secondary">{theme === "dark" ? "深色" : "浅色"}</Text>
            </HStack>
          </Button>
          <Button
            action={() => {
              setHeatmap(toggleHeatmapColor())
            }}
          >
            <HStack>
              <Text>热力颜色</Text>
              <Spacer />
              <Text foregroundStyle="secondary">{HEATMAP_LABELS[heatmap]}</Text>
            </HStack>
          </Button>
        </Section>

        <Section header={<Text>预览</Text>}>
          <Button
            title="预览中号小组件"
            action={async () => {
              await Widget.preview({ family: "systemMedium" })
            }}
          />
          <Button
            title="刷新桌面小组件"
            action={() => {
              Widget.reloadAll()
            }}
          />
        </Section>
      </List>
    </NavigationStack>
  )
}

await Navigation.present({ element: <App /> })
Script.exit()
