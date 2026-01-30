/// <reference types="@types/google.maps" />
import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2, ExternalLink } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAPhS0qB4vSfOE_0Q_VT5CqzQ05VKEUikw';

interface PlacePrediction {
  place_id: string;
  description: string;
}

interface CourseSearchMapProps {
  onLocationSelect: (location: { name: string; address: string; lat: number; lng: number }) => void;
}

// Load Google Maps script dynamically
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

const getGoogleMaps = () => (window as any).google?.maps;

export function CourseSearchMap({ onLocationSelect }: CourseSearchMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
    address: string;
  } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);

  // Initialize Google Maps
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Error loading Google Maps:', error);
      });
  }, []);

  // Initialize map when loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const maps = getGoogleMaps();
    if (!maps) return;

    const map = new maps.Map(mapRef.current, {
      center: { lat: 51.5074, lng: -0.1278 }, // Default: London
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;
    autocompleteServiceRef.current = new maps.places.AutocompleteService();
    placesServiceRef.current = new maps.places.PlacesService(map);
  }, [isLoaded]);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim() || !autocompleteServiceRef.current) return;

    const maps = getGoogleMaps();
    if (!maps) return;

    setIsSearching(true);
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: searchQuery + ' golf course',
        types: ['establishment'],
      },
      (results: any, status: string) => {
        setIsSearching(false);
        if (status === maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results.map((r: any) => ({
            place_id: r.place_id,
            description: r.description,
          })));
        } else {
          setPredictions([]);
        }
      }
    );
  }, [searchQuery]);

  const handleSelectPrediction = useCallback((prediction: PlacePrediction) => {
    if (!placesServiceRef.current) return;

    const maps = getGoogleMaps();
    if (!maps) return;

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'name', 'formatted_address'],
      },
      (place: any, status: string) => {
        if (status === maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const name = place.name || prediction.description.split(',')[0];
          const address = place.formatted_address || prediction.description;

          const location = { lat, lng, name, address };
          setSelectedLocation(location);
          setPredictions([]);
          onLocationSelect(location);

          // Update map
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng });
            mapInstanceRef.current.setZoom(15);

            // Update marker
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }
            markerRef.current = new maps.Marker({
              position: { lat, lng },
              map: mapInstanceRef.current,
              title: name,
            });
          }
        }
      }
    );
  }, [onLocationSelect]);

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search for a golf course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pr-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button onClick={handleSearch} disabled={isSearching || !isLoaded}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Search Results */}
      {predictions.length > 0 && (
        <div className="border rounded-lg divide-y bg-background max-h-48 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-start gap-2"
              onClick={() => handleSelectPrediction(prediction)}
            >
              <MapPin className="w-4 h-4 mt-1 text-primary shrink-0" />
              <span className="text-sm line-clamp-2">{prediction.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Google Map */}
      <div 
        ref={mapRef} 
        className="h-64 rounded-lg overflow-hidden border bg-muted"
      >
        {!isLoaded && (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Selected Location Display */}
      {selectedLocation ? (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{selectedLocation.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{selectedLocation.address}</p>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.lat},${selectedLocation.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center">
          Search for a golf course to select a location
        </p>
      )}
    </div>
  );
}
