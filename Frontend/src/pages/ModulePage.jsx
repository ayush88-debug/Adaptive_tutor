import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { CodeBlock, CodeBlockHeader, CodeBlockBody, CodeBlockContent, CodeBlockCopyButton } from '@/components/ui/CodeBlock';
import { Youtube } from 'lucide-react';

const ModulePage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [moduleData, setModuleData] = useState(null);
  const [view, setView] = useState('lesson');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const fetchModuleData = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await api.getModule(moduleId);
      setModuleData(response.module);
    } catch (error) {
      console.error("Failed to fetch module:", error);
      setError('Failed to load module. It might be generating in the background. Please refresh in a moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModuleData();
  }, [moduleId]);

  const handleAnswerChange = (questionId, chosenIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: chosenIndex }));
  };

  const handleSubmitQuiz = async () => {
    const quizQuestions = moduleData?.quizId?.questions || [];
    if (Object.keys(answers).length !== quizQuestions.length) {
        setError("Please answer all questions before submitting.");
        return;
    }
    setError('');

    const submissionPayload = Object.entries(answers).map(([questionId, chosenIndex]) => ({
        questionId,
        chosenIndex: parseInt(chosenIndex),
    }));
    
    try {
      setLoading(true);
      const response = await api.submitQuiz(moduleId, submissionPayload);
      setResult(response);
      setView('result');
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      setError('Error submitting quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (result.passed) {
      navigate('/dashboard');
    } else {
      setView('lesson');
      setResult(null);
      setAnswers({});
      setCurrentQuestionIndex(0);
      fetchModuleData();
    }
  };

  if (loading && !moduleData) return <div className="text-center p-8 text-slate-500">Loading module...</div>;
  if (error) return <div className="text-center p-8 text-red-500 font-semibold">{error}</div>;
  if (!moduleData) return <div className="text-center p-8">Module data not found.</div>;

  const { content, quizId, subjectId, isCompleted } = moduleData;
  const quizQuestions = quizId?.questions || [];
  const currentQuestion = quizQuestions[currentQuestionIndex];


  const getYouTubeVideoId = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        return urlObj.searchParams.get('v');
      }
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1); 
      }
    } catch (e) {
      console.error("Error parsing YouTube URL:", e);
    }
    return null;
  };

  return (
    <div>
      {view === 'lesson' && content && (
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-blue-600">{subjectId?.title || 'Subject'}</p>
            <CardTitle className="text-2xl">{content.title}</CardTitle>
            <CardDescription>Study the material below, then start the quiz.</CardDescription>
          </CardHeader>
          <CardContent className="prose max-w-none prose-slate">
            {content.sections.map((section, index) => (
              <div key={index} className="mb-6">
                <h3 className="font-semibold text-xl border-b pb-2 mb-2">{section.heading}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{section.body}</p>
                {section.codeSample && section.codeSample.trim() !== '' && (
                  <CodeBlock>
                    <CodeBlockHeader>
                      <span className="text-xs font-sans text-slate-400">C++ Example</span>
                      <CodeBlockCopyButton code={section.codeSample} />
                    </CodeBlockHeader>
                    <CodeBlockBody>
                      <CodeBlockContent code={section.codeSample} />
                    </CodeBlockBody>
                  </CodeBlock>
                )}
              </div>
            ))}
             <h3 className="font-semibold text-xl border-b pb-2 mb-2 mt-8">Key Takeaways</h3>
             <ul className="list-disc pl-5 space-y-2">
                {content.keyTakeaways.map((takeaway, index) => (
                    <li key={index}>{takeaway}</li>
                ))}
             </ul>
             
             {moduleData.youtubeLinks && moduleData.youtubeLinks.length > 0 && (
                <>
                    <h3 className="font-semibold text-xl border-b pb-2 mb-2 mt-8">Further Learning (Videos)</h3>
                    <div className="space-y-6"> {/* Use div for spacing */}
                        {moduleData.youtubeLinks.map((link, index) => {
                            const videoId = getYouTubeVideoId(link);
                            if (!videoId) {
                                // Optionally render a simple link if ID extraction fails
                                return (
                                    <p key={index} className="text-sm text-red-600">
                                        Could not embed video: <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                                    </p>
                                );
                            }
                            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                            return (
                                <div key={index} className="flex justify-center"> {/* ADD THIS flex div */}
                                    <div className="aspect-video relative w-full md:w-3/4 lg:w-2/3 xl:w-1/2"> {/* MODIFY THIS LINE */}
                                        <iframe
                                            className="absolute top-0 left-0 w-full h-full rounded-md border"
                                            src={embedUrl}
                                            title={`YouTube video player ${index + 1}`}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            referrerPolicy="strict-origin-when-cross-origin"
                                            allowFullScreen>
                                        </iframe>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
             )}
             
          </CardContent>
          
          {!isCompleted && (
            <CardFooter>
              <Button onClick={() => setView('quiz')} size="lg" disabled={!quizId}>Start Quiz</Button>
            </CardFooter>
          )}
        </Card>
      )}

      {view === 'quiz' && currentQuestion && (
         <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="mb-4">
                  <p className="text-sm font-medium text-blue-600">{subjectId?.title || 'Subject'}</p>
                  <CardTitle>Quiz: {content.title}</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <Progress value={((currentQuestionIndex + 1) / quizQuestions.length) * 100} className="flex-1"/>
                <span className="text-sm font-medium text-slate-500">
                  {currentQuestionIndex + 1} / {quizQuestions.length}
                </span>
              </div>
            </CardHeader>

            <CardContent className="min-h-[250px]">
                <h3 className="text-lg font-semibold mb-6">{currentQuestion.text}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((opt, i) => {
                    const isSelected = answers[currentQuestion._id] === i.toString();
                    return (
                      <div key={i}>
                        <input
                          type="radio"
                          id={`${currentQuestion._id}-${i}`}
                          name={currentQuestion._id}
                          value={i}
                          checked={isSelected}
                          onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                          className="sr-only"
                        />
                        <Label 
                          htmlFor={`${currentQuestion._id}-${i}`}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
                        >
                          <span className={`flex items-center justify-center h-6 w-6 rounded-full border mr-4 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                          </span>
                          {opt}
                        </Label>
                      </div>
                    )
                  })}
                </div>
                {error && <p className="text-center text-sm text-red-500 mt-4">{error}</p>}
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentQuestionIndex(prev => prev - 1)} disabled={currentQuestionIndex === 0}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                </Button>
                {currentQuestionIndex < quizQuestions.length - 1 ? (
                  <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>
                    Next <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmitQuiz} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Quiz'}
                  </Button>
                )}
            </CardFooter>
         </Card>
      )}
      
      {view === 'result' && result && (
          <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-3xl">Quiz Result</CardTitle>
                <CardDescription className="text-lg">Your Score: <span className="font-bold text-2xl">{result.score}%</span></CardDescription>
                 {result.passed ? (
                    <p className="text-green-600 mt-2">Congratulations! You have passed this module.</p>
                ) : (
                    <p className="text-orange-600 mt-2">You didn't quite reach the mastery threshold. A new, simpler lesson is ready for you to review.</p>
                )}
            </CardHeader>
            <CardContent>
                <h3 className="text-xl font-semibold mb-4 text-center">Review Your Answers</h3>
                <div className="space-y-6">
                    {quizId.questions.map((q, index) => {
                        const studentAnswerRecord = result.attempt?.answers.find(a => a.questionId.toString() === q._id.toString());
                        const studentChoiceIndex = studentAnswerRecord?.chosenIndex;
                        const isQuestionCorrect = studentAnswerRecord?.correct;

                        return (
                            <div key={q._id} className={`p-4 rounded-lg border-2 ${isQuestionCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                <p className="font-semibold mb-2">{index + 1}. {q.text}</p>
                                <div className="space-y-2">
                                    {q.options.map((opt, i) => {
                                        const isStudentChoice = i === studentChoiceIndex;
                                        const isCorrectChoice = i === q.correctIndex;
                                        
                                        return (
                                            <div key={i} className="flex items-center gap-2">
                                                {isCorrectChoice && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                                                {isStudentChoice && !isCorrectChoice && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />}

                                                <Label className={`
                                                  ${isCorrectChoice ? 'text-green-700 font-semibold' : ''} 
                                                  ${isStudentChoice && !isCorrectChoice ? 'text-red-700' : ''}
                                                `}>
                                                    {opt}
                                                </Label>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="mt-3 p-2 bg-slate-100 rounded text-sm">
                                    <p className="font-semibold">Explanation:</p>
                                    <p className="text-slate-700">{q.explanation}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
            <CardFooter className="justify-center mt-4">
                <Button onClick={handleNextStep} size="lg">
                    {result.passed ? 'Back to Dashboard' : 'Review New Lesson'}
                </Button>
            </CardFooter>
          </Card>
      )}
    </div>
  );
};

export default ModulePage;