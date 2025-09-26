import React from 'react';
import { Outlet } from 'react-router-dom';
import TeacherSidebar from '../components/TeacherSidebar';

const TeacherLayout = () => {
  return (
    <div className="flex">
      <TeacherSidebar />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default TeacherLayout;