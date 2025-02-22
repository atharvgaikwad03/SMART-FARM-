// DOM Elements
const cityInput = document.getElementById("city_input");
const searchBtn = document.getElementById("searchBtn");
const apiKey = "64c1974c07a8134686d332f7cd1d81fa";

// Elements for data display
const currentWeatherCard = document.querySelector(".weather-left .card");
const forecastCard = document.querySelectorAll(".weather-left .card")[1];
const airQualityCard = document.querySelector(".highlights .card:nth-of-type(1)");
const sunriseSunsetCard = document.querySelector(".highlights .card:nth-of-type(2)");
const humidityCard = document.querySelector(".highlights .card:nth-of-type(3)");
const pressureCard = document.querySelector(".highlights .card:nth-of-type(4)");
const visibilityCard = document.querySelector(".highlights .card:nth-of-type(5)");
const windSpeedCard = document.querySelector(".highlights .card:nth-of-type(6)");
const feelsLikeCard = document.querySelector(".highlights .card:nth-of-type(7)");

// Fetch weather data and populate the UI
function getWeatherDetails(cityName, lat, lon, country) {
  const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const FORECAST_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const AIR_QUALITY_API_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

  // Current Weather
  fetch(WEATHER_API_URL)
    .then(response => response.json())
    .then(data => {
      // Current weather data
      const date = new Date();
      const sunrise = new Date(data.sys.sunrise * 1000);
      const sunset = new Date(data.sys.sunset * 1000);

      // Update current weather card
      currentWeatherCard.innerHTML = `
        <div class="current-weather">
          <div class="details">
            <p>Now</p>
            <h2>${data.main.temp.toFixed(1)}&deg;C</h2>
            <p>${data.weather[0].description}</p>
          </div>
          <div class="weather-icon">
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather icon" />
          </div>
        </div>
        <hr>
        <div class="card-footer">
          <p><i class="fa-light fa-calendar"></i> ${date.toDateString()}</p>
          <p><i class="fa-light fa-location-dot"></i> ${cityName}, ${country}</p>
        </div>
      `;

      // Update highlights: Sunrise, Sunset, Humidity, Pressure, etc.
      sunriseSunsetCard.innerHTML = `
        <div class="card-head">
          <p>Sunrise and Sunset</p>
        </div>
        <div class="sunrise-sunset">
          <div class="item">
            <p>Sunrise</p>
            <h2>${sunrise.getHours()}:${String(sunrise.getMinutes()).padStart(2, "0")} AM</h2>
          </div>
          <div class="item">
            <p>Sunset</p>
            <h2>${sunset.getHours()}:${String(sunset.getMinutes()).padStart(2, "0")} PM</h2>
          </div>
        </div>
      `;
      humidityCard.querySelector("h2").textContent = `${data.main.humidity}%`;
      pressureCard.querySelector("h2").textContent = `${data.main.pressure} hPa`;
      visibilityCard.querySelector("h2").textContent = `${(data.visibility / 1000).toFixed(1)} km`;
      windSpeedCard.querySelector("h2").textContent = `${data.wind.speed.toFixed(1)} m/s`;
      feelsLikeCard.querySelector("h2").textContent = `${data.main.feels_like.toFixed(1)}°C`;
    })
    .catch(error => console.error("Error fetching current weather:", error));

  // 5-Day Forecast
  fetch(FORECAST_API_URL)
    .then(response => response.json())
    .then(data => {
      const forecastItems = data.list.filter((_, idx) => idx % 8 === 0).slice(0, 5); // Filter for 5 days
      let forecastHTML = `<h2>5 Day Forecast</h2><div class="day-forecast">`;

      forecastItems.forEach(item => {
        const forecastDate = new Date(item.dt * 1000);
        forecastHTML += `
          <div class="forecast-item">
            <div class="icon-wrapper">
              <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Weather icon" />
              <span>${item.main.temp.toFixed(1)}&deg;C</span>
            </div>
            <p>${forecastDate.toLocaleDateString("en-US", { weekday: "long" })}</p>
            <p>${forecastDate.toLocaleDateString("en-US")}</p>
          </div>
        `;
      });

      forecastHTML += `</div>`;
      forecastCard.innerHTML = forecastHTML;
    })
    .catch(error => console.error("Error fetching forecast:", error));

  // Air Quality Index
  fetch(AIR_QUALITY_API_URL)
    .then(response => response.json())
    .then(data => {
      const components = data.list[0].components;
      airQualityCard.innerHTML = `
        <div class="card-head">
          <p>Air Quality Index</p>
          <p class="air-index aqi-${data.list[0].main.aqi}">${getAQILevel(data.list[0].main.aqi)}</p>
        </div>
        <div class="air-indices">
          <div class="item"><p>PM2.5</p><h2>${components.pm2_5.toFixed(1)}</h2></div>
          <div class="item"><p>PM10</p><h2>${components.pm10.toFixed(1)}</h2></div>
          <div class="item"><p>SO2</p><h2>${components.so2.toFixed(1)}</h2></div>
          <div class="item"><p>NO</p><h2>${components.no.toFixed(1)}</h2></div>
          <div class="item"><p>NO2</p><h2>${components.no2.toFixed(1)}</h2></div>
          <div class="item"><p>O3</p><h2>${components.o3.toFixed(1)}</h2></div>
          <div class="item"><p>CO</p><h2>${components.co.toFixed(1)}</h2></div>
        </div>
      `;
    })
    .catch(error => console.error("Error fetching air quality:", error));
}

// Determine AQI Level
function getAQILevel(aqi) {
  switch (aqi) {
    case 1: return "Good";
    case 2: return "Fair";
    case 3: return "Moderate";
    case 4: return "Poor";
    case 5: return "Very Poor";
    default: return "Unknown";
  }
}

// Fetch city coordinates
function getCityCoordinates() {
  const cityName = cityInput.value.trim();
  if (!cityName) {
    alert("Please enter a city name.");
    return;
  }

  const GEO_API_URL = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;

  fetch(GEO_API_URL)
    .then(response => response.json())
    .then(data => {
      const { name, coord: { lat, lon }, sys: { country } } = data;
      getWeatherDetails(name, lat, lon, country);
    })
    .catch(error => {
      console.error("Error fetching city coordinates:", error);
      alert(`Failed to fetch coordinates for "${cityName}". Please check the city name.`);
    });
}

// Event Listener
searchBtn.addEventListener("click", getCityCoordinates);
