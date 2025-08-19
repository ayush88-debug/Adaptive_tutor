import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import * as api from '../api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; // Correctly importing from its own file

const AttemptHistory = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?._id) return;

    const fetchHistory = async () => {
      try {
        const response = await api.getAttemptHistory(user._id);
        setAttempts(response.attempts);
      } catch (err) {
        setError('Failed to fetch your attempt history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (loading) return <div className="text-center p-8 text-slate-500">Loading History...</div>;
  if (error) return <div className="text-center p-8 text-red-500 font-semibold">{error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Quiz History</CardTitle>
        <CardDescription>A record of all your quiz attempts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="text-center">Result</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts.map((attempt) => (
              <TableRow key={attempt._id}>
                <TableCell className="font-medium">{attempt.moduleId?.title || 'Unknown Module'}</TableCell>
                <TableCell className="text-center">{attempt.score}%</TableCell>
                <TableCell className="text-center">
                  <Badge variant={attempt.passed ? "success" : "destructive"}>
                    {attempt.passed ? 'Passed' : 'Failed'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {new Date(attempt.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {attempts.length === 0 && (
          <p className="text-center text-slate-500 py-8">You have not made any quiz attempts yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AttemptHistory;