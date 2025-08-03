import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SentimentBadgeProps {
  sentiment: 'positive' | 'negative' | 'neutral';
  className?: string;
}

export const SentimentBadge = ({ sentiment, className }: SentimentBadgeProps) => {
  const getVariant = () => {
    switch (sentiment) {
      case 'positive':
        return 'default';
      case 'negative':
        return 'destructive';
      case 'neutral':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getIcon = () => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-3 h-3" />;
      case 'negative':
        return <TrendingDown className="w-3 h-3" />;
      case 'neutral':
        return <Minus className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (sentiment) {
      case 'positive':
        return 'bg-success text-success-foreground';
      case 'negative':
        return 'bg-destructive text-destructive-foreground';
      case 'neutral':
        return 'bg-neutral text-neutral-foreground';
      default:
        return 'bg-neutral text-neutral-foreground';
    }
  };

  return (
    <Badge className={`${getColor()} flex items-center gap-1 ${className}`}>
      {getIcon()}
      <span className="capitalize">{sentiment}</span>
    </Badge>
  );
};