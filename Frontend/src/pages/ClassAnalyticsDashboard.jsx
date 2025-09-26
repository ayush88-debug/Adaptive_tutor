import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Users, BookOpen, Target, CheckCircle } from 'lucide-react';

const ClassAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [challengingModules, setChallengingModules] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [analyticsData, subjectsData, challengingModulesData] = await Promise.all([
          api.getClassAnalytics(),
          api.getSubjects(),
          api.getChallengingModules() 
        ]);
        setAnalytics(analyticsData);
        setSubjects(subjectsData.subjects);
        setChallengingModules(challengingModulesData.challengingModules);
      } catch (err) {
        setError('Failed to fetch initial dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleSubjectChange = async (subjectId) => {
    setSelectedSubject(subjectId);
    try {
      // If 'all' is selected, call the API with an empty string
      const apiSubjectId = subjectId === 'all' ? '' : subjectId;
      const data = await api.getChallengingModules(apiSubjectId);
      setChallengingModules(data.challengingModules);
    } catch (err) {
      console.error("Failed to fetch challenging modules for subject:", err);
      setError("Failed to load module data for the selected subject.");
    }
  };
  
  if (loading) return <div className="text-center p-8 text-slate-500">Loading Analytics...</div>;
  if (error) return <div className="text-center p-8 text-red-500 font-semibold">{error}</div>;
  if (!analytics) return null;

  const { kpis, performanceDistribution, subjectPerformance, performanceOverTime } = analytics;
  
  const distributionData = [
    { name: 'Mastery (>90%)', value: performanceDistribution.mastery },
    { name: 'Proficient (70-89%)', value: performanceDistribution.proficient },
    { name: 'Needs Improvement (<70%)', value: performanceDistribution.needsImprovement },
  ];
  const COLORS = ['#16a34a', '#f59e0b', '#dc2626'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Class Dashboard</h1>
        <p className="text-slate-500">An overview of your class's performance and learning trends.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Students</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{kpis.totalStudents}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Subjects</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{kpis.totalSubjects}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Attempts</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{kpis.totalAttempts}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Overall Avg. Score</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{kpis.overallAverageScore}%</div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader><CardTitle>Class Performance Over Time</CardTitle><CardDescription>Average quiz score of the entire class per day.</CardDescription></CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={performanceOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="averageScore" name="Average Score" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Subject Performance</CardTitle><CardDescription>Average scores and pass rates per subject.</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-right">Avg. Score</TableHead><TableHead className="text-right">Pass Rate</TableHead></TableRow></TableHeader>
              <TableBody>
                {subjectPerformance.map(sub => (
                  <TableRow key={sub.subjectId}><TableCell>{sub.subjectTitle}</TableCell><TableCell className="text-right font-medium">{sub.averageScore}%</TableCell><TableCell className="text-right font-medium">{sub.passRate}%</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Overall Performance</CardTitle><CardDescription>Distribution of all quiz attempts.</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {distributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Most Challenging Modules</CardTitle>
                    <CardDescription>Modules with the lowest average scores.</CardDescription>
                </div>
                <Select onValueChange={handleSubjectChange} defaultValue="all">
                    <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Filter by Subject" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map(subject => (
                            <SelectItem key={subject._id} value={subject._id}>{subject.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={challengingModules} layout="vertical" margin={{ left: 120 }}>
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="title" width={150} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `${Math.round(value)}%`} />
              <Legend />
              <Bar dataKey="averageScore" name="Average Score" fill="#3b82f6" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassAnalyticsDashboard;