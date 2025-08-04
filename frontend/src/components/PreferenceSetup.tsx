import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { newsAPI } from "@/lib/api";
import { UserManager, UserPreferences } from "@/lib/userManager";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "@/hooks/use-toast";
import { Heart, X } from "lucide-react";

interface PreferenceSetupProps {
  onComplete: (preferences: UserPreferences) => void;
  initialPreferences?: UserPreferences;
  isUpdate?: boolean;
}

export const PreferenceSetup = ({ onComplete, initialPreferences, isUpdate = false }: PreferenceSetupProps) => {
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initialPreferences?.topics || []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const availableTopics = await newsAPI.getTopics();
        setTopics(availableTopics);
      } catch (error) {
        console.error('Failed to load topics:', error);
        toast({
          title: "Error",
          description: "Failed to load available topics. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, []);

  const toggleTopic = (topic: string) => {
    const lowercaseTopic = topic.toLowerCase();
    setSelectedTopics(prev => {
      if (prev.includes(lowercaseTopic)) {
        return prev.filter(t => t !== lowercaseTopic);
      } else {
        if (prev.length >= 10) {
          toast({
            title: "Maximum reached",
            description: "You can select up to 10 topics only.",
            variant: "destructive",
          });
          return prev;
        }
        return [...prev, lowercaseTopic];
      }
    });
  };

  const handleSave = async () => {
    if (selectedTopics.length === 0) {
      toast({
        title: "No topics selected",
        description: "Please select at least one topic to continue.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const userId = await UserManager.getUserId();
      const preferences: UserPreferences = { topics: selectedTopics };
      
      if (isUpdate) {
        await UserManager.updatePreferences(userId, preferences);
        toast({
          title: "Preferences updated",
          description: "Your news preferences have been updated successfully.",
        });
      } else {
        await UserManager.syncPreferences(userId, preferences);
        toast({
          title: "Preferences saved",
          description: "Your news preferences have been saved successfully.",
        });
      }
      
      onComplete(preferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading topics..." />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Heart className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">
          {isUpdate ? 'Update Your Preferences' : 'Personalize Your News Feed'}
        </CardTitle>
        <CardDescription>
          Select topics you're interested in (up to 10). We'll curate personalized news based on your preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Available Topics</h3>
            <Badge variant="secondary">{selectedTopics.length}/10 selected</Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {topics.map((topic) => {
              const isSelected = selectedTopics.includes(topic.toLowerCase());
              return (
                <Button
                  key={topic}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTopic(topic)}
                  className="justify-between h-auto p-3"
                  disabled={!isSelected && selectedTopics.length >= 10}
                >
                  <span className="text-sm font-medium">{topic}</span>
                  {isSelected && <X className="h-3 w-3 ml-2" />}
                </Button>
              );
            })}
          </div>
        </div>

        {selectedTopics.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Selected Topics:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTopics.map((topic) => (
                <Badge key={topic} variant="default" className="capitalize">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={selectedTopics.length === 0 || saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <LoadingSpinner size="sm" />
            ) : (
              isUpdate ? 'Update Preferences' : 'Save Preferences'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};