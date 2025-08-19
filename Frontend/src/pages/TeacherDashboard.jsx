import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const TeacherDashboard = () => {
  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentsProgress = async () => {
      try {
        const response = await api.getStudentsProgress();
        const sorted = response.students.sort((a, b) => 
          a.student.username.localeCompare(b.student.username)
        );
        setStudentData(sorted);
      } catch (err) {
        setError('Failed to fetch student progress.');
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
        <CardDescription>Overview of all student progress by subject.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {studentData.map(({ student, progress }) => (
            <AccordionItem value={student._id} key={student._id}>
              <AccordionTrigger>
                <div className="flex flex-col text-left">
                    <span className="font-semibold text-base">{student.username}</span>
                    <span className="font-normal text-sm text-slate-500">{student.email}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {progress.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">Progress</TableHead>
                        <TableHead className="text-center">Attempts</TableHead>
                        <TableHead className="text-right">Average Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {progress.map((p) => (
                        <TableRow key={p.subjectId}>
                          <TableCell className="font-medium">{p.subjectTitle}</TableCell>
                          <TableCell className="text-center">
                            {p.passedModulesCount} / {p.totalModulesCount}
                          </TableCell>
                          <TableCell className="text-center">{p.attemptsCount}</TableCell>
                          <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                  <span>{p.avgScore}%</span>
                                  <Progress value={p.avgScore} className="w-[100px]" />
                              </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-slate-500 py-4">This student has not enrolled in any subjects yet.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {studentData.length === 0 && (
          <p className="text-center text-slate-500 py-8">No student data to display yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TeacherDashboard;