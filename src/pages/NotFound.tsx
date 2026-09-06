import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div
      className="lv-app"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div className="lv-empty" style={{ maxWidth: 420, width: '100%' }}>
        <FileQuestion size={30} />
        <h3>Page not found</h3>
        <p>That link doesn’t go anywhere. Your account and your work are still here.</p>
        <div className="lv-inline" style={{ justifyContent: 'center' }}>
          <a className="lv-btn pri" href="/dashboard">Go to your dashboard</a>
          <a className="lv-btn quiet" href="/">Back to home</a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
