import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2, ExternalLink } from 'lucide-react';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
}

interface CourseSearchMapProps {
  onLocationSelect: (location: { name: string; address: string; lat: number; lng: number }) => void;
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
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
    
    const location = {
      lat,
      lng,
      name,
      address: result.display_name,
    };
    
    setSelectedLocation(location);
    setSearchResults([]);
    onLocationSelect(location);
  };

  // Generate OpenStreetMap embed URL
  const getMapEmbedUrl = () => {
    if (selectedLocation) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${selectedLocation.lng - 0.02}%2C${selectedLocation.lat - 0.01}%2C${selectedLocation.lng + 0.02}%2C${selectedLocation.lat + 0.01}&layer=mapnik&marker=${selectedLocation.lat}%2C${selectedLocation.lng}`;
    }
    // Default view (London area)
    return 'https://www.openstreetmap.org/export/embed.html?bbox=-0.1278%2C51.5%2C-0.0778%2C51.52&layer=mapnik';
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
        <div className="border rounded-lg divide-y bg-background max-h-48 overflow-y-auto">
          {searchResults.map((result, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-start gap-2"
              onClick={() => handleResultSelect(result)}
            >
              <MapPin className="w-4 h-4 mt-1 text-primary shrink-0" />
              <span className="text-sm line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map Embed */}
      <div className="h-64 rounded-lg overflow-hidden border bg-muted">
        <iframe
          title="Golf Course Location"
          src={getMapEmbedUrl()}
          className="w-full h-full border-0"
          loading="lazy"
        />
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
              href={`https://www.openstreetmap.org/?mlat=${selectedLocation.lat}&mlon=${selectedLocation.lng}#map=15/${selectedLocation.lat}/${selectedLocation.lng}`}
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
