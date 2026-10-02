import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, ListingProvider } from './context';
import MainLayout from './layouts/MainLayout';
import {
  Home,
  Listings,
  ListingDetails,
  Login,
  Register,
  SellItem,
  Profile,
  MyListings,
  Messages,
  AdminDashboard,
  NotFound,
  About,
  Contact,
  Privacy,
  Terms,
} from './pages';

function BrowseRedirect() {
  const location = useLocation();
  return <Navigate to={`/listings${location.search}`} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ListingProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
          {/* Main Marketplace Pages */}
          <Route index element={<Home />} />
          <Route path="listings" element={<Listings />} />
          <Route path="browse" element={<BrowseRedirect />} />
          <Route path="listing/:id" element={<ListingDetails />} />
          <Route path="listings/:id" element={<ListingDetails />} />
          <Route path="sell" element={<SellItem />} />
          
          {/* User & Communication Pages */}
          <Route path="profile" element={<Profile />} />
          <Route path="my-listings" element={<MyListings />} />
          <Route path="messages" element={<Messages />} />

          {/* Authentication Pages */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* Institutional / Informational Pages */}
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />

          {/* Administration */}
          <Route path="admin" element={<AdminDashboard />} />

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ListingProvider>
    </ThemeProvider>
  );
}
