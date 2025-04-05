import Home from './Pages/Home/Home'
import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Courses from './Pages/Courses/Courses';
import Resources from './Pages/Resources/Resources';
import About from './Pages/About/About';
import CourseDetails from './Pages/CourseDetails/CourseDetails';
import LearningPage from './Pages/LearningPage/LearningPage';
import BookmarksPage from './Pages/Bookmarks/BookmarksPage';
import { NotificationProvider } from './components/ContextHooks/NotificationContext';
import Toast from './components/Notifications/Toast';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/about" element={<About />} />
          <Route path="/course/:courseName" element={<CourseDetails />} />
          <Route path="/course/:courseName/section/:sectionId" element={<LearningPage />} />
          <Route path="/profile/bookmarks" element={<BookmarksPage />} />
        </Routes>
        {/* Toast notifications appear on all pages */}
        <Toast />
      </Router>
    </NotificationProvider>
  )
}

export default App
