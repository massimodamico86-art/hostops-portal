// src/TV.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Layout1, Layout2, Layout3, Layout4 } from "./layouts";

import ScaledStage from "./ScaledStage.jsx";
import { getConfig } from "./getConfig.js";

const LAYOUTS = {
  layout1: Layout1,
  layout2: Layout2,
  layout3: Layout3,
  layout4: Layout4,
};

export default function TV() {
  const [params] = useSearchParams();
  const token = params.get("token") || "TV-LOBBY-001";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [config, setConfig] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    // Initial config fetch
    getConfig(token)
      .then((payload) => {
        if (!alive) return;
        // payload shape: { guest, layout: {...} }
        console.log("TV loaded config:", payload?.layout?.layout_key, payload);
        setConfig(payload);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || "Failed to load config");
      })
      .finally(() => alive && setLoading(false));

    // Refresh weather every 30 minutes
    const weatherRefreshInterval = setInterval(() => {
      if (!alive) return;

      getConfig(token)
        .then((payload) => {
          if (!alive) return;
          console.log("Weather refreshed at", new Date().toLocaleTimeString());
          setConfig(payload);
        })
        .catch((e) => {
          console.error("Failed to refresh weather:", e);
        });
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      alive = false;
      clearInterval(weatherRefreshInterval);
    };
  }, [token]);

  const key = config?.layout?.layout_key || "layout1";
  const Active = LAYOUTS[key] || Layout1;

  // Background image from config, fallback empty
  const bgImage = config?.layout?.backgroundImage || "";

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;
  if (!config) return <div style={{ padding: 24 }}>No config</div>;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#000",
        backgroundImage: bgImage ? `url(${bgImage})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Fit the designed 16:9 canvas to any screen */}
      <ScaledStage baseWidth={1920} baseHeight={1080}>
        <Active layout={config.layout} guest={config.guest} />
      </ScaledStage>
    </div>
  );
}
