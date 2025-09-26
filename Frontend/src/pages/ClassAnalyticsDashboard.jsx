import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, Target, CheckCircle } from 'lucide-react';

const ClassAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.getClassAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError('Failed to fetch class analytics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="text-center p-8 text-slate-500">Loading Analytics...</div>;
  if (error) return <div className="text-center p-8 text-red-500 font-semibold">{error}</div>;
  if (!analytics) return null;

  const { kpis, performanceDistribution, subjectPerformance, challengingModules } = analytics;
  
  const distributionData = [
    { name: 'Mastery (>90%)', value: performanceDistribution.mastery },
    { name: 'Proficient (70-89%)', value: performanceDistribution.proficient },
    { name: 'Needs Improvement (<70%)', value: performanceDistribution.needsImprovement },
  ];
  const COLORS = ['#16a34a', '#f59e0b', '#dc2626'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Class Dashboard</h1>
        <p className="text-slate-500">An overview of your class's performance.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle>Total Students</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold flex items-center"><Users className="mr-2 h-6 w-6 text-blue-500"/>{kpis.totalStudents}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Total Subjects</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold flex items-center"><BookOpen className="mr-2 h-6 w-6 text-green-500"/>{kpis.totalSubjects}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Total Attempts</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold flex items-center"><Target className="mr-2 h-6 w-6 text-orange-500"/>{kpis.totalAttempts}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Avg. Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold flex items-center"><CheckCircle className="mr-2 h-6 w-6 text-indigo-500"/>{kpis.overallAverageScore}%</p></CardContent></Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        {/* Subject Performance */}
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Subject Performance</CardTitle><CardDescription>Average scores and pass rates per subject.</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-right">Avg. Score</TableHead><TableHead className="text-right">Pass Rate</TableHead></TableRow></TableHeader>
              <TableBody>
                {subjectPerformance.map(sub => (
                  <TableRow key={sub.subjectId}><TableCell>{sub.subjectTitle}</TableCell><TableCell className="text-right">{sub.averageScore}%</TableCell><TableCell className="text-right">{sub.passRate}%</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Overall Performance</CardTitle><CardDescription>Distribution of all quiz attempts.</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {distributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Challenging Modules */}
      <Card>
        <CardHeader><CardTitle>Most Challenging Modules</CardTitle><CardDescription>Top 5 modules with the lowest average scores across all students.</CardDescription></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={challengingModules} layout="vertical" margin={{ left: 100 }}>
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="title" width={150} />
              <Tooltip formatter={(value) => `${Math.round(value)}%`} />
              <Legend />
              <Bar dataKey="averageScore" name="Average Score" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassAnalyticsDashboard;