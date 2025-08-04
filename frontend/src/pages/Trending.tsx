import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArticleCard } from "@/components/ArticleCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Article, newsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, BarChart3, Brain, Filter } from "lucide-react";

export default function Trending() {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSentiment, setSelectedSentiment] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [trendingData, topicsData] = await Promise.all([
          newsAPI.getTrendingArticles(20), // Get top 20 trending articles
          newsAPI.getTopics()
        ]);
        
        setAllArticles(trendingData.trendingArticles);
        setTopics(topicsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load trending data';
        toast({
          title: "Error loading trending articles",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const getFilteredArticles = () => {
    if (selectedSentiment === 'all') return allArticles;
    return allArticles.filter(article => article.sentiment === selectedSentiment);
  };

  const getTopicStats = () => {
    const topicCounts = topics.map(topic => {
      const count = allArticles.filter(article => article.topic === topic).length;
      return { topic, count };
    }).sort((a, b) => b.count - a.count);
    
    return topicCounts;
  };

  const getSentimentStats = () => {
    const sentimentCounts = {
      positive: allArticles.filter(a => a.sentiment === 'positive').length,
      negative: allArticles.filter(a => a.sentiment === 'negative').length,
      neutral: allArticles.filter(a => a.sentiment === 'neutral').length,
    };
    
    return sentimentCounts;
  };

  const getRecentArticles = () => {
    return [...allArticles]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 12);
  };

  const getPopularSources = () => {
    const sourceCounts = allArticles.reduce((acc, article) => {
      acc[article.source] = (acc[article.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(sourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([source, count]) => ({ source, count }));
  };

  const handleArticleClick = (article: Article) => {
    navigate(`/article/${article.id}`);
  };

  const handleTopicClick = (topic: string) => {
    navigate(`/search?topic=${encodeURIComponent(topic)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" text="Loading trending news..." className="min-h-[400px]" />
        </div>
      </div>
    );
  }

  const filteredArticles = getFilteredArticles();
  const topicStats = getTopicStats();
  const sentimentStats = getSentimentStats();
  const recentArticles = getRecentArticles();
  const popularSources = getPopularSources();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
            <Brain className="w-6 h-6 text-primary/60" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Trending News</h1>
          <p className="text-muted-foreground">
            Discover what's trending with AI-powered analytics and insights
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trending Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allArticles.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">High Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {allArticles.filter(a => a.growth && a.growth > 10).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {allArticles.reduce((sum, article) => sum + (article.metrics?.totalViews || 0), 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(() => {
                  const articlesWithGrowth = allArticles.filter(a => a.growth !== undefined);
                  if (articlesWithGrowth.length === 0) return 0;
                  const avgGrowth = articlesWithGrowth.reduce((sum, a) => sum + (a.growth || 0), 0) / articlesWithGrowth.length;
                  return avgGrowth.toFixed(1);
                })()}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-6">
            {/* Sentiment Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter by Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'positive', 'negative', 'neutral'] as const).map((sentiment) => (
                    <Button
                      key={sentiment}
                      variant={selectedSentiment === sentiment ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSentiment(sentiment)}
                    >
                      <span className="capitalize">{sentiment}</span>
                      {sentiment !== 'all' && (
                        <Badge variant="secondary" className="ml-2">
                          {sentimentStats[sentiment]}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredArticles.slice(0, 16).map((article, index) => (
                <div 
                  key={article.id}
                  className="animate-fade-in relative"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {article.growth && article.growth > 10 && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs trending-badge">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    </div>
                  )}
                  <ArticleCard
                    article={article}
                    onClick={() => handleArticleClick(article)}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="topics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Most Popular Topics
                </CardTitle>
                <CardDescription>
                  Topics ranked by number of articles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topicStats.map(({ topic, count }, index) => (
                    <div 
                      key={topic}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleTopicClick(topic)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{topic}</span>
                      </div>
                      <Badge variant="secondary">{count} articles</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-success/20 bg-success/5">
                <CardHeader>
                  <CardTitle className="text-success">Positive News</CardTitle>
                  <CardDescription>Articles with positive sentiment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success mb-2">
                    {sentimentStats.positive}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Math.round((sentimentStats.positive / allArticles.length) * 100)}% of all articles
                  </p>
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive">Negative News</CardTitle>
                  <CardDescription>Articles with negative sentiment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive mb-2">
                    {sentimentStats.negative}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Math.round((sentimentStats.negative / allArticles.length) * 100)}% of all articles
                  </p>
                </CardContent>
              </Card>

              <Card className="border-neutral/20 bg-neutral/5">
                <CardHeader>
                  <CardTitle className="text-neutral">Neutral News</CardTitle>
                  <CardDescription>Articles with neutral sentiment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-neutral mb-2">
                    {sentimentStats.neutral}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Math.round((sentimentStats.neutral / allArticles.length) * 100)}% of all articles
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Top News Sources
                </CardTitle>
                <CardDescription>
                  Sources ranked by article count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {popularSources.map(({ source, count }, index) => (
                    <div 
                      key={source}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{source}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}