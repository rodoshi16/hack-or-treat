import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Brain, Lock, Unlock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { generateDSAQuestion, EXPRESSION_TO_ANSWER, EXPRESSION_EMOJIS } from '@/lib/dsaQuiz';
import { useFacialExpression } from '@/hooks/useFacialExpression';
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
  
  const {
    videoRef,
    isLoaded,
    isDetecting,
    currentExpression,
    error,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection
  } = useFacialExpression();

  // Load initial question
  useEffect(() => {
    loadNewQuestion();
  }, []);

  // Watch for facial expressions and map to answers
  useEffect(() => {
    if (currentExpression && currentQuestion && !answeredCorrectly) {
      const detectedAnswer = EXPRESSION_TO_ANSWER[currentExpression.expression];
      if (detectedAnswer && currentExpression.confidence > 0.7) {
        setSelectedAnswer(detectedAnswer);
        checkAnswer(detectedAnswer);
      }
    }
  }, [currentExpression, currentQuestion, answeredCorrectly]);

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
    
    if (answer === currentQuestion.correctAnswer) {
      setAnsweredCorrectly(true);
      setIsUnlocked(true);
      stopDetection();
      stopCamera();
      toast.success(`Correct! 🎉 You've unlocked your ${contentType}!`);
    } else {
      toast.error("Wrong answer! 😱 Try a new question!");
      setTimeout(() => {
        loadNewQuestion();
      }, 2000);
    }
  };

  const startQuiz = async () => {
    try {
      console.log("🎯 [DSAQuiz] startQuiz() called");
      console.log("🎯 [DSAQuiz] isLoaded:", isLoaded);
      console.log("🎯 [DSAQuiz] isDetecting before:", isDetecting);
      
      console.log("📷 [DSAQuiz] Calling startCamera()...");
      await startCamera();
      console.log("✅ [DSAQuiz] startCamera() completed");
      
      console.log("🔍 [DSAQuiz] Calling startDetection()...");
      startDetection();
      console.log("✅ [DSAQuiz] startDetection() called");
      
      console.log("🎯 [DSAQuiz] isDetecting after:", isDetecting);
      toast.info("Look at the camera and make facial expressions to answer! 📸");
    } catch (error) {
      console.error("❌ [DSAQuiz] Error starting quiz:", error);
      toast.error("Failed to start camera. Please allow camera permissions.");
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
                  
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(currentQuestion.options).map(([key, value]) => (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border transition-all ${
                          selectedAnswer === key 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{currentQuestion.emoji_mapping[key as keyof typeof currentQuestion.emoji_mapping]}</span>
                          <span className="font-medium">{key})</span>
                          <span className="text-sm">{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Facial Expression Mapping Guide */}
                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold mb-2 text-sm">📸 Answer using facial expressions:</h4>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {Object.entries(EXPRESSION_EMOJIS).map(([expression, emoji]) => (
                      <div key={expression} className="text-center">
                        <div className="text-lg">{emoji}</div>
                        <div className="font-medium">{EXPRESSION_TO_ANSWER[expression]}</div>
                        <div className="text-muted-foreground capitalize">{expression}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Camera Section */}
        <div className="space-y-4">
          {!isDetecting ? (
            <Button
              onClick={startQuiz}
              disabled={!isLoaded || isLoadingQuestion}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Start Facial Expression Quiz
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Live Camera Feed */}
              <div className="flex justify-center">
                <div className="relative">
                  <video
                    ref={videoRef}
                    width="400"
                    height="300"
                    className="rounded-lg border-4 border-primary shadow-lg"
                    muted
                    style={{ transform: 'scaleX(-1)' }} // Mirror effect like selfie camera
                  />
                  
                  {/* Overlay showing detected expression */}
                  <div className="absolute top-2 left-2 right-2">
                    <div className="bg-black/80 rounded-lg p-3 text-center">
                      <div className="text-white text-sm font-medium mb-1">
                        Your Expression:
                      </div>
                      {currentExpression ? (
                        <div className="space-y-1">
                          <div className="text-3xl">
                            {EXPRESSION_EMOJIS[currentExpression.expression as keyof typeof EXPRESSION_EMOJIS]}
                          </div>
                          <div className="text-white font-bold capitalize">
                            {currentExpression.expression}
                          </div>
                          <div className="text-green-400 text-xs">
                            {Math.round(currentExpression.confidence * 100)}% confident
                          </div>
                          <div className="text-yellow-300 text-xs">
                            = Answer {EXPRESSION_TO_ANSWER[currentExpression.expression]}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">
                          Detecting...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Corner indicator showing camera is active */}
                  <div className="absolute top-2 right-2">
                    <div className="bg-red-500 rounded-full w-3 h-3 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Expression Status Bar */}
              <div className="bg-muted/80 p-4 rounded-lg border border-primary/20">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {Object.entries(EXPRESSION_EMOJIS).map(([expression, emoji]) => {
                    const isActive = currentExpression?.expression === expression;
                    const confidence = isActive ? currentExpression?.confidence || 0 : 0;
                    
                    return (
                      <div 
                        key={expression}
                        className={`p-2 rounded-lg transition-all ${
                          isActive && confidence > 0.5
                            ? 'bg-primary text-primary-foreground scale-110' 
                            : 'bg-muted border'
                        }`}
                      >
                        <div className="text-2xl mb-1">{emoji}</div>
                        <div className="text-xs font-medium">
                          {EXPRESSION_TO_ANSWER[expression]}
                        </div>
                        <div className="text-xs opacity-70 capitalize">
                          {expression}
                        </div>
                        {isActive && (
                          <div className="text-xs mt-1 font-bold">
                            {Math.round(confidence * 100)}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={loadNewQuestion}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Question
                </Button>
                <Button
                  onClick={() => {
                    stopDetection();
                    stopCamera();
                  }}
                  variant="outline"
                  size="sm"
                >
                  Stop Camera
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm bg-red-950/30 p-3 rounded-lg">
              {error}
            </div>
          )}

          {!isLoaded && (
            <div className="text-yellow-500 text-sm">
              Loading facial recognition models...
            </div>
          )}

          {/* Debug Section */}
          <div className="border-t pt-4 mt-4">
            <div className="text-xs text-muted-foreground mb-2">🐛 Debug Tools:</div>
            <div className="flex gap-2">
              <Button
                onClick={testGeminiAPI}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Test Gemini API
              </Button>
              <Button
                onClick={() => {
                  console.log("🔍 Current state:", {
                    isLoaded,
                    isDetecting,
                    currentExpression,
                    error,
                    currentQuestion: !!currentQuestion
                  });
                }}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Log State
              </Button>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          💡 Tip: Make clear facial expressions! Happy 😊 = A, Surprised 😮 = B, Neutral 😐 = C, Angry 😠 = D
        </div>
      </div>
    </Card>
  );
};