import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from 'lucide-react'; // For a nice checkmark icon

const SubjectDashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const subjectsResponse = await api.getSubjects();
      const fetchedSubjects = subjectsResponse.subjects;
      setSubjects(fetchedSubjects);

      // For each subject, fetch the student's progress
      const progressPromises = fetchedSubjects.map(s =>
        api.getStudentProgress(s._id).catch(() => null) // Return null if not enrolled
      );
      const progressResults = await Promise.all(progressPromises);
      
      const progressMap = {};
      progressResults.forEach(p => {
        if (p && p.progress) {
          progressMap[p.progress.subjectId] = p.progress.completedModules.map(m => m._id);
        }
      });
      setProgress(progressMap);

    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleEnroll = async (subjectId) => {
    try {
        await api.enrollInSubject(subjectId);
        // Refresh data to show the new progress state
        fetchDashboardData();
    } catch (err) {
        alert("Failed to enroll. Please try again.");
    }
  };

  if (loading) return <div className="text-center p-8 text-slate-500">Loading Dashboard...</div>;
  if (error) return <div className="text-center p-8 text-red-500 font-semibold">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-slate-800">Subjects Dashboard</h1>
      <div className="space-y-8">
        {subjects.map((subject) => {
          const isEnrolled = !!progress[subject._id];
          const completedModules = progress[subject._id] || [];

          return (
            <Card key={subject._id}>
              <CardHeader>
                <CardTitle>{subject.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {subject.modules.map((module) => {
                    const isCompleted = completedModules.includes(module._id);
                    return (
                      <li key={module._id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                          )}
                          <span className={`font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {module.order}. {module.title}
                          </span>
                        </div>
                        <Link to={`/module/${module._id}`}>
                          <Button disabled={!isEnrolled}>
                            {isCompleted ? 'Review' : 'Start Module'}
                          </Button>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
              {!isEnrolled && (
                <CardFooter>
                    <Button onClick={() => handleEnroll(subject._id)} className="bg-green-600 hover:bg-green-700">
                        Enroll in Course
                    </Button>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectDashboard;