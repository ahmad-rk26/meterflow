import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Pricing from './pages/Pricing';
import Apis from './pages/Apis';
import ApiKeys from './pages/ApiKeys';
import Usage from './pages/Usage';
import Billing from './pages/Billing';
import Landing from './pages/Landing';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';

function App() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/" element={<Landing />} />
                    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/apis" element={<PrivateRoute><Apis /></PrivateRoute>} />
                    <Route path="/keys" element={<PrivateRoute><ApiKeys /></PrivateRoute>} />
                    <Route path="/usage" element={<PrivateRoute><Usage /></PrivateRoute>} />
                    <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
                    <Route path="/pricing" element={<PrivateRoute><Pricing /></PrivateRoute>} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
}

export default App;