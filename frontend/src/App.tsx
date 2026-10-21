import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { ModelProvider } from "./context/ModelContext";
import { Navbar } from "./components/Navbar";
import { RoleGuard } from "./components/RoleGuard";
import { AIAssistantModal } from "./components/AIAssistantModal";

// Pages
import { Home } from "./pages/Home";
import { Marketplace } from "./pages/Marketplace";
import { ModelDetails } from "./pages/ModelDetails";
import { RegisterModel } from "./pages/RegisterModel";
import { CreatorDashboard } from "./pages/CreatorDashboard";
import { BuyerDashboard } from "./pages/BuyerDashboard";
import { VerifyModel } from "./pages/VerifyModel";
import { Activity } from "./pages/Activity";
import { Analytics } from "./pages/Analytics";
import { AdminDashboard } from "./pages/AdminDashboard";

function App() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <WalletProvider>
      <ModelProvider>
        <Router>
          <div className="min-h-screen bg-mp-bg text-mp-text flex flex-col font-sans selection:bg-mp-accent/20 selection:text-white editorial-grid-bg">
            <Navbar onOpenAssistant={() => setIsAssistantOpen(true)} />

            <main className="flex-1 w-full pb-16">
              <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/model/:id" element={<ModelDetails />} />

                  {/* Creator-Only Routes */}
                  <Route
                    path="/register"
                    element={
                      <RoleGuard allowedRoles={["creator"]}>
                        <RegisterModel />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <RoleGuard allowedRoles={["creator"]}>
                        <CreatorDashboard />
                      </RoleGuard>
                    }
                  />

                  {/* Buyer-Only Routes */}
                  <Route
                    path="/licenses"
                    element={
                      <RoleGuard allowedRoles={["buyer"]}>
                        <BuyerDashboard />
                      </RoleGuard>
                    }
                  />

                  {/* Admin-Only Routes */}
                  <Route
                    path="/admin"
                    element={
                      <RoleGuard allowedRoles={["admin"]}>
                        <AdminDashboard />
                      </RoleGuard>
                    }
                  />

                  {/* Shared Platform Routes */}
                  <Route path="/verify" element={<VerifyModel />} />
                  <Route path="/activity" element={<Activity />} />
                  <Route path="/analytics" element={<Analytics />} />
                </Routes>
            </main>

            <AIAssistantModal
              isOpen={isAssistantOpen}
              onClose={() => setIsAssistantOpen(false)}
            />
          </div>
        </Router>
      </ModelProvider>
    </WalletProvider>
  );
}

export default App;
