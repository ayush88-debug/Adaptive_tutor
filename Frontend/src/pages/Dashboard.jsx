import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/authSlice";

export default function Dashboard() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="authwrap">
      <h2>Dashboard</h2>
      <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(user, null, 2)}
      </pre>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}