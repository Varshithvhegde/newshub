import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, RefreshCw } from "lucide-react";
import { SearchParams } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchFiltersProps {
  searchParams: SearchParams;
  onSearchChange: (params: SearchParams) => void;
  topics: string[];
  sentiments: string[];
  isLoading?: boolean;
}

export const SearchFilters = ({ 
  searchParams, 
  onSearchChange, 
  topics, 
  sentiments,
  isLoading 
}: SearchFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState(searchParams.q || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Update search params when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchParams.q) {
      onSearchChange({ ...searchParams, q: debouncedSearchQuery || undefined });
    }
  }, [debouncedSearchQuery]);

  // Update local state when searchParams.q changes from external source
  useEffect(() => {
    const newQuery = searchParams.q || '';
    if (newQuery !== searchQuery) {
      setSearchQuery(newQuery);
    }
  }, [searchParams.q]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the debounced onChange
  };

  const clearFilters = () => {
    setSearchQuery('');
    // Clear all filters by passing an empty object with only pagination preserved
    onSearchChange({
      page: 1,
      limit: searchParams.limit || 12
    });
  };

  const hasActiveFilters = Boolean(
    searchParams.q || searchParams.sentiment || searchParams.topic
  );

  // Helper function to handle select changes
  const handleSelectChange = (field: 'sentiment' | 'topic', value: string) => {
    const newParams = { ...searchParams };
    
    if (value === "all" || !value) {
      // Remove the field if "all" is selected
      delete newParams[field];
    } else {
      // Set the new value
      newParams[field] = value;
    }
    
    // Reset to page 1 when filters change
    newParams.page = 1;
    
    onSearchChange(newParams);
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search for news articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 h-14 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
            disabled={isLoading}
          />
          {isLoading && (
            <RefreshCw className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
          )}
        </div>
      </form>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
          <Filter className="w-4 h-4" />
          <span>Filter by:</span>
        </div>

        {/* Topic Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Topic</label>
          <Select
            value={searchParams.topic || "all"}
            onValueChange={(value) => handleSelectChange('topic', value)}
          >
            <SelectTrigger className="w-48 h-10 border-gray-200 focus:border-blue-500">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.filter(Boolean).map((topic) => (
                <SelectItem key={topic} value={topic}>
                  <span className="capitalize">{topic}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sentiment Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Sentiment</label>
          <Select
            value={searchParams.sentiment || "all"}
            onValueChange={(value) => handleSelectChange('sentiment', value)}
          >
            <SelectTrigger className="w-40 h-10 border-gray-200 focus:border-blue-500">
              <SelectValue placeholder="All Sentiments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              {sentiments.filter(Boolean).map((sentiment) => (
                <SelectItem key={sentiment} value={sentiment}>
                  <span className="capitalize">{sentiment}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex flex-col gap-1">
            <div className="h-4"></div> {/* Spacer to align with other filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-10 text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <span className="text-sm text-gray-500 font-medium">Active filters:</span>
          {searchParams.q && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              <Search className="w-3 h-3" />
              "{searchParams.q}"
              <button
                aria-label="Clear search"
                onClick={() => {
                  setSearchQuery('');
                  onSearchChange({ ...searchParams, q: undefined });
                }}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchParams.topic && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              <Filter className="w-3 h-3" />
              {searchParams.topic}
              <button
                aria-label="Clear topic"
                onClick={() => handleSelectChange('topic', 'all')}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchParams.sentiment && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
              <Filter className="w-3 h-3" />
              {searchParams.sentiment} sentiment
              <button
                aria-label="Clear sentiment"
                onClick={() => handleSelectChange('sentiment', 'all')}
                className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};