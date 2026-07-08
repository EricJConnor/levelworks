import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { blogPosts } from '@/data/blogPosts';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = blogPosts.find((p) => p.slug === slug);

  useDocumentMeta(
    post
      ? { title: `${post.title} | LevelWorks`, description: post.description, canonicalPath: `/resources/${post.slug}` }
      : { title: 'levelworks.org', description: 'Professional estimates, invoices, job tracking, and AI assistant for contractors.', canonicalPath: '/resources' }
  );

  if (!post) return <Navigate to="/resources" replace />;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', color: '#e8e8e8', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <header style={{ borderBottom: '1px solid #222', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <div onClick={() => navigate('/')} style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff', cursor: 'pointer' }}>
            LEVEL<span style={{ color: '#3b82f6' }}>WORKS</span>
          </div>
          <button onClick={() => navigate('/resources')} style={{ color: '#a8a8a8', fontSize: '14px', fontWeight: '500', background: 'none', border: '1px solid #333', cursor: 'pointer', padding: '8px 20px', borderRadius: '6px' }}>
            All Resources
          </button>
        </div>
      </header>

      <article style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 24px 60px' }}>
        <p style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>{post.readTime}</p>
        <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: '800', letterSpacing: '-1px', color: '#fff', marginBottom: '32px', lineHeight: '1.15' }}>
          {post.title}
        </h1>
        {post.paragraphs.map((p, i) => (
          <div key={i} style={{ marginBottom: '28px' }}>
            {p.heading && (
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>{p.heading}</h2>
            )}
            <p style={{ color: '#a8a8a8', fontSize: '16px', lineHeight: '1.8' }}>{p.text}</p>
          </div>
        ))}

        <div style={{ marginTop: '48px', background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
          <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Ready to send estimates like this?</h3>
          <p style={{ color: '#93c5fd', fontSize: '15px', marginBottom: '24px' }}>Start your free 30-day trial. No credit card required.</p>
          <button onClick={() => navigate('/')} style={{ background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', padding: '14px 32px', borderRadius: '6px', fontSize: '15px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Get Started Free <ChevronRight size={18} />
          </button>
        </div>
      </article>

      <footer style={{ background: '#050505', borderTop: '1px solid #111', padding: '48px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>LEVEL<span style={{ color: '#3b82f6' }}>WORKS</span></div>
          <p style={{ color: '#333', fontSize: '12px' }}>© 2025 LevelWorks. Built for the trades.</p>
        </div>
      </footer>
    </div>
  );
}
