import React from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MessageIcon from '@mui/icons-material/Message';

const Header: React.FC = () => {
  return (
    <header className="top-header">
      <div className="header-left">
        {/* Placeholder for left content like page titles or breadcrumbs */}
      </div>
      <div className="header-right">
        <button className="icon-btn" aria-label="Messages">
          <MessageIcon />
          <span className="badge">3</span>
        </button>
        <button className="icon-btn" aria-label="Notifications">
          <NotificationsIcon />
          <span className="badge">1</span>
        </button>
        <div className="user-profile">
          <img 
            src="https://i.pravatar.cc/150?img=11" 
            alt="User avatar" 
            className="avatar" 
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
