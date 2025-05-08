import { Request, Response } from 'express';
import { Client as GoogleMapsClient, TravelMode } from '@googlemaps/google-maps-services-js';
import axios from 'axios';

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

const googleMapsClient = new GoogleMapsClient({});

export const findNearestShelter = async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // First, try to get shelters from GovMap API
    const govmapResponse = await axios.get('https://www.govmap.gov.il/govmap/api/layers', {
      params: {
        layer: 'SHELTER',
        type: 'Point',
        radius: 5000, // 5km radius
        lat: latitude,
        lon: longitude,
        apikey: process.env.GOVMAP_API_KEY
      }
    });

    if (govmapResponse.data.features && govmapResponse.data.features.length > 0) {
      // Sort shelters by distance
      const shelters = govmapResponse.data.features.map((feature: any) => {
        const [lon, lat] = feature.geometry.coordinates;
        const distance = calculateDistance(
          Number(latitude),
          Number(longitude),
          lat,
          lon
        );
        return {
          ...feature.properties,
          location: { lat, lon },
          distance
        };
      }).sort((a: any, b: any) => a.distance - b.distance);

      // Get directions to nearest shelter
      const directions = await googleMapsClient.directions({
        params: {
          origin: `${latitude},${longitude}`,
          destination: `${shelters[0].location.lat},${shelters[0].location.lon}`,
          mode: TravelMode.walking,
          key: process.env.GOOGLE_MAPS_API_KEY || ''
        }
      });

      res.json({
        shelters: shelters.slice(0, 5), // Return top 5 nearest shelters
        directions: directions.data.routes[0]
      });
    } else {
      res.status(404).json({ message: 'No shelters found in your area' });
    }
  } catch (error) {
    console.error('Find nearest shelter error:', error);
    res.status(500).json({ message: 'Error finding nearest shelter' });
  }
};

export const searchSheltersByAddress = async (req: AuthRequest, res: Response) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }

    // First, geocode the address using Google Maps API
    const geocodeResponse = await googleMapsClient.geocode({
      params: {
        address: String(address),
        key: process.env.GOOGLE_MAPS_API_KEY || ''
      }
    });

    if (geocodeResponse.data.results.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const location = geocodeResponse.data.results[0].geometry.location;

    // Then, search for shelters near that location
    const govmapResponse = await axios.get('https://www.govmap.gov.il/govmap/api/layers', {
      params: {
        layer: 'SHELTER',
        type: 'Point',
        radius: 5000, // 5km radius
        lat: location.lat,
        lon: location.lng,
        apikey: process.env.GOVMAP_API_KEY
      }
    });

    if (govmapResponse.data.features && govmapResponse.data.features.length > 0) {
      // Sort shelters by distance
      const shelters = govmapResponse.data.features.map((feature: any) => {
        const [lon, lat] = feature.geometry.coordinates;
        const distance = calculateDistance(
          location.lat,
          location.lng,
          lat,
          lon
        );
        return {
          ...feature.properties,
          location: { lat, lon },
          distance
        };
      }).sort((a: any, b: any) => a.distance - b.distance);

      // Get directions to nearest shelter
      const directions = await googleMapsClient.directions({
        params: {
          origin: `${location.lat},${location.lng}`,
          destination: `${shelters[0].location.lat},${shelters[0].location.lon}`,
          mode: TravelMode.walking,
          key: process.env.GOOGLE_MAPS_API_KEY || ''
        }
      });

      res.json({
        shelters: shelters.slice(0, 5), // Return top 5 nearest shelters
        directions: directions.data.routes[0]
      });
    } else {
      res.status(404).json({ message: 'No shelters found near the specified address' });
    }
  } catch (error) {
    console.error('Search shelters by address error:', error);
    res.status(500).json({ message: 'Error searching for shelters' });
  }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
} 