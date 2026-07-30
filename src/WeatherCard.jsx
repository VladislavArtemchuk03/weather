import { useCallback, useEffect, useMemo, useState } from "react";
import {
  WiCloud,
  WiCloudy,
  WiDayCloudy,
  WiDaySunny,
  WiFog,
  WiNightClear,
  WiRain,
  WiShowers,
  WiSleet,
  WiSnow,
  WiSprinkle,
  WiThunderstorm,
} from "react-icons/wi";

const POLL_INTERVAL_MS = 30_000;

const cityConfig = [
  { key: "lisbon", name: "Lisbon", lat: 38.7223, lon: -9.1393, className: "tile-lisbon", span: "wide" },
  { key: "paris", name: "Paris", lat: 48.8566, lon: 2.3522, className: "tile-paris" },
  { key: "belgrade", name: "Belgrade", lat: 44.7866, lon: 20.4489, className: "tile-belgrade" },
  { key: "venice", name: "Venice", lat: 45.4408, lon: 12.3155, className: "tile-venice" },
  { key: "telaviv", name: "Tel-Aviv", lat: 32.0853, lon: 34.7818, className: "tile-telavive" },
  { key: "cairo", name: "Cairo", lat: 30.0444, lon: 31.2357, className: "tile-cair" },
  { key: "newyork", name: "New-York", lat: 40.7128, lon: -74.006, className: "tile-newyork" },
  { key: "delhi", name: "New-Delhi", lat: 28.6139, lon: 77.209, className: "tile-delhi" },
  {
    key: "sanfrancisco",
    name: "San-Francisco",
    lat: 37.7749,
    lon: -122.4194,
    className: "tile-sanfrancisco",
    span: "wide",
  },
  { key: "tokyo", name: "Tokyo", lat: 35.6762, lon: 139.6503, className: "tile-tokyo" },
  { key: "sydney", name: "Sydney", lat: -33.8688, lon: 151.2093, className: "tile-sydney", span: "full" },
];

function getWeatherIcon(weatherCode, isDay) {
  const dayTime = isDay === 1;

  if (weatherCode === 0) {
    return dayTime ? WiDaySunny : WiNightClear;
  }

  if (weatherCode === 1 || weatherCode === 2) {
    return dayTime ? WiDayCloudy : WiCloudy;
  }

  if (weatherCode === 3) {
    return WiCloudy;
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return WiFog;
  }

  if ([51, 53, 55].includes(weatherCode)) {
    return WiSprinkle;
  }

  if ([56, 57, 66, 67].includes(weatherCode)) {
    return WiSleet;
  }

  if ([61, 63, 65].includes(weatherCode)) {
    return WiRain;
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return WiSnow;
  }

  if ([80, 81, 82].includes(weatherCode)) {
    return WiShowers;
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return WiThunderstorm;
  }

  return WiCloud;
}

function WeatherCard() {
  const [weatherByCity, setWeatherByCity] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeather = useCallback(async () => {
    const nextWeather = {};

    const responses = await Promise.all(
      cityConfig.map(async ({ key, lat, lon }) => {
        const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(`Weather fetch failed for ${key}`);
        }

        const data = await response.json();
        return { key, current: data.current };
      }),
    );

    responses.forEach(({ key, current }) => {
      nextWeather[key] = {
        temp: Math.round(current.temperature_2m),
        weatherCode: current.weather_code,
        isDay: current.is_day,
      };
    });

    setWeatherByCity(nextWeather);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    let isMounted = true;

    const runFetch = async () => {
      try {
        await fetchWeather();
      } catch (error) {
        if (!isMounted) {
          return;
        }

        // Keep previous values if network request fails.
        console.error(error);
      }
    };

    runFetch();
    const intervalId = setInterval(runFetch, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fetchWeather]);

  const renderedCities = useMemo(
    () =>
      cityConfig.map((city) => {
        const current = weatherByCity[city.key];
        const icon = getWeatherIcon(current?.weatherCode, current?.isDay);

        return {
          ...city,
          temp: current?.temp ?? "--",
          icon,
        };
      }),
    [weatherByCity],
  );

  const updatedTime =
    lastUpdated?.toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) ?? "--:--:--";

  return (
    <section className="forecast-board">
      <h1 className="forecast-title">CSS Weather Forecast ☀</h1>

      <div className="forecast-grid">
        {renderedCities.map(({ name, temp, icon: Icon, className, span }) => (
          <article
            key={name}
            className={`forecast-tile ${className} ${span ? `forecast-tile--${span}` : ""}`.trim()}
          >
            <h2>{name}</h2>
            <p>
              <span>{temp}°C</span>
              <Icon className="forecast-icon" />
            </p>
          </article>
        ))}
      </div>

      <p className="forecast-footer">
        Auto refresh every 30s. Last update: {updatedTime}
      </p>
    </section>
  );
}

export default WeatherCard;