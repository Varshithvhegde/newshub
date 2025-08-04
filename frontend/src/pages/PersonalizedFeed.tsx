import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ArticleCard } from "@/components/ArticleCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PreferenceSetup } from "@/components/PreferenceSetup";
import { PersonalizedSearchFilters } from "@/components/PersonalizedSearchFilters";
import { newsAPI, Article, PersonalizedSearchParams } from "@/lib/api";
import { UserManager, UserPreferences } from "@/lib/userManager";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Heart, Settings, RefreshCw, AlertCircle } from "lucide-react";

const PersonalizedFeed = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [searchParams, setSearchParams] = useState<PersonalizedSearchParams>({});
  const [showPreferenceDialog, setShowPreferenceDialog] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    initializeUser();
  }, []);

  // Memoize the loadPersonalizedNews function to prevent unnecessary re-renders
  const loadPersonalizedNews = useCallback(async (page: number = 1, reset: boolean = false) => {
    if (!userId || !preferences) return;

    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      let response;
      if ((searchParams.q && searchParams.q.length > 0) || (searchParams.sentiment && searchParams.sentiment.length > 0) || (searchParams.source && searchParams.source.length > 0)) {
        response = await newsAPI.searchPersonalizedNews(userId, { ...searchParams, page, limit: 12 });
      } else {
        response = await newsAPI.getPersonalizedNews(userId, page, 12);
      }

      if (reset || page === 1) {
        setArticles(response.data);
      } else {
        setArticles(prev => [...prev, ...response.data]);
      }

      setCurrentPage(page);
      setHasNextPage(response.pagination.hasNext);
    } catch (error) {
      console.error('Failed to load personalized news:', error);
      toast({
        title: "Error",
        description: "Failed to load personalized news. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, preferences, searchParams]);

  // Only trigger API call when userId and preferences are both available
  useEffect(() => {
    if (userId && preferences && !isFirstTime) {
      loadPersonalizedNews(1, true);
    }
  }, [userId, preferences, loadPersonalizedNews, isFirstTime]);

  const initializeUser = async () => {
    try {
      const userIdValue = await UserManager.getUserId();
      setUserId(userIdValue);
      
      // Check if user has preferences
      const storedPreferences = UserManager.getUserPreferences();
      if (storedPreferences && storedPreferences.topics.length > 0) {
        setPreferences(storedPreferences);
        setIsFirstTime(false);
      } else {
        // Try to load from server
        const serverPreferences = await UserManager.loadPreferencesFromServer(userIdValue);
        if (serverPreferences && serverPreferences.topics.length > 0) {
          setPreferences(serverPreferences);
          setIsFirstTime(false);
        } else {
          setIsFirstTime(true);
        }
      }
    } catch (error) {
      console.error('Failed to initialize user:', error);
      toast({
        title: "Error",
        description: "Failed to initialize user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesComplete = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    setShowPreferenceDialog(false);
    setIsFirstTime(false);
    setCurrentPage(1);
    // Clear search params when preferences change
    setSearchParams({});
  };

  const handleArticleClick = (article: Article) => {
    navigate(`/article/${article.id}`);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !loadingMore) {
      loadPersonalizedNews(currentPage + 1);
    }
  };

  // Use useCallback to prevent unnecessary re-renders of child components
  const handleSearchChange = useCallback((params: PersonalizedSearchParams) => {
    setSearchParams(params);
    setCurrentPage(1);
  }, []);

  if (loading && !preferences) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Setting up your personalized feed..." />
        </div>
      </div>
    );
  }

  if (isFirstTime || !preferences) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PreferenceSetup onComplete={handlePreferencesComplete} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Your Personalized Feed
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          News tailored to your interests based on your selected topics
        </p>
        
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Your topics:</span>
            {preferences.topics.slice(0, 3).map((topic) => (
              <Badge key={topic} variant="secondary" className="capitalize">
                {topic}
              </Badge>
            ))}
            {preferences.topics.length > 3 && (
              <Badge variant="outline">+{preferences.topics.length - 3} more</Badge>
            )}
          </div>
          
          <Dialog open={showPreferenceDialog} onOpenChange={setShowPreferenceDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Update Preferences
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <PreferenceSetup
                onComplete={handlePreferencesComplete}
                initialPreferences={preferences}
                isUpdate={true}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Filters */}
      <PersonalizedSearchFilters
        onSearchChange={handleSearchChange}
        placeholder="Search your personalized feed..."
      />

      {/* Articles */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <LoadingSpinner size="lg" text="Loading your personalized news..." />
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>No articles found</CardTitle>
            <CardDescription>
              No personalized articles match your current preferences and filters. 
              Try adjusting your search or updating your topic preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mr-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={showPreferenceDialog} onOpenChange={setShowPreferenceDialog}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Settings className="w-4 h-4 mr-2" />
                  Update Preferences
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <PreferenceSetup
                  onComplete={handlePreferencesComplete}
                  initialPreferences={preferences}
                  isUpdate={true}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={() => handleArticleClick(article)}
              />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                size="lg"
              >
                {loadingMore ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Loading more...</span>
                  </>
                ) : (
                  'Load More Articles'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PersonalizedFeed;