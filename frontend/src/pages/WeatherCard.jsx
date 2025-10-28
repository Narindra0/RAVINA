import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  WbSunny,
  Cloud,
  Thunderstorm,
  WaterDrop,
  WbTwilight,
  Thermostat,
  Opacity,
  Speed,
  WbIncandescent,
  DarkMode, // DarkMode n'était pas utilisé, mais je le garde
} from "@mui/icons-material";

// --- DÉFINITION DES ICÔNES (partagée) ---
const weatherIcons = {
  0: <WbSunny sx={{ fontSize: 60, color: "#FFD54F" }} />, // ciel clair
  1: <WbTwilight sx={{ fontSize: 60, color: "#FFB300" }} />, // ensoleillé partiel
  2: <Cloud sx={{ fontSize: 60, color: "#B0BEC5" }} />, // nuageux
  3: <Cloud sx={{ fontSize: 60, color: "#90A4AE" }} />, // très nuageux
  45: <Cloud sx={{ fontSize: 60, color: "#90A4AE" }} />, // brouillard
  61: <WaterDrop sx={{ fontSize: 60, color: "#4FC3F7" }} />, // pluie
  95: <Thunderstorm sx={{ fontSize: 60, color: "#9575CD" }} />, // orage
  // Ajout de codes manquants (exemple)
  63: <WaterDrop sx={{ fontSize: 60, color: "#29B6F6" }} />, // Pluie modérée
  80: <WaterDrop sx={{ fontSize: 60, color: "#4FC3F7" }} />, // Averses légères
};

// --- Tuile de détail (identique à votre code, réutilisée) ---
const DetailTile = ({ icon, label, value, color }) => (
  <Box
    sx={{
      height: "100%", // Garantit que toutes les tuiles ont la même hauteur
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.1)",
      borderRadius: "12px",
      p: 1.5,
      transition: "transform 0.2s",
      "&:hover": {
        transform: "translateY(-2px)",
        backgroundColor: "rgba(255,255,255,0.2)",
      },
    }}
  >
    {React.cloneElement(icon, { sx: { color: color || "white", fontSize: 24 } })}
    <Box ml={1.5}>
      <Typography variant="caption" sx={{ color: "#B2DFDB", lineHeight: 1 }}>
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.2 }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

