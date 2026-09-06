import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion } from "lucide-react";
import { useT } from '@/i18n';

const NotFound = () => {
  const location = useLocation();
  const t = useT();

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
        <h3>{t('pg.nf.title')}</h3>
        <p>{t('pg.nf.body')}</p>
        <div className="lv-inline" style={{ justifyContent: 'center' }}>
          <a className="lv-btn pri" href="/dashboard">{t('pg.nf.dashboard')}</a>
          <a className="lv-btn quiet" href="/">{t('gate.backHome')}</a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
