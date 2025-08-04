import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SentimentBadge } from "./SentimentBadge";
import { Article } from "@/lib/api";
import { Clock, ExternalLink, User, Eye, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ArticleCardProps {
  article: Article;
  onClick?: () => void;
  className?: string;
}

export const ArticleCard = ({ article, onClick, className }: ArticleCardProps) => {
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      console.log(dateString);
      return 'Recently';
    }
  };

  return (
    <Card 
      className={`group cursor-pointer hover:shadow-elevated transition-all duration-300 hover:scale-[1.02] bg-gradient-card ${className}`}
      onClick={onClick}
    >
      <div className="aspect-video overflow-hidden rounded-t-lg">
        <img 
          src={article.urlToImage || article.image_url || "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=200&fit=crop"}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=200&fit=crop";
          }}
        />
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            {(() => {
              if (typeof article.topic === 'string') return article.topic;
              if (article.topic && typeof article.topic === 'object') {
                return typeof article.topic.name === 'string' ? article.topic.name : 'Unknown';
              }
              return 'Unknown';
            })()}
          </Badge>
          <SentimentBadge sentiment={article.sentiment} />
        </div>
        
        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
          {article.title}
        </CardTitle>
        
        <CardDescription className="text-sm text-muted-foreground line-clamp-2">
          {article.summary}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            
            {article.author && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
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
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {typeof article.source === 'string' 
                ? article.source 
                : typeof article.source === 'object' && article.source && 'name' in article.source
                  ? (article.source as any).name 
                  : 'Unknown Source'
              }
            </span>
            {article.url && (
              <ExternalLink className="w-3 h-3 opacity-60" />
            )}
          </div>
          
          {/* View Metrics */}
          {article.metrics && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground view-metrics">
              <Eye className="w-3 h-3" />
              <span>{article.metrics.totalViews}</span>
              {article.growth && article.growth > 0 && (
                <div className="flex items-center gap-1 text-green-600 animate-bounce-gentle">
                  <TrendingUp className="w-3 h-3" />
                  <span>+{article.growth.toFixed(1)}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};