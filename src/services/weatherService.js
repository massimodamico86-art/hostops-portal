/**
 * Weather Service - OpenWeatherMap API Integration
 * Fetches current weather data for a given city
 */

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Cache weather data to avoid excessive API calls
const weatherCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Get weather data for a city
 * @param {string} city - City name (e.g., "Miami" or "Miami,US")
 * @param {string} units - Temperature units: 'metric' (Celsius) or 'imperial' (Fahrenheit)
 * @returns {Promise<Object>} Weather data object
 */
export async function getWeather(city, units = 'imperial') {
  if (!city || city.trim() === '') {
    return null;
  }

  // Check if API key is configured
  if (!OPENWEATHER_API_KEY) {
    console.warn('OpenWeatherMap API key not configured. Set VITE_OPENWEATHER_API_KEY in .env file.');
    return getMockWeatherData(city, units);
  }

  // Check cache first
  const cacheKey = `${city}-${units}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${OPENWEATHER_API_KEY}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`City not found: ${city}`);
      } else if (response.status === 401) {
        console.error('Invalid OpenWeatherMap API key');
      } else {
        console.error(`Weather API error: ${response.status}`);
      }
      return getMockWeatherData(city, units);
    }

    const data = await response.json();
    const weatherData = formatWeatherData(data, units);

    // Cache the result
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return getMockWeatherData(city, units);
  }
}

/**
 * Format OpenWeatherMap API response into our data structure
 */
function formatWeatherData(apiData, units) {
  const tempUnit = units === 'metric' ? '°C' : '°F';

  return {
    temp: Math.round(apiData.main.temp),
    tempUnit: tempUnit,
    tempFormatted: `${Math.round(apiData.main.temp)}${tempUnit}`,
    feelsLike: Math.round(apiData.main.feels_like),
    description: capitalizeWords(apiData.weather[0].description),
    main: apiData.weather[0].main,
    icon: apiData.weather[0].icon,
    iconUrl: `https://openweathermap.org/img/wn/${apiData.weather[0].icon}@2x.png`,
    humidity: apiData.main.humidity,
    windSpeed: Math.round(apiData.wind.speed),
    windUnit: units === 'metric' ? 'm/s' : 'mph',
    city: apiData.name,
    country: apiData.sys.country,
    sunrise: new Date(apiData.sys.sunrise * 1000),
    sunset: new Date(apiData.sys.sunset * 1000),
    timestamp: Date.now()
  };
}

/**
 * Get mock weather data (for development or when API key is not configured)
 */
function getMockWeatherData(city, units) {
  const tempUnit = units === 'metric' ? '°C' : '°F';
  const mockTemp = units === 'metric' ? 24 : 75;

  return {
    temp: mockTemp,
    tempUnit: tempUnit,
    tempFormatted: `${mockTemp}${tempUnit}`,
    feelsLike: mockTemp + 2,
    description: 'Partly Cloudy',
    main: 'Clouds',
    icon: '02d',
    iconUrl: 'https://openweathermap.org/img/wn/02d@2x.png',
    humidity: 65,
    windSpeed: units === 'metric' ? 5 : 11,
    windUnit: units === 'metric' ? 'm/s' : 'mph',
    city: city || 'City',
    country: 'US',
    sunrise: new Date(),
    sunset: new Date(),
    timestamp: Date.now(),
    isMock: true
  };
}

/**
 * Capitalize first letter of each word
 */
function capitalizeWords(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Clear weather cache (useful for testing or manual refresh)
 */
export function clearWeatherCache() {
  weatherCache.clear();
}

/**
 * Get weather icon emoji based on condition
 */
export function getWeatherEmoji(iconCode) {
  const iconMap = {
    '01d': '☀️',  // clear sky day
    '01n': '🌙',  // clear sky night
    '02d': '⛅',  // few clouds day
    '02n': '☁️',  // few clouds night
    '03d': '☁️',  // scattered clouds
    '03n': '☁️',  // scattered clouds
    '04d': '☁️',  // broken clouds
    '04n': '☁️',  // broken clouds
    '09d': '🌧️',  // shower rain
    '09n': '🌧️',  // shower rain
    '10d': '🌦️',  // rain day
    '10n': '🌧️',  // rain night
    '11d': '⛈️',  // thunderstorm
    '11n': '⛈️',  // thunderstorm
    '13d': '❄️',  // snow
    '13n': '❄️',  // snow
    '50d': '🌫️',  // mist
    '50n': '🌫️',  // mist
  };

  return iconMap[iconCode] || '🌤️';
}
