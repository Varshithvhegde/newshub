import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArticleCard } from "@/components/ArticleCard";
import { SentimentBadge } from "@/components/SentimentBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Article as ArticleType, newsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, Clock, User, Brain, Sparkles, Eye, TrendingUp, Users, Activity, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { UserManager } from "@/lib/userManager";

export default function Article() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleType | null>(null);
  const [similarArticles, setSimilarArticles] = useState<ArticleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load main article first (faster)
  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const fetchArticle = async () => {
      try {
        setLoading(true);
        const userIdValue = await UserManager.getUserId();
        setUserId(userIdValue);
        
        // Use the userIdValue directly instead of the state
        const articleData = await newsAPI.getArticleById(id, userIdValue);
        setArticle(articleData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Article not found';
        toast({
          title: "Error loading article",
          description: errorMessage,
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, navigate, toast]);

  // Load similar articles separately (slower)
  useEffect(() => {
    if (!id || !article) return;

    const fetchSimilarArticles = async () => {
      try {
        setSimilarLoading(true);
        const similarData = await newsAPI.getSimilarArticles(id);
        setSimilarArticles(similarData.slice(0, 6)); // Show top 6 similar articles
      } catch (err) {
        console.warn('Failed to load similar articles:', err);
        setSimilarArticles([]);
      } finally {
        setSimilarLoading(false);
      }
    };

    fetchSimilarArticles();
  }, [id, article]);

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleSimilarArticleClick = (similarArticle: ArticleType) => {
    navigate(`/article/${similarArticle.id}`);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" text="Loading article..." className="min-h-[400px]" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-destructive">Article Not Found</CardTitle>
              <CardDescription>The requested article could not be found.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
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
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <Card className="mb-8 bg-gradient-card">
            {(article.urlToImage || article.image_url) && (
              <div className="aspect-video overflow-hidden rounded-t-lg">
                <img 
                  src={article.urlToImage || article.image_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline">
                  {typeof article.topic === 'string' 
                    ? article.topic 
                    : typeof article.topic === 'object' && article.topic && 'name' in article.topic
                      ? (article.topic as any).name 
                      : 'Unknown'
                  }
                </Badge>
                <SentimentBadge sentiment={article.sentiment} />
                <Badge variant="secondary">
                  {typeof article.source === 'string' 
                    ? article.source 
                    : typeof article.source === 'object' && article.source && 'name' in article.source
                      ? (article.source as any).name 
                      : 'Unknown Source'
                  }
                </Badge>
              </div>
              
              <CardTitle className="text-2xl md:text-3xl leading-tight">
                {article.title}
              </CardTitle>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(article.publishedAt)}</span>
                </div>
                
                {article.author && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>
                      {typeof article.author === 'string' 
                        ? article.author 
                        : typeof article.author === 'object' && article.author && 'name' in article.author
                          ? (article.author as any).name 
                          : 'Unknown Author'
                      }
                    </span>
                  </div>
                )}
                
                {article.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(article.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Read Original
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Article Insights - User-Focused */}
          {article.metrics && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Article Insights</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Reading Stats */}
                {/* <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/30">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-200/50 dark:bg-purple-800/30 rounded-lg p-2">
                      <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        {article.metrics.userViews === 1 
                          ? "First time reading this" 
                          : `You've read this ${article.metrics.userViews} times`
                        }
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        Your reading history
                      </p>
                    </div>
                  </div>
                </div> */}

                {/* Popularity Indicator */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-200/50 dark:bg-blue-800/30 rounded-lg p-2">
                      <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {article.metrics.totalViews > 100
                          ? "Very popular article"
                          : article.metrics.totalViews > 10
                            ? "Popular article" 
                            : "Growing readership"
                        }
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Reader interest level
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trending indicator - if applicable */}
              {article.growth && article.growth > 10 && (
                <div className="mt-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-200/50 dark:bg-emerald-800/30 rounded-lg p-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                          Trending Now
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          This article is gaining popularity today
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Hot
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                AI Summary
                <Sparkles className="w-4 h-4 text-primary/60" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">{article.summary}</p>
            </CardContent>
          </Card>

          {/* Full Content (if available) */}
          {article.content && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Full Article</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {article.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Similar Articles */}
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-6">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Similar Articles</h2>
              <Badge variant="outline" className="text-xs">
                AI Powered
              </Badge>
            </div>
            
            {similarLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Finding similar articles..." />
              </div>
            ) : similarArticles.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent>
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No similar articles found at this time.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {similarArticles.map((similarArticle, index) => (
                  <div 
                    key={similarArticle.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <ArticleCard
                      article={similarArticle}
                      onClick={() => handleSimilarArticleClick(similarArticle)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}