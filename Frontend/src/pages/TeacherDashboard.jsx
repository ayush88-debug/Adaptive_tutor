import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress"; // A nice progress bar component

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentsProgress = async () => {
      try {
        const response = await api.getStudentsProgress();
        // Sort students by username for a consistent order
        const sortedStudents = response.students.sort((a, b) => 
          a.student.username.localeCompare(b.student.username)
        );
        setStudents(sortedStudents);
      } catch (err) {
        setError('Failed to fetch student progress. You may not have teacher permissions.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsProgress();
  }, []);

  if (loading) return <div className="text-center p-8 text-slate-500">Loading Student Progress...</div>;
  if (error) return <div className="text-center p-8 text-red-500 font-semibold">{error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Dashboard</CardTitle>
        <CardDescription>Overview of all student progress.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Student</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Modules Passed</TableHead>
              <TableHead className="text-center">Attempts</TableHead>
              <TableHead className="text-right">Average Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map(({ student, attemptsCount, avgScore, passedModulesCount }) => (
              <TableRow key={student._id}>
                <TableCell className="font-medium">{student.username}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell className="text-center">{passedModulesCount}</TableCell>
                <TableCell className="text-center">{attemptsCount}</TableCell>
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <span>{avgScore}%</span>
                        <Progress value={avgScore} className="w-[100px]" />
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {students.length === 0 && (
            <p className="text-center text-slate-500 py-8">No student data to display yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TeacherDashboard;