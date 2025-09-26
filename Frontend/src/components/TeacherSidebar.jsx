import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users } from 'lucide-react';

const TeacherSidebar = () => {
  const commonClasses = "flex items-center px-4 py-2 text-sm font-medium rounded-md";
  const activeClass = "bg-blue-100 text-blue-700";
  const inactiveClass = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

  return (
    <aside className="w-64 bg-white border-r p-4">
      <nav className="space-y-2">
        <NavLink
          to="/teacher/dashboard"
          className={({ isActive }) => `${commonClasses} ${isActive ? activeClass : inactiveClass}`}
        >
          <LayoutDashboard className="mr-3 h-5 w-5" />
          Dashboard
        </NavLink>
        <NavLink
          to="/teacher/students"
          className={({ isActive }) => `${commonClasses} ${isActive ? activeClass : inactiveClass}`}
        >
          <Users className="mr-3 h-5 w-5" />
          Students
        </NavLink>
      </nav>
    </aside>
  );
};

export default TeacherSidebar;