import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthView from './views/auth_view';
import MainView from './views/main_view';
import MapComponent from './components/map';
import StationManagement from './components/station_management';
import DeviceManagement from './components/device_management';
import GlobalHistory from './components/global_history';
import { AuthGuard } from './guard/auth_guard';

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return user.role === 'admin' ? <Navigate to="/admin/stations" /> : <Navigate to="/map" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<AuthView />} />

          <Route element={<AuthGuard />}>
            <Route element={<MainView />}>
              <Route element={<AuthGuard allowedRoles={['user']} />}>
                <Route path="/map" element={<MapComponent />} />
              </Route>

              <Route element={<AuthGuard allowedRoles={['admin']} />}>
                <Route path="/admin/stations" element={<StationManagement />} />
                <Route path="/admin/fleet" element={<DeviceManagement />} />
                <Route path="/admin/history" element={<GlobalHistory />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;