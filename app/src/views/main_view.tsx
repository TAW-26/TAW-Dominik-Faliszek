import { Outlet } from 'react-router-dom';
import Header from '../components/header';
import './styles/main_view.css';

export default function MainView() {
  return (
    <div className="main-view-container">
      <Header />
      <div className="content-area">
        <Outlet />
      </div>
    </div>
  );
}