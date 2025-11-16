import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight, BrainCircuit, FileCode, Play, Loader2, CornerDownLeft } from 'lucide-react'; // Added icons
import { CodeBlock, CodeBlockHeader, CodeBlockBody, CodeBlockContent, CodeBlockCopyButton } from '@/components/ui/CodeBlock';
import CodeEditor from '@/components/ui/CodeEditor';
import { Textarea } from "@/components/ui/textarea"; // Import Textarea

const ModulePage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [moduleData, setModuleData] = useState(null);
  const [view, setView] = useState('lesson');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [runOutput, setRunOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stdin, setStdin] = useState(""); // NEW: State for custom input

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const fetchModuleData = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await api.getModule(moduleId);
      setModuleData(response.module);
      const initialAnswers = {};
      if (response.module?.quizId?.questions) {
        response.module.quizId.questions.forEach(q => {
          if (q.type === 'coding') {
            initialAnswers[q._id] = { type: 'coding', value: q.starterCode || '' };
          } else if (q.type === 'mcq') {
             initialAnswers[q._id] = { type: 'mcq', value: null };
          }
        });
      }
      setAnswers(initialAnswers);
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
    setAnswers(prev => ({
      ...prev,
      [questionId]: { type: 'mcq', value: chosenIndex }
    }));
  };

  const handleCodeChange = (questionId, codeString) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { type: 'coding', value: codeString }
    }));
  };

  const handleRunCode = async (language, code) => {
    if (!code) return;
    setIsRunning(true);
    setRunOutput(null); // Clear previous output
    try {
      const response = await api.executeCode(language, code, stdin);
      setRunOutput(response.output);
    } catch (err) {
      console.error("Run Code Error:", err);
      setRunOutput("Error: Failed to execute code. " + (err.response?.data?.message || err.message));
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitQuiz = async () => {
    const quizQuestions = moduleData?.quizId?.questions || [];
    let allAnswered = true;
    let firstUnanswered = -1;

     // Check if all questions have been answered
    for (let i = 0; i < quizQuestions.length; i++) {
        const q = quizQuestions[i];
        if (!answers[q._id] || (q.type === 'mcq' && answers[q._id].value === null)) {
            allAnswered = false;
            if (firstUnanswered === -1) {
                firstUnanswered = i;
            }
            // Don't check coding questions for *existence* here, just MCQs for *value*
        } else if (q.type === 'coding' && (!answers[q._id] || typeof answers[q._id].value === 'undefined')) {
             // Ensure coding answers exist in the state object, even if empty string
             answers[q._id] = { type: 'coding', value: '' };
        }
    }


    if (!allAnswered) {
      setError(`Please answer all questions. Question ${firstUnanswered + 1} is unanswered.`);
      setCurrentQuestionIndex(firstUnanswered); // Jump to the first unanswered question
      return;
    }

    setError(''); // Clear error if all answered


    // Format the payload for the backend
    const submissionPayload = Object.entries(answers).map(([questionId, answer]) => {
      const question = quizQuestions.find(q => q._id === questionId);
      if (!question) return null;

      if (question.type === 'mcq') {
        const chosenIndex = answer.value !== null ? parseInt(answer.value) : null;
        return { questionId, chosenIndex: chosenIndex, submittedCode: null };
      } else if (question.type === 'coding') {
        return { questionId, chosenIndex: null, submittedCode: answer.value };
      }
      return null;
    }).filter(Boolean);

     if (submissionPayload.length !== quizQuestions.length) {
        setError("Error formatting submission. Please try again.");
        return;
    }

    try {
      setLoading(true);
      const response = await api.submitQuiz(moduleId, submissionPayload);
      setResult(response);
      setView('result');
    } catch (err) {
      console.error("Failed to submit quiz:", err);
      setError(err.message || 'Error submitting quiz. Please try again.');
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
      setLoading(true);
      fetchModuleData();
    }
  };

  // YouTube Helper Function
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


  if (loading && !moduleData) return <div className="text-center p-8 text-slate-500">Loading module...</div>;
  if (error && view !== 'quiz') return <div className="text-center p-8 text-red-500 font-semibold">{error}</div>; // Show general errors outside quiz view
  if (!moduleData) return <div className="text-center p-8">Module data not found.</div>;

  const { content, quizId, subjectId, isCompleted, youtubeLinks } = moduleData; // Destructure youtubeLinks
  const quizQuestions = quizId?.questions || [];
  const currentQuestion = quizQuestions[currentQuestionIndex];

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

              {youtubeLinks && youtubeLinks.length > 0 && (
                 <>
                     <h3 className="font-semibold text-xl border-b pb-2 mb-2 mt-8">Further Learning (Videos)</h3>
                     <div className="space-y-6 not-prose"> {/* Added not-prose to prevent prose styles interfering */}
                         {youtubeLinks.map((link, index) => {
                             const videoId = getYouTubeVideoId(link);
                             if (!videoId) {
                                 return (
                                     <p key={index} className="text-sm text-red-600">
                                         Could not embed video: <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                                     </p>
                                 );
                             }
                             const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                             return (
                                 <div key={index} className="flex justify-center">
                                     <div className="aspect-video relative w-full md:w-3/4 lg:w-2/3 xl:w-1/2">
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

      {/* Quiz View */}
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

            <CardContent className="min-h-[400px] flex flex-col">
                {currentQuestion.type === 'mcq' ? (
                  <>
                    <h3 className="text-lg font-semibold mb-6">{currentQuestion.text}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQuestion.options.map((opt, i) => {
                        const isSelected = answers[currentQuestion._id]?.value === String(i);
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
                              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors h-full ${isSelected ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
                            >
                              <span className={`flex items-center justify-center h-6 w-6 rounded-full border mr-4 flex-shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                                {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                              </span>
                              <span className="flex-1">{opt}</span>
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : ( 
                  // --- Coding Question UI ---
                  <div className="space-y-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold flex items-center"><FileCode className="h-5 w-5 mr-2 text-blue-600"/> {currentQuestion.text}</h3>
                      <Badge variant="secondary">{currentQuestion.language}</Badge>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{currentQuestion.problemStatement}</p>
                    
                    <div className="flex-grow border rounded-md overflow-hidden">
                       <CodeEditor
                         language={currentQuestion.language}
                         value={answers[currentQuestion._id]?.value ?? ''}
                         onChange={(value) => handleCodeChange(currentQuestion._id, value)}
                       />
                    </div>
                    
                    {/* --- CUSTOM INPUT SECTION --- */}
                    <div className="space-y-2 pt-2">
                       <Label htmlFor="stdin" className="text-xs font-semibold text-slate-600">CUSTOM INPUT (stdin)</Label>
                       <Textarea
                         id="stdin"
                         placeholder="Enter custom input to test your code..."
                         className="font-mono text-sm h-24"
                         value={stdin}
                         onChange={(e) => setStdin(e.target.value)}
                       />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="secondary" 
                        onClick={() => handleRunCode(currentQuestion.language, answers[currentQuestion._id]?.value)}
                        disabled={isRunning || !answers[currentQuestion._id]?.value}
                        className="w-32"
                      >
                        {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Play className="h-4 w-4 mr-2" /> Run Code</>}
                      </Button>
                    </div>
                    
                    {/* Output Console */}
                    {runOutput !== null && (
                      <div className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-md font-mono text-sm whitespace-pre-wrap max-h-40 overflow-y-auto border border-slate-700">
                        <div className="text-xs text-slate-500 mb-1 border-b border-slate-700 pb-1">OUTPUT</div>
                        {runOutput}
                      </div>
                    )}
                  </div>
                )}
                 {error && view === 'quiz' && <p className="text-center text-sm text-red-500 mt-4">{error}</p>}
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentQuestionIndex(prev => prev - 1);
                    setRunOutput(null); // Clear output on nav
                    setStdin(""); // Clear stdin on nav
                  }}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                </Button>

                {currentQuestionIndex < quizQuestions.length - 1 ? (
                  <Button onClick={() => {
                    setCurrentQuestionIndex(prev => prev + 1);
                    setRunOutput(null); // Clear output on nav
                    setStdin(""); // Clear stdin on nav
                  }}>
                    Next <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmitQuiz} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? 'Submitting...' : 'Submit Quiz'}
                  </Button>
                )}
            </CardFooter>
         </Card>
      )}

      {/* Result View */}
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
                        const isQuestionCorrect = studentAnswerRecord?.correct;

                        if (q.type === 'mcq') {
                          const studentChoiceIndex = studentAnswerRecord?.chosenIndex;
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
                                                    ${isStudentChoice && !isCorrectChoice ? 'text-red-700 line-through' : ''}
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
                        }

                        if (q.type === 'coding') {
                          return (
                            <div key={q._id} className={`p-4 rounded-lg border-2 border-slate-200 bg-slate-50`}>
                                <div className="flex justify-between items-center mb-2">
                                   <p className="font-semibold">{index + 1}. {q.text}</p>
                                   <Badge variant="outline" className="border-blue-500 text-blue-700">Coding Exercise</Badge>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap mb-4">{q.problemStatement}</p>
                                <h4 className="font-semibold text-sm mb-2">Your Submission (Grading Pending):</h4>
                                <CodeBlock>
                                  <CodeBlockHeader>
                                    <span className="text-xs font-sans text-slate-400">{q.language}</span>
                                  </CodeBlockHeader>
                                  <CodeBlockBody>
                                    <CodeBlockContent code={studentAnswerRecord?.submittedCode || "// No code submitted."} language={q.language} />
                                  </CodeBlockBody>
                                </CodeBlock>
                                {q.explanation && (
                                  <div className="mt-3 p-2 bg-slate-100 rounded text-sm">
                                      <p className="font-semibold">Hint/Explanation:</p>
                                      <p className="text-slate-700">{q.explanation}</p>
                                  </div>
                                )}
                            </div>
                          )
                        }
                        return null;
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