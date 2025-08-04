import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArticleCard } from "@/components/ArticleCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Article, newsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Newspaper, Clock } from "lucide-react";

const ARTICLES_PER_PAGE = 12;

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [topics, setTopics] = useState<(string | { id: string; name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const observerTarget = useRef<HTMLDivElement>(null);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [articlesData, topicsData] = await Promise.all([
          newsAPI.getAllArticles(1, ARTICLES_PER_PAGE),
          newsAPI.getTopics()
        ]);
        
        setArticles(articlesData.data);
        setTopics(topicsData.slice(0, 8));
        setHasMore(articlesData.data.length === ARTICLES_PER_PAGE);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load articles';
        setError(errorMessage);
        toast({
          title: "Error loading articles",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [toast]);

  // Load more articles function
  const loadMoreArticles = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      
      const articlesData = await newsAPI.getAllArticles(nextPage, ARTICLES_PER_PAGE);
      
      if (articlesData.data.length === 0) {
        setHasMore(false);
      } else {
        setArticles(prev => [...prev, ...articlesData.data]);
        setPage(nextPage);
        setHasMore(articlesData.data.length === ARTICLES_PER_PAGE);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more articles';
      toast({
        title: "Error loading more articles",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, toast]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loadingMore) {
          loadMoreArticles();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMoreArticles, hasMore, loadingMore]);

  const handleArticleClick = (article: Article) => {
    navigate(`/article/${article.id}`);
  };

  const handleTopicClick = (topic: string) => {
    navigate(`/search?topic=${encodeURIComponent(topic)}`);
  };

  const handleRetry = () => {
    setError(null);
    setPage(1);
    setHasMore(true);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" text="Loading news..." className="min-h-[400px]" />
        </div>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRetry}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Categories Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/search')}
              className="text-gray-600 hover:text-gray-900"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => {
              const topicName = typeof topic === 'string' ? topic : topic.name;
              const topicKey = typeof topic === 'string' ? topic : topic.id;
              
              return (
                <Badge
                  key={topicKey}
                  variant="secondary"
                  className="cursor-pointer hover:bg-gray-200 transition-colors text-sm py-2 px-4 bg-gray-100 text-gray-700 border-0"
                  onClick={() => handleTopicClick(topicName)}
                >
                  {topicName}
                </Badge>
              );
            })}
          </div>
        </section>

        {/* Latest News Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Latest News</h2>
            </div>
            <span className="text-sm text-gray-500">
              {articles.length} articles
            </span>
          </div>
          
          {articles.length === 0 ? (
            <Card className="p-12 text-center">
              <CardContent>
                <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No articles available at the moment.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={handleRetry}
                >
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {articles.map((article, index) => (
                  <div 
                    key={article.id} 
                    className="opacity-0 animate-fade-in"
                    style={{ 
                      animationDelay: `${(index % ARTICLES_PER_PAGE) * 0.05}s`,
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

              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="mt-8 flex justify-center">
                  <LoadingSpinner size="md" text="Loading more articles..." />
                </div>
              )}

              {/* Intersection Observer Target */}
              {hasMore && !loadingMore && (
                <div 
                  ref={observerTarget} 
                  className="h-10 mt-8 flex items-center justify-center"
                >
                  <div className="text-sm text-gray-400">
                    Scroll for more articles...
                  </div>
                </div>
              )}

              {/* End of Content Message */}
              {!hasMore && articles.length > ARTICLES_PER_PAGE && (
                <div className="mt-12 text-center">
                  <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
                    <div className="h-px bg-gray-300 flex-1 w-20"></div>
                    <span>You've reached the end ({articles.length} articles)</span>
                    <div className="h-px bg-gray-300 flex-1 w-20"></div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="mt-4 text-gray-600"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    Back to Top
                  </Button>
                </div>
              )}

              {/* Load More Button (fallback) */}
              {hasMore && !loadingMore && (
                <div className="mt-8 text-center">
                  <Button 
                    variant="outline" 
                    onClick={loadMoreArticles}
                    disabled={loadingMore}
                    className="min-w-32"
                  >
                    {loadingMore ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}