import { Routes, Route } from 'react-router-dom'
import TaskList from './pages/TaskList'
import TaskDetail from './pages/TaskDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><TaskList /></PrivateRoute>} />
      <Route path="/tasks/:id" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
    </Routes>
  )
}
