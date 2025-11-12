// src/getConfig.js
import { supabase } from "./supabase";
import { getWeather } from "./services/weatherService";

export async function getConfig(token) {
  if (!token) {
    throw new Error("Missing device token");
  }

  const { data, error } = await supabase.rpc("get_device_config", { p_token: token });

  if (error) throw error;
  if (!data) throw new Error("No configuration returned");

  // Fetch weather data if city is configured
  let weatherData = null;
  if (data.layout?.weatherCity && data.layout?.showWeather) {
    try {
      const units = data.layout.weatherUnit === 'C' ? 'metric' : 'imperial';
      weatherData = await getWeather(data.layout.weatherCity, units);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
    }
  }

  // Merge weather data into layout
  const layout = {
    ...data.layout,
    ...(weatherData && {
      weatherTemp: weatherData.tempFormatted,
      weatherDescription: weatherData.description,
      weatherIcon: weatherData.iconUrl,
      weatherHumidity: weatherData.humidity,
      weatherWindSpeed: weatherData.windSpeed,
      weatherWindUnit: weatherData.windUnit
    })
  };

  // Return nested structure: { guest: {...}, layout: {...} }
  // This preserves layout_key and backgroundImage under layout object
  return {
    guest: data.guest || null,
    layout: layout,
  };
}

// Backward compatibility alias
export const fetchDeviceConfig = getConfig;
