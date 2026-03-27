/** @jsx React.createElement */
// @ts-ignore
const {
  FileManager,
  HTTP,
  Path,
  Runtime,
  Alert,
  Toast,
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

const API_BASE = "https://rime.ichimarugin728.com";
const BUNDLE_URL = `${API_BASE}/download/dist/gins-rime-bundle.zip`;
const VERSION_URL = `${API_BASE}/api/versions`;
const bookmarkName = "Gins-Rime-Folder";

export default function Home() {
  const [latestVersion, setLatestVersion] = useState<string>("Checking...");
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rimePath, setRimePath] = useState<string | null>(null);

  useEffect(() => {
    checkVersion();
    const path = FileManager.pathForBookmark(bookmarkName);
    if (path) setRimePath(path);
  }, []);

  const checkVersion = async () => {
    try {
      const res = await HTTP.get(VERSION_URL);
      const data = JSON.parse(res.body);
      setLatestVersion(data.updated_at?.substring(0, 10) || "2024.03.27");
    } catch (e) {}
  };

  const handleDeploy = async () => {
    if (!rimePath) {
      const pick = await FileManager.pickDirectory();
      if (pick) {
        FileManager.addFileBookmark(pick.path, bookmarkName);
        setRimePath(pick.path);
      }
      return;
    }

    setIsUpdating(true);
    Runtime.haptic("selection");

    try {
      const tempZip = Path.join(
        FileManager.temporaryDirectory,
        "gins-bundle.zip",
      );
      await HTTP.download(BUNDLE_URL, tempZip, (p: number) => setProgress(p));
      await FileManager.unzip(tempZip, rimePath);
      await FileManager.remove(tempZip);

      const deployURL = "hamster3://dev.fuxiao.app.hamster3/rime?action=deploy";
      await Runtime.openURL(deployURL);

      Runtime.haptic("success");
      Toast.show("Suite Deployed Successfully");
    } catch (e: any) {
      Alert.show("Sync Error", e.message || "Operation failed");
    } finally {
      setIsUpdating(false);
      setProgress(0);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f2f7" }}>
      {/* Native Glass Background */}
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffffcc",
          blur: 50,
        }}
      />

      {/* Inset Grouped Title */}
      <View
        style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 }}
      >
        <Text style={{ fontSize: 34, fontWeight: "bold", color: "#000" }}>
          Gins-Rime
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* System Section: Status */}
        <View
          style={{
            marginTop: 20,
            marginHorizontal: 20,
            backgroundColor: "#fff",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <View
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
                backgroundColor: "#007aff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                systemName="clock.fill"
                foregroundStyle="#fff"
                symbolScale={{ point: 16 }}
              />
            </View>
            <Text
              style={{ marginLeft: 12, flex: 1, fontSize: 17, color: "#000" }}
            >
              Latest Version
            </Text>
            <Text style={{ color: "#8e8e93", fontSize: 17 }}>
              {latestVersion}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setRimePath(null)}
            style={{ padding: 16, flexDirection: "row", alignItems: "center" }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: "#32d74b",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                systemName="folder.fill"
                foregroundStyle="#fff"
                symbolScale={{ point: 16 }}
              />
            </View>
            <Text
              style={{ marginLeft: 12, flex: 1, fontSize: 17, color: "#000" }}
            >
              Rime Directory
            </Text>
            <Text
              style={{ color: "#8e8e93", fontSize: 17, maxWidth: 120 }}
              numberOfLines={1}
            >
              {rimePath ? "Linked ✅" : "Select..."}
            </Text>
            <Image
              systemName="chevron.right"
              foregroundStyle="#c7c7cc"
              symbolScale={{ point: 14 }}
            />
          </TouchableOpacity>
        </View>

        {/* Progress Card (Visible during update) */}
        {isUpdating && (
          <View style={{ marginTop: 30, paddingHorizontal: 20 }}>
            <View
              style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ fontSize: 13, color: "#8e8e93", fontWeight: "600" }}
                >
                  SYNCHRONIZING...
                </Text>
                <Text
                  style={{ fontSize: 13, color: "#007aff", fontWeight: "bold" }}
                >
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: "#EBEBEB",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 6,
                    backgroundColor: "#007aff",
                    width: `${progress * 100}%`,
                  }}
                />
              </View>
            </View>
          </View>
        )}

        {/* Main Action Button (App Store Style) */}
        <View style={{ marginTop: 40, paddingHorizontal: 20 }}>
          <TouchableOpacity
            onPress={handleDeploy}
            disabled={isUpdating}
            style={{
              backgroundColor: isUpdating ? "#c7c7cc" : "#007aff",
              height: 52,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "bold" }}>
              {isUpdating ? "UPDATING" : "Sync & Deploy"}
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              color: "#8e8e93",
              fontSize: 12,
              textAlign: "center",
              marginTop: 12,
            }}
          >
            Requires Rime Bookmark Permissions
          </Text>
        </View>

        {/* Secondary Info (About) */}
        <View style={{ marginTop: 40, paddingHorizontal: 20 }}>
          <Text
            style={{
              fontSize: 13,
              color: "#8e8e93",
              marginBottom: 10,
              marginLeft: 16,
            }}
          >
            ABOUT GINS-RIME
          </Text>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <View
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
                  backgroundColor: "#ff3b30",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  systemName="info.circle.fill"
                  foregroundStyle="#fff"
                  symbolScale={{ point: 16 }}
                />
              </View>
              <Text
                style={{ marginLeft: 12, flex: 1, fontSize: 17, color: "#000" }}
              >
                Region Standard
              </Text>
              <Text style={{ color: "#8e8e93", fontSize: 17 }}>
                en-SG / zh-SG
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Status */}
      <View style={{ padding: 20, alignItems: "center" }}>
        <Text style={{ color: "#c7c7cc", fontSize: 11 }}>
          Gins-Liquid-Glass Suite v3.2.0
        </Text>
      </View>
    </View>
  );
}

async function main() {
  await Navigation.present({ element: <Home /> });
  Script.exit();
}

main();
