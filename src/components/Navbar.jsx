import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusSquare, User, Users, Shield, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user } = useAuth();

    return (
        <nav className="bottom-nav">
            <NavLink to="/home" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Home size={24} />
                <span>Home</span>
            </NavLink>
            <NavLink to="/community" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Users size={24} />
                <span>Community</span>
            </NavLink>
            <NavLink to="/organizations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Building size={24} />
                <span>Clubs</span>
            </NavLink>
            <NavLink to="/add" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <PlusSquare size={24} />
                <span>Add</span>
            </NavLink>
            {user?.isAdmin && (
                <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Shield size={24} />
                    <span>Admin</span>
                </NavLink>
            )}
            <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <User size={24} />
                <span>Profile</span>
            </NavLink>
        </nav>
    );
};

export default Navbar;
