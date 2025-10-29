import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Lock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { generateDSAQuestion } from '@/lib/dsaQuiz';
import { testGeminiAPI } from '@/lib/testGemini';

interface DSAQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  emoji_mapping: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

interface DSAQuizGatekeeperProps {
  children: React.ReactNode;
  contentType: string; // "Horror Story", "Reel", "Jumpscare Video", etc.
}

export const DSAQuizGatekeeper = ({ children, contentType }: DSAQuizGatekeeperProps) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<DSAQuestion | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  // Load initial question
  useEffect(() => {
    loadNewQuestion();
  }, []);

  // No longer needed - using simple click-based answers instead of facial expressions

  const loadNewQuestion = async () => {
    setIsLoadingQuestion(true);
    setAnsweredCorrectly(false);
    setSelectedAnswer(null);
    
    try {
      const question = await generateDSAQuestion();
      setCurrentQuestion(question);
      toast.info("New DSA challenge loaded! 🧠");
    } catch (error) {
      toast.error("Failed to load question");
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const checkAnswer = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;
    
    setSelectedAnswer(answer);
    
    if (answer === currentQuestion.correctAnswer) {
      setAnsweredCorrectly(true);
      setIsUnlocked(true);
      toast.success(`Correct! 🎉 You've unlocked your ${contentType}!`);
    } else {
      toast.error("Wrong answer! 😱 Try a new question!");
      setTimeout(() => {
        loadNewQuestion();
      }, 2000);
    }
  };


  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <Card className="p-8 border-2 border-red-500/50 bg-gradient-to-br from-red-950/20 to-background relative overflow-hidden">
      {/* Lock overlay effect */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      <div className="relative z-10 space-y-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Lock className="w-8 h-8 text-red-500" />
          <h2 className="text-3xl font-bold text-red-500">🔒 LOCKED CONTENT</h2>
          <Lock className="w-8 h-8 text-red-500" />
        </div>

        <div className="bg-red-950/30 p-4 rounded-lg border border-red-500/30">
          <p className="text-lg text-red-200 mb-2">
            Your <strong>{contentType}</strong> is locked! 😈
          </p>
          <p className="text-sm text-red-300">
            Solve this Data Structures & Algorithms challenge using facial expressions to unlock it!
          </p>
        </div>

        {/* Question Section */}
        {currentQuestion && (
          <div className="bg-background/80 p-6 rounded-lg border border-primary/20 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-primary">DSA Challenge</h3>
            </div>
            
            {isLoadingQuestion ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" />
                <span>Loading new question...</span>
              </div>
            ) : (
              <>
                <div className="text-left mb-6">
                  <p className="text-lg font-medium mb-4">{currentQuestion.question}</p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(currentQuestion.options).map(([key, value]) => (
                      <Button
                        key={key}
                        onClick={() => checkAnswer(key as 'A' | 'B' | 'C' | 'D')}
                        disabled={answeredCorrectly || isLoadingQuestion}
                        variant={selectedAnswer === key ? "default" : "outline"}
                        className={`p-4 h-auto text-left justify-start transition-all ${
                          selectedAnswer === key 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-2xl">{currentQuestion.emoji_mapping[key as keyof typeof currentQuestion.emoji_mapping]}</span>
                          <span className="font-bold text-lg">{key})</span>
                          <span className="text-sm flex-1">{value}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-center">💡 Click on an answer option above to select it!</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Quiz Actions */}
        <div className="space-y-4 text-center">
          {!currentQuestion && (
            <Button
              onClick={loadNewQuestion}
              disabled={isLoadingQuestion}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <Brain className="w-5 h-5 mr-2" />
              Start DSA Quiz
            </Button>
          )}

          {currentQuestion && !answeredCorrectly && (
            <Button
              onClick={loadNewQuestion}
              disabled={isLoadingQuestion}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Question
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          💡 Tip: Click on any answer option to select it. Get it right to unlock your content!
        </div>
      </div>
    </Card>
  );
};