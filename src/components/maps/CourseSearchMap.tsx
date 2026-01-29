import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
}

interface CourseSearchMapProps {
  onLocationSelect: (location: { name: string; address: string; lat: number; lng: number }) => void;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

export function CourseSearchMap({ onLocationSelect }: CourseSearchMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
    address: string;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Search for golf courses using Nominatim (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' golf course')}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const name = result.name || result.display_name.split(',')[0];
    
    setSelectedLocation({
      lat,
      lng,
      name,
      address: result.display_name,
    });
    setMapCenter([lat, lng]);
    setSearchResults([]);
    
    onLocationSelect({
      name,
      address: result.display_name,
      lat,
      lng,
    });
  };

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      // Reverse geocode to get address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      
      const name = data.name || data.address?.leisure || 'Selected Location';
      const address = data.display_name;
      
      setSelectedLocation({ lat, lng, name, address });
      onLocationSelect({ name, address, lat, lng });
    } catch (error) {
      console.error('Reverse geocode failed:', error);
      setSelectedLocation({
        lat,
        lng,
        name: 'Selected Location',
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    }
  };

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
        <Button onClick={handleSearch} disabled={isSearching}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="border rounded-lg divide-y bg-background">
          {searchResults.map((result, index) => (
            <button
              key={index}
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-start gap-2"
              onClick={() => handleResultSelect(result)}
            >
              <MapPin className="w-4 h-4 mt-1 text-primary shrink-0" />
              <span className="text-sm line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="h-64 rounded-lg overflow-hidden border">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null} />
          <MapClickHandler onLocationSelect={handleMapClick} />
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
              <Popup>
                <div className="text-sm">
                  <strong>{selectedLocation.name}</strong>
                  <p className="text-muted-foreground">{selectedLocation.address}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-primary" />
            <div>
              <p className="font-medium text-sm">{selectedLocation.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{selectedLocation.address}</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Search for a golf course or click on the map to select a location
      </p>
    </div>
  );
}
