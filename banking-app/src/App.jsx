import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./routes/ProtectedRoute";
import "../src/i18n/index.js";

// Auth pages
const Login = lazy(() => import("./pages/auth/LoginPage"));
const Register = lazy(() => import("./pages/auth/RegisterPage"));

// User pages
const Dashboard = lazy(() => import("./pages/user/DashboardPage"));
const Transfer = lazy(() => import("./pages/user/TransferPage"));
const History = lazy(() => import("./pages/user/HistoryPage"));
const Profile = lazy(() => import("./pages/user/ProfilePage"));
const WithdrawalPage = lazy(() => import("./pages/user/WithdrawalPage"));
const TradingPage = lazy(() => import("./pages/user/TradingPage"));
import LoansPage from "./pages/user/LoansPage";
import InvestmentPage from "./pages/user/InvestmentPage";
import DepositPage from "./pages/user/DepositPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminTransactions = lazy(() => import("./pages/admin/AdminTransactions"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminFund = lazy(() => import("./pages/admin/AdminFund"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
import AdminTrades from "./pages/admin/AdminTrades";
import AdminDeposits from "./pages/admin/AdminDeposits";
import AdminChats from "./pages/admin/AdminChats";

const Loader = () => (
  <div className="flex items-center justify-center h-screen bg-surface-50">
    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      {/* <BrowserRouter> */}
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* User (protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfer"
            element={
              <ProtectedRoute>
                <Transfer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/withdrawal"
            element={
              <ProtectedRoute>
                <WithdrawalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trading"
            element={
              <ProtectedRoute>
                <TradingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans"
            element={
              <ProtectedRoute>
                <LoansPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investment"
            element={
              <ProtectedRoute>
                <InvestmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deposit"
            element={
              <ProtectedRoute>
                <DepositPage />
              </ProtectedRoute>
            }
          />

          {/* Admin (admin-only) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminRoute>
                <AdminTransactions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminSettings />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/fund"
            element={
              <AdminRoute>
                <AdminFund />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/withdrawals"
            element={
              <AdminRoute>
                <AdminWithdrawals />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/trades"
            element={
              <AdminRoute>
                <AdminTrades />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/deposits"
            element={
              <AdminRoute>
                <AdminDeposits />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/chats"
            element={
              <AdminRoute>
                <AdminChats />
              </AdminRoute>
            }
          />
        </Routes>
      </Suspense>
      {/* </BrowserRouter> */}
    </AuthProvider>
  );
}
