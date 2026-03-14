import { useState } from "react";
import Login from "./Login";
import Journal from "./Journal";

export default function App() {
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem("arvyax_user_id") || "";
  });

  const handleLogin = (email: string) => {
    localStorage.setItem("arvyax_user_id", email);
    setUserId(email);
  };

  const handleSignOut = () => {
    localStorage.removeItem("arvyax_user_id");
    setUserId("");
  };

  if (!userId) return <Login onLogin={handleLogin} />;
  return <Journal userId={userId} onSignOut={handleSignOut} />;
}