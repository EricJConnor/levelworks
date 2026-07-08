import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { blogPosts } from '@/data/blogPosts';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function Blog() {
  const navigate = useNavigate();

  useDocumentMeta({
    title: 'Resources for Contractors | LevelWorks',
    description: 'Practical guides on estimates, invoicing, and getting paid faster — written for contractors, by a contractor.',
    canonicalPath: '/resources',
  });

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', color: '#e8e8e8', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <header style={{ borderBottom: '1px solid #222', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <div onClick={() => navigate('/')} style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff', cursor: 'pointer' }}>
            LEVEL<span style={{ color: '#3b82f6' }}>WORKS</span>
          </div>
          <button onClick={() => navigate('/')} style={{ color: '#a8a8a8', fontSize: '14px', fontWeight: '500', background: 'none', border: '1px solid #333', cursor: 'pointer', padding: '8px 20px', borderRadius: '6px' }}>
            Back to Home
          </button>
        </div>
      </header>

      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 24px 60px' }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '800', letterSpacing: '-1.5px', color: '#fff', marginBottom: '16px' }}>
          Resources for Contractors
        </h1>
        <p style={{ fontSize: '18px', color: '#a8a8a8', lineHeight: '1.6', maxWidth: '600px' }}>
          Practical guides on estimates, invoicing, and getting paid faster — written for contractors, by a contractor.
        </p>
      </section>

      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {blogPosts.map((post) => (
          <button
            key={post.slug}
            onClick={() => navigate(`/resources/${post.slug}`)}
            style={{
              textAlign: 'left',
              background: '#0f0f0f',
              border: '1px solid #1a1a1a',
              borderRadius: '12px',
              padding: '28px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div>
              <p style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{post.readTime}</p>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>{post.title}</h2>
              <p style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '1.6' }}>{post.description}</p>
            </div>
            <ChevronRight size={20} style={{ color: '#3b82f6', flexShrink: 0 }} />
          </button>
        ))}
      </section>

      <footer style={{ background: '#050505', borderTop: '1px solid #111', padding: '48px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>LEVEL<span style={{ color: '#3b82f6' }}>WORKS</span></div>
          <p style={{ color: '#333', fontSize: '12px' }}>© 2025 LevelWorks. Built for the trades.</p>
        </div>
      </footer>
    </div>
  );
}
