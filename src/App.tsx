import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage2 from './components/LandingPage2';
import { AuthProvider } from './providers/Auth';

function App() {
  return (
    <div className="min-h-screen bg-black">
      {/* <LandingPage /> */}
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <AuthProvider>
                <LandingPage2 />
              </AuthProvider>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
