import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, ListingProvider } from './context';
import { AuthProvider, ProtectedRoute } from './auth';
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
  VerifyEmail,
  Report,
  Landing,
  Hero,
} from './pages';

function BrowseRedirect() {
  const location = useLocation();
  return <Navigate to={`/listings${location.search}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ListingProvider>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                {/* Public Marketplace Pages */}
                <Route index element={<Home />} />
                <Route path="landing" element={<Landing />} />
                <Route path="hero" element={<Hero />} />
                <Route path="listings" element={<Listings />} />
                <Route path="browse" element={<BrowseRedirect />} />
                <Route path="listing/:id" element={<ListingDetails />} />
                <Route path="listings/:id" element={<ListingDetails />} />

                {/* Authenticated + Verified Selling */}
                <Route
                  path="sell"
                  element={
                    <ProtectedRoute requireVerified>
                      <SellItem />
                    </ProtectedRoute>
                  }
                />

                {/* Authenticated User Pages */}
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="my-listings"
                  element={
                    <ProtectedRoute requireEmailVerified>
                      <MyListings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="messages"
                  element={
                    <ProtectedRoute requireVerified>
                      <Messages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="report"
                  element={
                    <ProtectedRoute requireVerified>
                      <Report />
                    </ProtectedRoute>
                  }
                />
                <Route path="verify-email" element={<VerifyEmail />} />

                {/* Authentication Entry Pages */}
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />

                {/* Institutional / Informational Pages */}
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />

                {/* Administration (Admin Role Required) */}
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </ListingProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
