import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MyTasks from './pages/MyTasks'
import Team from './pages/Team'
import Assign from './pages/Assign'
import Meetings from './pages/Meetings'
import Members from './pages/Members'
import Resources from './pages/Resources'
import Profile from './pages/Profile'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<MyTasks />} />
          <Route path="/team" element={<Team />} />
          <Route path="/assign" element={<ProtectedRoute allow={['lead', 'c_level']}><Assign /></ProtectedRoute>} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/members" element={<ProtectedRoute allow={['c_level']}><Members /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
