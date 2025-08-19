import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from 'lucide-react';

// Simple Radio Group components for the quiz
const RadioGroup = ({ children, ...props }) => <div {...props}>{children}</div>;
const RadioGroupItem = ({ id, name, value, onChange, label, disabled }) => (
    <div className="flex items-center space-x-2">
        <input type="radio" id={id} name={name} value={value} onChange={onChange} disabled={disabled} />
        <Label htmlFor={id} className={`font-normal ${disabled ? 'text-slate-400' : 'cursor-pointer'}`}>{label}</Label>
    </div>
);

const ModulePage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [moduleData, setModuleData] = useState(null);
  const [view, setView] = useState('lesson'); // 'lesson', 'quiz', 'result'
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      fetchModuleData();
    }
  };

  if (loading && !moduleData) return <div className="text-center p-8 text-slate-500">Loading module... This may take a moment as the AI generates content.</div>;
  if (error) return <div className="text-center p-8 text-red-500 font-semibold">{error}</div>;
  if (!moduleData) return <div className="text-center p-8">Module data not found.</div>;

  const { content, quizId } = moduleData;

  return (
    <div>
      {view === 'lesson' && content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{content.title}</CardTitle>
            <CardDescription>Study the material below, then start the quiz.</CardDescription>
          </CardHeader>
          <CardContent className="prose max-w-none prose-slate">
            {content.sections.map((section, index) => (
              <div key={index} className="mb-6">
                <h3 className="font-semibold text-xl border-b pb-2 mb-2">{section.heading}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{section.body}</p>
              </div>
            ))}
            {content.codeSamples && content.codeSamples.length > 0 && (
                <>
                    <h3 className="font-semibold text-xl border-b pb-2 mb-2 mt-8">Code Samples</h3>
                    {content.codeSamples.map((sample, index) => (
                        <pre key={index} className="bg-slate-800 text-white p-4 rounded-md overflow-x-auto">
                            <code>{sample}</code>
                        </pre>
                    ))}
                </>
            )}
             <h3 className="font-semibold text-xl border-b pb-2 mb-2 mt-8">Key Takeaways</h3>
             <ul className="list-disc pl-5 space-y-2">
                {content.keyTakeaways.map((takeaway, index) => (
                    <li key={index}>{takeaway}</li>
                ))}
             </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setView('quiz')} size="lg" disabled={!quizId}>Start Quiz</Button>
          </CardFooter>
        </Card>
      )}

      {view === 'quiz' && quizId && (
         <Card>
            <CardHeader><CardTitle>Quiz: {content.title}</CardTitle></CardHeader>
            <CardContent className="space-y-8">
                {error && <p className="text-center text-sm text-red-500">{error}</p>}
                {quizId.questions.map((q, index) => (
                    <div key={q._id}>
                        <p className="font-semibold mb-2">{index + 1}. {q.text}</p>
                        <RadioGroup>
                            {q.options.map((opt, i) => (
                                <RadioGroupItem 
                                    key={i} 
                                    id={`${q._id}-${i}`} 
                                    name={q._id}
                                    value={i} 
                                    label={opt} 
                                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                />
                            ))}
                        </RadioGroup>
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSubmitQuiz} size="lg" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Quiz'}
                </Button>
            </CardFooter>
         </Card>
      )}

      {view === 'result' && result && (
          <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-3xl">Quiz Result</CardTitle>
                <CardDescription className="text-lg">Your Score: <span className="font-bold text-2xl">{result.score} / 100</span></CardDescription>
                 {result.passed ? (
                    <p className="text-green-600 mt-2">Congratulations! You have passed this module.</p>
                ) : (
                    <p className="text-orange-600 mt-2">You didn't quite reach the 90% mastery threshold. A new, simpler lesson is ready for you to review.</p>
                )}
            </CardHeader>
            <CardContent>
                <h3 className="text-xl font-semibold mb-4 text-center">Review Your Answers</h3>
                <div className="space-y-6">
                    {quizId.questions.map((q, index) => {
                        // We use optional chaining (?.) to safely access nested properties.
                        // This prevents the app from crashing if result.attempt is not yet available.
                        const studentAnswerRecord = result.attempt?.answers.find(a => a.questionId === q._id);
                        const studentChoiceIndex = studentAnswerRecord?.chosenIndex;
                        const isCorrect = studentAnswerRecord?.correct;

                        return (
                            <div key={q._id} className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                <p className="font-semibold mb-2">{index + 1}. {q.text}</p>
                                <div className="space-y-2">
                                    {q.options.map((opt, i) => {
                                        const isStudentChoice = i === studentChoiceIndex;
                                        const isCorrectChoice = i === q.correctIndex;
                                        return (
                                            <div key={i} className="flex items-center gap-2">
                                                {isStudentChoice && !isCorrect && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />}
                                                {isCorrectChoice && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                                                <Label className={`${isCorrectChoice ? 'font-bold text-green-700' : ''} ${isStudentChoice && !isCorrect ? 'line-through text-red-700' : ''}`}>
                                                    {opt}
                                                </Label>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="mt-2 p-2 bg-slate-100 rounded">
                                    <p className="text-sm font-semibold">Explanation:</p>
                                    <p className="text-sm text-slate-700">{q.explanation}</p>
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