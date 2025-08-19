import React from "react";
import { useAuth } from "../context/AuthProvider";

export default function Home() {
  const { user, doLogout } = useAuth();
  return (
    <div style={{ maxWidth: 700, margin: "2rem auto" }}>
      <h1>Welcome, {user?.username || "Guest"}</h1>
      <p>Email: {user?.email}</p>
      <button onClick={doLogout}>Logout</button>
    </div>
  );
}
