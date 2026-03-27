/** @jsx React.createElement */
// @ts-ignore
const {
  FileManager,
  HTTP,
  Alert,
  Toast,
  Path,
  Runtime,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Navigation,
  Script,
} = Scripting;
// @ts-ignore
const { useState, useEffect } = React;

type ProxyApp = "Surge" | "Rocket" | "Stash" | "Loon" | "Egern" | "QX";

interface AppProfile {
  name: ProxyApp;
  bookmark: string;
  extension: string;
  folder: string;
  icon: string;
  color: string;
  shType: string;
}

const PROFILES: Record<ProxyApp, AppProfile> = {
  Surge: {
    name: "Surge",
    bookmark: "Gins-Surge",
    extension: ".sgmodule",
    folder: "Modules",
    icon: "bolt.horizontal.fill",
    color: "#ff8c00",
    shType: "surge",
  },
  Rocket: {
    name: "Rocket",
    bookmark: "Gins-Rocket",
    extension: ".conf",
    folder: "/",
    icon: "rocket.fill",
    color: "#34c759",
    shType: "shadowrocket",
  },
  Stash: {
    name: "Stash",
    bookmark: "Gins-Stash",
    extension: ".stmodule",
    folder: "Modules",
    icon: "archivebox.fill",
    color: "#007aff",
    shType: "stash",
  },
  Loon: {
    name: "Loon",
    bookmark: "Gins-Loon",
    extension: ".plugin",
    folder: "Plugins",
    icon: "balloon.fill",
    color: "#af52de",
    shType: "loon",
  },
  Egern: {
    name: "Egern",
    bookmark: "Gins-Egern",
    extension: ".egern",
    folder: "Modules",
    icon: "leaf.fill",
    color: "#ff2d55",
    shType: "egern",
  },
  QX: {
    name: "QX",
    bookmark: "Gins-QX",
    extension: ".snippet",
    folder: "Snippets",
    icon: "square.stack.3d.up.fill",
    color: "#5ac8fa",
    shType: "qx",
  },
};

const SH_ENDPOINT = "https://sh.scripthub.top/convert";

export default function ProxyHub() {
  const [selectedApp, setSelectedApp] = useState<ProxyApp>("Surge");
  const [isUpdating, setIsUpdating] = useState(false);
  const [bookmarks, setBookmarks] = useState<Record<string, string>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    Object.values(PROFILES).forEach((p: AppProfile) => {
      const path = FileManager.pathForBookmark(p.bookmark);
      if (path) map[p.name] = path;
    });
    setBookmarks(map);
  }, []);

  const profile = PROFILES[selectedApp as ProxyApp];

  const handleUpdate = async () => {
    const targetPath = bookmarks[selectedApp];
    if (!targetPath) {
      const pick = await FileManager.pickDirectory();
      if (!pick) return;
      FileManager.addFileBookmark(pick.path, profile.bookmark);
      setBookmarks((prev: Record<string, string>) => ({
        ...prev,
        [selectedApp]: pick.path,
      }));
      return;
    }

    setIsUpdating(true);
    try {
      const url =
        "https://raw.githubusercontent.com/ichimarugin728/Gins-Rules/main/dist/General.sgmodule";
      const convertUrl = `${SH_ENDPOINT}?url=${encodeURIComponent(url)}&type=${profile.shType}`;

      Toast.show(`Converting for ${selectedApp}...`);
      const res = await HTTP.get(convertUrl);

      if (res.status === 200) {
        const fileName = `Gins-Rules${profile.extension}`;
        await FileManager.writeString(
          Path.join(targetPath, fileName),
          res.body,
        );
        Runtime.haptic("success");
        Toast.show("Update Complete ✨");
      } else {
        throw new Error("Conversion failed");
      }
    } catch (e: any) {
      Alert.show("Engine Error", e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f2f7" }}>
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffffcc",
          blur: 50,
        }}
      />

      <View
        style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 }}
      >
        <Text style={{ fontSize: 34, fontWeight: "bold", color: "#000" }}>
          Proxy Hub
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Horizontal App Picker (Segmented Control style) */}
        <View style={{ marginTop: 10, paddingHorizontal: 20 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexDirection: "row", gap: 10 }}
          >
            {Object.keys(PROFILES).map((key) => {
              const active = selectedApp === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setSelectedApp(key as ProxyApp)}
                  style={{
                    backgroundColor: active ? "#fff" : "#e3e3e8",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 10,
                    shadowColor: "#000",
                    shadowOpacity: active ? 0.05 : 0,
                    shadowRadius: 5,
                  }}
                >
                  <Text
                    style={{
                      color: active ? "#007AFF" : "#8e8e93",
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Workspace (Inset Grouped Card) */}
        <View
          style={{
            marginTop: 25,
            marginHorizontal: 20,
            backgroundColor: "#fff",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <View style={{ padding: 20, alignItems: "center" }}>
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: 20,
                backgroundColor: profile.color + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                systemName={profile.icon}
                foregroundStyle={profile.color}
                symbolScale={{ point: 36 }}
              />
            </View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: "#000",
                marginTop: 15,
              }}
            >
              {profile.name} Controller
            </Text>
            <Text style={{ fontSize: 15, color: "#8e8e93", marginTop: 4 }}>
              {bookmarks[selectedApp]
                ? "Directory Linked ✅"
                : "Configuration Required ⚠️"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleUpdate}
            disabled={isUpdating}
            style={{
              backgroundColor: isUpdating ? "#ebebeb" : "#007aff",
              margin: 20,
              height: 50,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: isUpdating ? "#8e8e93" : "#fff",
                fontSize: 17,
                fontWeight: "bold",
              }}
            >
              {isUpdating ? "Converting..." : `Synchronize ${selectedApp}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section (Native Style) */}
        <View style={{ marginTop: 40, paddingHorizontal: 20 }}>
          <Text
            style={{
              fontSize: 13,
              color: "#8e8e93",
              marginBottom: 10,
              marginLeft: 16,
            }}
          >
            CONFIGURATIONS
          </Text>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <TouchableOpacity
              onPress={handleUpdate}
              style={{
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 0.5,
                borderColor: "#c6c6c8",
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: "#5856d6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  systemName="arrow.triangle.2.circlepath"
                  foregroundStyle="#fff"
                  symbolScale={{ point: 16 }}
                />
              </View>
              <Text
                style={{ marginLeft: 12, flex: 1, fontSize: 17, color: "#000" }}
              >
                Convert via Script Hub
              </Text>
              <Image
                systemName="chevron.right"
                foregroundStyle="#c7c7cc"
                symbolScale={{ point: 14 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {}}
              style={{
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: "#ff9500",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  systemName="link"
                  foregroundStyle="#fff"
                  symbolScale={{ point: 16 }}
                />
              </View>
              <Text
                style={{ marginLeft: 12, flex: 1, fontSize: 17, color: "#000" }}
              >
                Custom Sources
              </Text>
              <Text style={{ color: "#8e8e93", fontSize: 17 }}>2 Active</Text>
              <Image
                systemName="chevron.right"
                foregroundStyle="#c7c7cc"
                symbolScale={{ point: 14 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={{ padding: 20, alignItems: "center" }}>
        <Text style={{ color: "#c7c7cc", fontSize: 11 }}>
          Gins-Native Engine • Scripting Pro Suite
        </Text>
      </View>
    </View>
  );
}

async function main() {
  await Navigation.present({ element: <ProxyHub /> });
  Script.exit();
}

main();
