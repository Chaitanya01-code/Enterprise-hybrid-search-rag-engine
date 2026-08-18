import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminPage from './pages/AdminPage';
import UserChatPage from './pages/UserChatPage';

export const ThemeContext = createContext({ dark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

export const UserContext = createContext({ user: null, setUser: () => {} });
export const useUser = () => useContext(UserContext);

function AdminRoute({ children }) {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function UserRoute({ children }) {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

function Layout({ children }) {
  const location = useLocation();
  const hideNav = location.pathname.startsWith('/admin') || location.pathname.startsWith('/user');
  return (
    <>
      {!hideNav && <Navbar />}
      {children}
    </>
  );
}

export default function App() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark'; } catch { return false; }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  useEffect(() => {
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  useEffect(() => {
    try {
      if (user) localStorage.setItem('user', JSON.stringify(user));
      else localStorage.removeItem('user');
    } catch {}
  }, [user]);

  const toggle = () => setDark(d => !d);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <ThemeContext.Provider value={{ dark, toggle }}>
        <Router>
          <div className={`min-h-screen flex flex-col relative page-bg ${dark ? 'dark' : ''}`}>
            <div className="bg-grid-overlay" />
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <Layout>
              <main className="flex-1 relative z-10">
                <Routes>
                  <Route path="/" element={<Welcome />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  } />
                  <Route path="/user" element={
                    <UserRoute>
                      <UserChatPage />
                    </UserRoute>
                  } />
                </Routes>
              </main>
            </Layout>
          </div>
        </Router>
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}
