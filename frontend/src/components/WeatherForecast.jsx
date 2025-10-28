import React, { useEffect, useState } from "react";

export default function WeatherForecast() {
  const [weather, setWeather] = useState(null);
  const latitude = -18.8792; // Antananarivo
  const longitude = 47.5079;

  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=uv_index_max,precipitation_sum&timezone=Africa/Nairobi&language=fr`
    )
      .then((res) => res.json())
      .then((data) => {
        const info = {
          temperature: data.current_weather.temperature,
          windspeed: data.current_weather.windspeed,
          weathercode: data.current_weather.weathercode,
          uv: data.daily.uv_index_max[0],
          precipitation: data.daily.precipitation_sum[0],
        };
        setWeather(info);
      });
  }, []);

  const weatherIcons = {
    0: "☀️", // ciel clair
    1: "🌤️", // peu nuageux
    2: "⛅",  // partiellement nuageux
    3: "☁️",  // couvert
    45: "🌫️", // brouillard
    51: "🌦️", // bruine
    61: "🌧️", // pluie légère
    71: "🌨️", // neige
    95: "⛈️", // orage
  };

  if (!weather) {
    return (
      <div className="bg-gray-900 text-white p-6 rounded-3xl w-80 mx-auto text-center shadow-lg">
        Chargement météo...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white p-6 rounded-3xl w-80 mx-auto shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Antananarivo</h2>
          <p className="text-gray-400">Risque de pluie : {weather.precipitation}%</p>
        </div>
        <div className="text-5xl">{weatherIcons[weather.weathercode] || "☀️"}</div>
      </div>

      <div className="text-6xl font-bold">{weather.temperature}°</div>

      <div className="mt-4 bg-gray-800 p-4 rounded-2xl">
        <h3 className="text-sm text-gray-400 mb-2">Conditions actuelles</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>🌡️ Ressenti : {weather.temperature - 1}°</div>
          <div>💨 Vent : {weather.windspeed} km/h</div>
          <div>🌧️ Pluie : {weather.precipitation} mm</div>
          <div>☀️ UV : {weather.uv}</div>
        </div>
      </div>
    </div>
  );
}
