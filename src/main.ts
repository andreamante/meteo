interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
}

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

const form = document.getElementById('search-form') as HTMLFormElement;
const cityInput = document.getElementById('city-input') as HTMLInputElement;
const statusMessage = document.getElementById('status-message') as HTMLElement;
const weatherCard = document.getElementById('weather-card') as HTMLElement;

const cityName = document.getElementById('city-name') as HTMLElement;
const currentIcon = document.getElementById('current-icon') as HTMLElement;
const currentTemp = document.getElementById('current-temp') as HTMLElement;
const weatherDesc = document.getElementById('weather-desc') as HTMLElement;
const apparentTemp = document.getElementById('apparent-temp') as HTMLElement;
const humidity = document.getElementById('humidity') as HTMLElement;
const windSpeed = document.getElementById('wind-speed') as HTMLElement;
const forecastGrid = document.getElementById('forecast-grid') as HTMLElement;

function getWeatherDetails(code: number): { desc: string; icon: string } {
  switch (code) {
    case 0:
      return { desc: 'Sereno', icon: '☀️' };
    case 1:
    case 2:
      return { desc: 'Poco nuvoloso', icon: '🌤️' };
    case 3:
      return { desc: 'Coperto', icon: '☁️' };
    case 45:
    case 48:
      return { desc: 'Nebbia', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
      return { desc: 'Pioggia', icon: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { desc: 'Neve', icon: '❄️' };
    case 80:
    case 81:
    case 82:
      return { desc: 'Rovesci di pioggia', icon: '🌦️' };
    case 95:
    case 96:
    case 99:
      return { desc: 'Temporale', icon: '🌩️' };
    default:
      return { desc: 'Variabile', icon: '🌡️' };
  }
}

async function searchCity(query: string): Promise<GeoResult | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=it&format=json`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    return null;
  }
  
  return data.results[0];
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
  const response = await fetch(url);
  return await response.json();
}

function renderWeather(city: string, data: WeatherData) {
  const { current, daily } = data;
  const currentDetails = getWeatherDetails(current.weather_code);

  cityName.textContent = city;
  currentIcon.textContent = currentDetails.icon;
  currentTemp.textContent = `${Math.round(current.temperature_2m)}°C`;
  weatherDesc.textContent = currentDetails.desc;
  apparentTemp.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidity.textContent = `${current.relative_humidity_2m}%`;
  windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;

  forecastGrid.innerHTML = '';
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(daily.time[i]);
    const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' });
    const dayDetails = getWeatherDetails(daily.weather_code[i]);
    const maxTemp = Math.round(daily.temperature_2m_max[i]);
    const minTemp = Math.round(daily.temperature_2m_min[i]);

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="forecast-day">${dayName}</div>
      <div class="forecast-icon">${dayDetails.icon}</div>
      <div class="forecast-temp">${maxTemp}° / ${minTemp}°</div>
    `;
    forecastGrid.appendChild(card);
  }

  weatherCard.classList.remove('hidden');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  
  if (!city) return;

  statusMessage.textContent = 'Caricamento...';
  weatherCard.classList.add('hidden');

  try {
    const location = await searchCity(city);
    
    if (!location) {
      statusMessage.textContent = 'Città non trovata. Riprova.';
      return;
    }

    const weather = await fetchWeather(location.latitude, location.longitude);
    const displayName = location.country ? `${location.name}, ${location.country}` : location.name;
    
    renderWeather(displayName, weather);
    statusMessage.textContent = '';
  } catch (error) {
    console.error(error);
    statusMessage.textContent = 'Errore durante il recupero dei dati meteo.';
  }
});