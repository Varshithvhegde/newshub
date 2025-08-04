import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import { PersonalizedSearchParams, newsAPI } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";

interface PersonalizedSearchFiltersProps {
  onSearchChange: (params: PersonalizedSearchParams) => void;
  placeholder?: string;
}

export const PersonalizedSearchFilters = ({ 
  onSearchChange, 
  placeholder = "Search your personalized feed..." 
}: PersonalizedSearchFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentiment, setSentiment] = useState('all');
  const [source, setSource] = useState('all');
  const [sources, setSources] = useState<string[]>([]);
  const [sentiments, setSentiments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Load filter options only once
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [sourcesResponse, sentimentsResponse] = await Promise.all([
          newsAPI.getSources(),
          newsAPI.getSentiments()
        ]);
        
        // Handle different API response formats
        const sourcesData = Array.isArray(sourcesResponse) ? sourcesResponse : 
                           ((sourcesResponse as any)?.data && Array.isArray((sourcesResponse as any).data)) ? (sourcesResponse as any).data : [];
        
        const sentimentsData = Array.isArray(sentimentsResponse) ? sentimentsResponse : 
                              ((sentimentsResponse as any)?.data && Array.isArray((sentimentsResponse as any).data)) ? (sentimentsResponse as any).data : [];
        
        setSources(sourcesData);
        setSentiments(sentimentsData);
      } catch (error) {
        console.error('Failed to load filter options:', error);
        // Set empty arrays as fallback
        setSources([]);
        setSentiments([]);
      } finally {
        setLoading(false);
      }
    };

    loadFilterOptions();
  }, []);

  // Memoize search parameters to prevent unnecessary re-renders
  const searchParams = useMemo((): PersonalizedSearchParams => {
    const params: PersonalizedSearchParams = {
      page: 1,
      limit: 12
    };

    if (debouncedSearchQuery.trim()) {
      params.q = debouncedSearchQuery.trim();
    }

    if (sentiment !== 'all') {
      params.sentiment = sentiment;
    }

    if (source !== 'all') {
      params.source = source;
    }

    return params;
  }, [debouncedSearchQuery, sentiment, source]);

  // Only call onSearchChange when searchParams actually change
  useEffect(() => {
    onSearchChange(searchParams);
  }, [searchParams, onSearchChange]);

  const clearFilters = () => {
    setSearchQuery('');
    setSentiment('all');
    setSource('all');
  };

  const hasActiveFilters = Boolean(
    searchQuery || sentiment !== 'all' || source !== 'all'
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 h-12 text-base"
          disabled={loading}
        />
      </div>

      {/* <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        <Select value={sentiment} onValueChange={setSentiment} disabled={loading}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sentiments</SelectItem>
            {Array.isArray(sentiments) && sentiments.map((sentimentOption) => (
              <SelectItem key={sentimentOption} value={sentimentOption}>
                <span className="capitalize">{sentimentOption}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={source} onValueChange={setSource} disabled={loading}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {Array.isArray(sources) && sources.map((sourceOption) => (
              <SelectItem key={sourceOption} value={sourceOption}>
                {sourceOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
            disabled={loading}
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div> */}
    </div>
  );
};