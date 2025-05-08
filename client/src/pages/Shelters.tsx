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
  Divider
} from '@mui/material';
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer
} from '@react-google-maps/api';
import { toast } from 'react-toastify';
import axios from 'axios';

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
    <Box sx={{ height: '100%', display: 'flex', gap: 2 }}>
      <Paper sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom align="right">
          חיפוש מקלטים
        </Typography>
        <Box component="form" onSubmit={handleSearchByAddress} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="הזן כתובת"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            sx={{ mb: 2 }}
            dir="rtl"
          />
          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={isLoading || !address.trim()}
            sx={{ mb: 1 }}
          >
            חפש לפי כתובת
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleFindNearestShelter}
            disabled={isLoading}
          >
            מצא מקלטים קרובים למיקומי
          </Button>
        </Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {shelters.map((shelter, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={shelter.name || 'מקלט'}
                    secondary={`מרחק: ${shelter.distance.toFixed(2)} ק"מ${
                      shelter.address ? `\nכתובת: ${shelter.address}` : ''
                    }`}
                    sx={{ textAlign: 'right' }}
                  />
                </ListItem>
                {index < shelters.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      <Paper sx={{ flex: 2 }}>
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={13}
          >
            {userLocation && (
              <Marker
                position={{ lat: userLocation.lat, lng: userLocation.lon }}
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                }}
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
                    travelMode: google.maps.TravelMode.DRIVING
                  }
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>
      </Paper>
    </Box>
  );
};

export default Shelters; 