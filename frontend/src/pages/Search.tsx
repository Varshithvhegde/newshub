import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArticleCard } from "@/components/ArticleCard";
import { SearchFilters } from "@/components/SearchFilters";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Article, SearchParams as APISearchParams, newsAPI, PaginationMetadata } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Search as SearchIcon, Filter, FileText } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function Search() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [sentiments, setSentiments] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Parse URL search params into our search state
  const currentSearchParams: APISearchParams = useMemo(() => ({
    q: searchParams.get('q') || undefined,
    sentiment: searchParams.get('sentiment') || undefined,
    topic: searchParams.get('topic') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '12'),
  }), [searchParams]);

  // Load metadata only once on component mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setMetadataLoading(true);
        const [topicsData, sentimentsData] = await Promise.all([
          newsAPI.getTopics(),
          newsAPI.getSentiments()
        ]);
        
        setTopics(topicsData);
        setSentiments(sentimentsData);
      } catch (err) {
        toast({
          title: "Error loading filters",
          description: "Failed to load filter options",
          variant: "destructive",
        });
      } finally {
        setMetadataLoading(false);
      }
    };

    fetchMetadata();
  }, [toast]);

  // Perform search when search params change
  useEffect(() => {
    const performSearch = async () => {
      // Don't search if metadata is still loading
      if (metadataLoading) {
        return;
      }

      const hasActiveFilters = currentSearchParams.q || currentSearchParams.topic || currentSearchParams.sentiment;

      try {
        setLoading(true);
        
        if (hasActiveFilters) {
          // Use search API for filtered results
          const response = await newsAPI.searchArticles(currentSearchParams);
          setArticles(response.data);
          setPagination(response.pagination);
        } else {
          // Use getAllArticles for pagination when no filters
          const response = await newsAPI.getAllArticles(currentSearchParams.page, currentSearchParams.limit);
          setArticles(response.data);
          setPagination(response.pagination);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Search failed';
        toast({
          title: "Search Error",
          description: errorMessage,
          variant: "destructive",
        });
        setArticles([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [currentSearchParams, metadataLoading, toast]);

  const handleSearchChange = (newParams: APISearchParams) => {
    const params = new URLSearchParams();
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && key !== 'page' && key !== 'limit') {
        params.set(key, value);
      }
    });
    
    // Reset to page 1 when filters change
    params.set('page', '1');
    params.set('limit', currentSearchParams.limit?.toString() || '12');

    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  };

  const handleArticleClick = (article: Article) => {
    navigate(`/article/${article.id}`);
  };

  const hasActiveFilters = currentSearchParams.q || currentSearchParams.topic || currentSearchParams.sentiment;
  const showResults = articles.length > 0 || hasActiveFilters;

  if (metadataLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" text="Loading search..." className="min-h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <SearchIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search News</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover articles by keyword, topic, or sentiment. Use the filters below to find exactly what you're looking for.
          </p>
        </div>

        {/* Search Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="p-6">
            <SearchFilters
              searchParams={currentSearchParams}
              onSearchChange={handleSearchChange}
              topics={topics}
              sentiments={sentiments}
              isLoading={loading}
            />
          </Card>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Searching articles..." />
            </div>
          ) : showResults ? (
            <>
              {/* Results Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {pagination?.totalCount !== undefined ? (
                      `${pagination.totalCount} ${pagination.totalCount === 1 ? 'article' : 'articles'} found`
                    ) : (
                      `${articles?.length || 0} ${(articles?.length || 0) === 1 ? 'article' : 'articles'} found`
                    )}
                  </h2>
                  {pagination && (
                    <span className="text-sm text-gray-500">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                  )}
                </div>
                {hasActiveFilters && (
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                    {currentSearchParams.q && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        "{currentSearchParams.q}"
                      </span>
                    )}
                    {currentSearchParams.topic && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {currentSearchParams.topic}
                      </span>
                    )}
                    {currentSearchParams.sentiment && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {currentSearchParams.sentiment} sentiment
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Articles Grid */}
              {!articles || articles.length === 0 ? (
                <Card className="p-12 text-center">
                  <CardContent>
                    <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
                    <p className="text-gray-600">
                      Try adjusting your search terms or filters to find more articles.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {articles.map((article, index) => (
                    <div 
                      key={article.id}
                      className="opacity-0 animate-fadeIn"
                      style={{ 
                        animationDelay: `${index * 0.05}s`,
                        animationFillMode: 'forwards'
                      }}
                    >
                      <ArticleCard
                        article={article}
                        onClick={() => handleArticleClick(article)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (pagination.hasPrev && pagination.prevPage) {
                              handlePageChange(pagination.prevPage);
                            }
                          }}
                          className={!pagination.hasPrev ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {/* Page Numbers */}
                      {pagination.totalPages && Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                        if (pageNum > pagination.totalPages) return null;
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(pageNum);
                              }}
                              isActive={pageNum === pagination.currentPage}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (pagination.hasNext && pagination.nextPage) {
                              handlePageChange(pagination.nextPage);
                            }
                          }}
                          className={!pagination.hasNext ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            // Initial Welcome State
            <div className="text-center py-16">
              <Card className="max-w-2xl mx-auto p-12">
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <div className="p-3 bg-blue-50 rounded-full">
                      <SearchIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="p-3 bg-green-50 rounded-full">
                      <Filter className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="p-3 bg-purple-50 rounded-full">
                      <FileText className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Start Your Search
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Use the search bar above to find articles by keyword, or explore by topic and sentiment using our filters. 
                    Our search engine will help you discover the most relevant news articles.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-sm">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <SearchIcon className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">Keyword Search</div>
                      <div className="text-gray-600">Find articles by specific terms</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Filter className="w-5 h-5 text-green-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">Topic Filter</div>
                      <div className="text-gray-600">Browse by category</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">Sentiment Analysis</div>
                      <div className="text-gray-600">Filter by article tone</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}