import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardHome from './pages/DashboardHome';
import Customers from './pages/Customers';
import Mails from './pages/Mails';
import Deals from './pages/Deals';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import { DashboardProvider } from './context/DashboardContext';

// Wrapper component for the protected dashboard area
const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Map current path to sidebar active state
    const getActiveTab = (pathname: string): string => {
        if (pathname === '/' || pathname === '') return 'Home';
        if (pathname.includes('/customers')) return 'Customers';
        if (pathname.includes('/mails')) return 'Mails';
        if (pathname.includes('/deals')) return 'Deals';
        if (pathname.includes('/tasks')) return 'Tasks';
        if (pathname.includes('/analytics')) return 'Analytics';
        if (pathname.includes('/settings')) return 'Settings';
        return 'Home';
    };

    const activeTab = getActiveTab(location.pathname);

    const handleNavigation = (tabName: string): void => {
        switch (tabName) {
            case 'Home': navigate('/'); break;
            case 'Mails': navigate('/mails'); break;
            case 'Customers': navigate('/customers'); break;
            case 'Deals': navigate('/deals'); break;
            case 'Tasks': navigate('/tasks'); break;
            case 'Analytics': navigate('/analytics'); break;
            case 'Settings': navigate('/settings'); break;
            default: navigate('/');
        }
    };

    return (
        <div className="bg-background h-screen w-screen font-sans text-text-main selection:bg-primary/30 flex overflow-hidden">
            <div className="flex-none">
                <Sidebar active={activeTab} setActive={handleNavigation} />
            </div>

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Scrollable Content Container */}
                <div className="flex-1 overflow-y-auto w-full">
                    <Header />

                    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full pb-20 min-h-[calc(100vh-80px)]">
                        <Routes>
                            <Route path="/" element={<DashboardHome />} />
                            <Route path="/mails" element={<Mails />} />
                            <Route path="/customers" element={<Customers />} />
                            <Route path="/deals" element={<Deals />} />
                            <Route path="/tasks" element={<Tasks />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<DashboardHome />} />
                        </Routes>
                    </div>
                </div>
            </main>
        </div>
    );
};

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const App: React.FC = () => {
    return (
        <Router>
            <DashboardProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/*" element={
                        <RequireAuth>
                            <DashboardLayout />
                        </RequireAuth>
                    } />
                </Routes>
            </DashboardProvider>
        </Router>
    );
};

export default App;