// --- 1. Composant : Carte Météo Actuelle ---
// (Votre carte d'origine, refactorisée pour recevoir les props)
function CurrentWeatherCard({ weather, formatDate, formatTime }) {
  return (
    <Card
      sx={{
        background: "linear-gradient(145deg, #4DB6AC, #26A69A)",
        color: "white",
        borderRadius: "24px",
        p: { xs: 2, md: 4 }, // Padding responsive
        border: "1px solid rgba(255,255,255,0.2)",
        height: "100%", // Pour s'aligner avec la carte de prévision
      }}
    >
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        {/* En-tête : Ville, Heure, Icône */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={3}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Antananarivo
            </Typography>
            
            {/* MODIFICATION: Format de date complet */}
            <Typography
              variant="body2"
              sx={{ color: "#B2DFDB", mb: 0.5, textTransform: "capitalize" }}
            >
              {formatDate(weather.observationTime)}
            </Typography>
            <Typography variant="caption" sx={{ color: "#E0F2F1" }}>
              Mise à jour à {formatTime(weather.observationTime)}
            </Typography>
          </Box>
          {/* Utilisation d'une icône par défaut (nuage) si le code est inconnu */}
          {weatherIcons[weather.weathercode] || weatherIcons[2]}
        </Box>

        {/* Température principale */}
        <Typography
          variant="h1"
          sx={{
            fontWeight: 700,
            textAlign: "center",
            mb: 4,
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          {weather.temperature}°C
        </Typography>

        {/* MODIFICATION: Grille des détails (2x2 fixe) */}
        <Grid container spacing={2}>
          <Grid item xs={6} sx={{ height: "90px" }}>
            <DetailTile
              icon={<Thermostat />}
              label="Ressenti"
              value={`${(weather.temperature - 1).toFixed(1)}°C`}
              color="#FFCC80"
            />
          </Grid>
          <Grid item xs={6} sx={{ height: "90px" }}>
            <DetailTile
              icon={<Speed />}
              label="Vent"
              value={`${weather.windspeed} km/h`}
              color="#81D4FA"
            />
          </Grid>
          <Grid item xs={6} sx={{ height: "90px" }}>
            <DetailTile
              icon={<Opacity />}
              label="Pluie (24h)"
              value={`${weather.precipitationSum} mm`}
              color="#90CAF9"
            />
          </Grid>
          <Grid item xs={6} sx={{ height: "90px" }}>
            <DetailTile
              icon={<WbIncandescent />}
              label="Index UV Max"
              value={weather.uv}
              color="#FFEB3B"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// --- 2. Composant : Carte des Prévisions ---
function ForecastCard({ forecast }) {

  // Fonction pour formater le jour de la prévision
  const formatForecastDay = (isoString) => {
    const date = new Date(isoString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Gérer "Demain"
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Demain";
    }
    
    // Retourner le nom du jour (ex: "Mercredi")
    return new Date(isoString).toLocaleDateString("fr-FR", {
      weekday: "long",
    });
  };

  return (
    <Card
      sx={{
        borderRadius: "24px",
        p: { xs: 2, md: 4 },
        backgroundColor: "white", // Fond différent
        height: "100%", // Pour s'aligner avec la carte actuelle
      }}
    >
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#26A69A" }}>
          Prévisions sur 3 jours
        </Typography>
        <List disablePadding>
          {forecast.map((day) => (
            <ListItem key={day.time} disableGutters sx={{alignItems: "center"}}>
              <ListItemIcon sx={{ minWidth: 50 }}>
                {/* Clone de l'icône pour la redimensionner */}
                {React.cloneElement(
                  weatherIcons[day.weathercode] || weatherIcons[2], // Nuage par défaut
                  { sx: { ...weatherIcons[day.weathercode || 2].props.sx, fontSize: 36 } }
                )}
              </ListItemIcon>
              <ListItemText
                primary={formatForecastDay(day.time)}
                primaryTypographyProps={{
                  fontWeight: 600,
                  textTransform: "capitalize",
                  color: "#37474F"
                }}
              />
              <Typography variant="body1" sx={{ fontWeight: 600, color: "#546E7A", minWidth: 80, textAlign: 'right' }}>
                {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
              </Typography>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

// --- 3. Composant Principal (Dashboard) ---
// (Gère l'état, l'API et la mise en page responsive)
export default function WeatherDashboard() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const latitude = -18.8792; // Antananarivo
  const longitude = 47.5079;

  // MODIFICATION: Fonctions de formatage séparées
  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    // Format: "Lundi, 28 mars"
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    // Format: "14:30"
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Récupération des données météo
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // MODIFICATION: Ajout des prévisions journalières à l'URL de l'API
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=uv_index_max,precipitation_sum,weathercode,temperature_2m_max,temperature_2m_min&timezone=Africa/Nairobi&language=fr`
        );
        const data = await res.json();

        // Création de l'objet de prévisions
        const forecastData = data.daily.time
          .slice(1, 4) // Prend les 3 prochains jours (index 1, 2, 3)
          .map((time, index) => {
            const i = index + 1; // index 0 est aujourd'hui, on veut 1, 2, 3
            return {
              time: time,
              weathercode: data.daily.weathercode[i],
              tempMax: data.daily.temperature_2m_max[i],
              tempMin: data.daily.temperature_2m_min[i],
            };
          });

        const info = {
          // Données actuelles
          temperature: data.current_weather.temperature,
          windspeed: data.current_weather.windspeed,
          weathercode: data.current_weather.weathercode,
          observationTime: data.current_weather.time,
          // Données journalières (pour aujourd'hui, index 0)
          uv: data.daily.uv_index_max[0],
          precipitationSum: data.daily.precipitation_sum[0],
          // Données de prévision (jours 1, 2, 3)
          forecast: forecastData,
        };
        setWeather(info);
      } catch (err) {
        console.error("Erreur météo :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  // --- RENDU : Chargement / Erreur ---
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress sx={{ color: "#26A69A" }} />
      </Box>
    );
  }

  if (!weather) {
    return (
      <Typography color="error" sx={{ textAlign: "center", mt: 4 }}>
        Impossible de charger la météo
      </Typography>
    );
  }

  // --- RENDU : Dashboard Météo (Responsive) ---
  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 }}}>
      <Grid container spacing={3}>
        {/* Colonne de gauche: Météo actuelle */}
        <Grid item xs={12} lg={7}>
          <CurrentWeatherCard
            weather={weather}
            formatDate={formatDate}
            formatTime={formatTime}
          />
        </Grid>

        {/* Colonne de droite: Prévisions */}
        <Grid item xs={12} lg={5}>
          <ForecastCard forecast={weather.forecast} />
        </Grid>
      </Grid>
    </Box>
  );
}