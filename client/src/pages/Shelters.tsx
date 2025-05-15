import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Slider,
  InputAdornment
} from '@mui/material';
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer
} from '@react-google-maps/api';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Search, LocationOn } from '@mui/icons-material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

interface Location {
  lat: number;
  lon: number;
}

interface Shelter {
  name: string;
  location: Location;
  distance: number;
  address?: string;
}

interface DirectionsResult {
  routes: google.maps.DirectionsRoute[];
}

const Shelters: React.FC = () => {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [radius, setRadius] = useState(0);

  const handleFindNearestShelter = () => {
    if ('geolocation' in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setUserLocation(location);
          await searchShelters(location);
        },
        (error) => {
          toast.error('לא ניתן לאתר את מיקומך. אנא נסה להזין כתובת.');
          setIsLoading(false);
        }
      );
    } else {
      toast.error('הדפדפן שלך אינו תומך באיתור מיקום.');
    }
  };

  const handleSearchByAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/shelter/search`, {
        params: { address }
      });
      setShelters(response.data.shelters);
      setDirections(response.data.directions);
    } catch (error) {
      toast.error('שגיאה בחיפוש מקלטים');
    } finally {
      setIsLoading(false);
    }
  };

  const searchShelters = async (location: Location) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/shelter/nearest`, {
        params: location
      });
      setShelters(response.data.shelters);
      setDirections(response.data.directions);
    } catch (error) {
      toast.error('שגיאה בחיפוש מקלטים');
    } finally {
      setIsLoading(false);
    }
  };

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const center = userLocation
    ? { lat: userLocation.lat, lng: userLocation.lon }
    : { lat: 31.7767, lng: 35.2345 }; // Default to Jerusalem

  return (
    <Box
      sx={{
        width: '100%',
        mx: 'auto',
        px: { xs: 1, md: 4 },
        pt: 4,
        boxSizing: 'border-box',
      }}
    >
      {/* חיפוש ותוצאות בשורה אחת בדסקטופ */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          width: '100%',
          mb: 3,
        }}
      >
        {/* חיפוש מקלטים */}
        <Paper
          sx={{
            width: { xs: '100%', md: 350 },
            flexShrink: 0,
            p: 2,
            boxSizing: 'border-box',
            mb: { xs: 2, md: 0 },
          }}
        >
          <Typography variant="h6" color="primary" fontWeight="bold" gutterBottom>
            חיפוש מקלטים
          </Typography>
          <form onSubmit={handleSearchByAddress} style={{ marginBottom: 16 }}>
            <TextField
              fullWidth
              label="חיפוש לפי כתובת"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              inputProps={{ style: { textAlign: 'right' }, placeholder: 'לדוגמה: הרצל 10, תל אביב' }}
              dir="rtl"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              type="submit"
              sx={{ mb: 1, borderRadius: 8, backgroundColor: '#8b5cf6', '&:hover': { backgroundColor: '#7c3aed' }, gap: 1 }}
              startIcon={<Search />}
              disabled={isLoading || !address.trim()}
            >
              חפש כתובת
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              sx={{ borderRadius: 8, borderColor: '#8b5cf6', color: '#8b5cf6', '&:hover': { borderColor: '#7c3aed', color: '#7c3aed' }, gap: 1 }}
              startIcon={<LocationOn />}
              onClick={handleFindNearestShelter}
              disabled={isLoading}
            >
              מיקום נוכחי
            </Button>
          </form>
          {/* סרגל מרחק */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">טווח מרחק (מטרים):</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <Typography variant="caption" sx={{ minWidth: 32, textAlign: 'center', color: 'text.secondary' }}>0</Typography>
              <Slider
                value={radius}
                min={0}
                max={3000}
                step={100}
                onChange={(_, val) => typeof val === 'number' && setRadius(val)}
                valueLabelDisplay="auto"
                sx={{ color: '#8b5cf6', maxWidth: 250, width: '100%', mx: 2 }}
              />
              <Typography variant="caption" sx={{ minWidth: 32, textAlign: 'center', color: 'text.secondary' }}>3000</Typography>
            </Box>
          </Box>
        </Paper>
        {/* תוצאות חיפוש */}
        <Paper
          sx={{
            flex: 1,
            minWidth: 0,
            p: 2,
            boxSizing: 'border-box',
            mb: { xs: 2, md: 0 },
            width: { xs: '100%', md: 'auto' },
          }}
        >
          <Typography variant="h6" color="primary" fontWeight="bold" gutterBottom>
            תוצאות חיפוש
          </Typography>
          {shelters.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: 'grey.400' }}>
              <SearchOutlinedIcon sx={{ fontSize: 60, mb: 1, color: '#c4aafe' }} />
              {/* אפשר להוסיף כיתוב קצר אם תרצה: */}
              {/* <Typography variant="body2" color="text.secondary">לא נמצאו תוצאות</Typography> */}
            </Box>
          ) : (
            <List>
              {shelters.map((shelter, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={shelter.name || 'מקלט'}
                      secondary={`מרחק: ${shelter.distance.toFixed(2)} ק"מ${shelter.address ? `\nכתובת: ${shelter.address}` : ''}`}
                      sx={{ textAlign: 'right' }}
                    />
                  </ListItem>
                  {index < shelters.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Box>

      {/* מפה בתחתית */}
      <Box
        sx={{
          width: '100%',
          height: { xs: 300, md: 450 },
          backgroundColor: 'background.paper',
          borderRadius: 3,
          boxShadow: 1,
          overflow: 'hidden',
        }}
      >
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={center}
            zoom={13}
          >
            {userLocation && (
              <Marker
                position={{ lat: userLocation.lat, lng: userLocation.lon }}
                icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
              />
            )}
            {shelters.map((shelter, index) => (
              <Marker
                key={index}
                position={{ lat: shelter.location.lat, lng: shelter.location.lon }}
              />
            ))}
            {directions && (
              <DirectionsRenderer
                directions={{
                  ...directions,
                  request: {
                    origin: directions.routes[0].legs[0].start_location,
                    destination: directions.routes[0].legs[0].end_location,
                    travelMode: google.maps.TravelMode.DRIVING,
                  },
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>
      </Box>
    </Box>
  );
};

export default Shelters; 