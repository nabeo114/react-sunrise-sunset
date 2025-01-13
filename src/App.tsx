import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { Box, Typography, CircularProgress, Paper } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import "leaflet/dist/leaflet.css";

// Leafletのアイコン設定
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// アイコンの設定
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// マップクリックイベント用コンポーネント
const AddMarkerOnClick: React.FC<{
  setMarker: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  fetchSunriseSunset: (lat: number, lng: number) => void;
}> = ({ setMarker, fetchSunriseSunset }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setMarker([lat, lng]);
      fetchSunriseSunset(lat, lng);
    },
  });

  return null;
};

const SunriseSunsetInfo: React.FC<{ sunriseSunset: any }> = ({ sunriseSunset }) => {
  return (
    <Paper elevation={2} sx={{ paddingY: 0.2, paddingX: 2, marginTop: 0.6 }}>
      {sunriseSunset ? (
        <>
          <Typography variant="body2" sx={{ lineHeight: 0.2 }}>
            <b>Sunrise:</b> {sunriseSunset.sunrise}
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 0.2 }}>
            <b>Sunset:</b> {sunriseSunset.sunset}
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 0.2 }}>
            <b>Solar Noon:</b> {sunriseSunset.solarNoon}
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 0.2 }}>
            <b>Day Length:</b> {sunriseSunset.dayLength}
          </Typography>
        </>
      ) : (
        <CircularProgress size={24} />
      )}
    </Paper>
  );
};

const App: React.FC = () => {
  const defaultPosition: [number, number] = [35.6895, 139.6917]; // 東京の座標（デフォルト）
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null); // 現在地
  const [marker, setMarker] = useState<[number, number] | null>(null); // マーカーの座標
  const [sunriseSunset, setSunriseSunset] = useState<{ sunrise: string; sunset: string; solarNoon: string; dayLength: string; } | null>(null); // 日の出・日の入り、南中時刻、昼の長さ

  // Geolocation API を使用して現在地を取得
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Failed to retrieve location:", error);
          setCurrentPosition(defaultPosition); // 現在地が取得できない場合はデフォルト位置を使用
        }
      );
    } else {
      console.warn("This browser does not support the Geolocation API");
      setCurrentPosition(defaultPosition);
    }
  }, []);

  // 日の出・日の入り情報を取得
  const fetchSunriseSunset = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`);
      const data = await response.json();

      if (data.status === "OK") {
        // UTCをローカル時間に変換
        const sunrise = new Date(data.results.sunrise).toLocaleTimeString();
        const sunset = new Date(data.results.sunset).toLocaleTimeString();
        const solarNoon = new Date(data.results.solar_noon).toLocaleTimeString();
        const dayLength = new Date(data.results.day_length * 1000).toISOString().substr(11, 8); // 時間:分:秒の形式に変換

        setSunriseSunset({ sunrise, sunset, solarNoon, dayLength });
      } else {
        console.error("Failed to retrieve sunrise/sunset data:", data.status);
      }
    } catch (error) {
      console.error("API error:", error);
    }
  };

  // 現在地が取得できるまでローディング状態を表示
  if (!currentPosition) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* ヘッダーと説明文 */}
      <Box sx={{ padding: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>Map and Sunrise/Sunset Info</Typography>
        <Typography variant="body1" align="center" paragraph>
          You can click anywhere on the map to place a marker and retrieve sunrise, sunset, solar noon, and day length for that location.
        </Typography>
      </Box>

      {/* マップ部分 */}
      <Box sx={{ flexGrow: 1 }}>
        <MapContainer center={currentPosition} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <AddMarkerOnClick setMarker={setMarker} fetchSunriseSunset={fetchSunriseSunset} />
          {marker && (
            <Marker position={marker}>
              <Popup>
                Latitude: {marker[0].toFixed(4)}, Longitude: {marker[1].toFixed(4)}
                <br />
                <SunriseSunsetInfo sunriseSunset={sunriseSunset} />
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </Box>
    </Box>
  );
};

export default App;
