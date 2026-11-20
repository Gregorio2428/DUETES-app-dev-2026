import React, { useState, useEffect } from 'react';

const AUTH_URL = 'http://localhost:4000/api/auth';
const BLOG_URL = 'http://localhost:5000/api/posts';
const ME_POSTS_URL = 'http://localhost:5000/api/me/posts';

export default function App() {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || '');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'mine'
  
  // Auth Form State
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('reader');
  const [authMsg, setAuthMsg] = useState('');

  // Post Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postMsg, setPostMsg] = useState('');

  const fetchPosts = async () => {
    try {
      const url = activeTab === 'mine' && accessToken ? ME_POSTS_URL : BLOG_URL;
      const headers = activeTab === 'mine' && accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Failed to load posts', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab, accessToken]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthMsg('');
    const endpoint = isRegister ? `${AUTH_URL}/register` : `${AUTH_URL}/login`;
    const payload = isRegister ? { username, email, password, role } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (isRegister) {
        setIsRegister(false);
        setAuthMsg('Registered successfully! You can now log in.');
      } else {
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        setUser(data.user);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (err) {
      setAuthMsg(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await fetch(`${AUTH_URL}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      }
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setAccessToken('');
      setRefreshToken('');
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setActiveTab('all');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostMsg('');
    try {
      const res = await fetch(BLOG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ title, content })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create post');
      setTitle('');
      setContent('');
      setPostMsg('Post published!');
      fetchPosts();
    } catch (err) {
      setPostMsg(err.message);
    }
  };

  const handleDeletePost = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`${BLOG_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      fetchPosts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container">
      <header>
        <div>
          <h1>Final Exam - Blog Website</h1>
          <small>Express + MariaDB + React</small>
        </div>
        {user ? (
          <div>
            <span>Welcome, <strong>{user.username}</strong> (<em style={{ color: '#2563eb' }}>{user.role}</em>) </span>
            <button className="secondary" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <small>Log in to publish or manage posts</small>
        )}
      </header>

      {!user ? (
        <div className="card">
          <h2>{isRegister ? 'Register' : 'Login'}</h2>
          {authMsg && <div className="error-msg">{authMsg}</div>}
          <form onSubmit={handleAuth}>
            {isRegister && (
              <>
                <div>
                  <label>Username</label>
                  <input value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div>
                  <label>Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '10px 12px', marginBottom: 12 }}>
                    <option value="reader">Reader</option>
                    <option value="author">Author</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit">{isRegister ? 'Sign Up' : 'Log In'}</button>
            <button
              type="button"
              className="secondary"
              style={{ marginLeft: 8 }}
              onClick={() => { setIsRegister(!isRegister); setAuthMsg(''); }}
            >
              Switch to {isRegister ? 'Login' : 'Register'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Post Creation (Allowed for author and admin) */}
          {['author', 'admin'].includes(user.role) && (
            <div className="card">
              <h2>Create New Post</h2>
              {postMsg && <div className="error-msg">{postMsg}</div>}
              <form onSubmit={handleCreatePost}>
                <div>
                  <label>Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div>
                  <label>Content</label>
                  <textarea rows={4} value={content} onChange={e => setContent(e.target.value)} required />
                </div>
                <button type="submit">Publish Post</button>
              </form>
            </div>
          )}

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              className={activeTab === 'all' ? '' : 'secondary'}
              onClick={() => setActiveTab('all')}
            >
              All Posts
            </button>
            <button
              className={activeTab === 'mine' ? '' : 'secondary'}
              onClick={() => setActiveTab('mine')}
            >
              My Posts (GET /api/me/posts)
            </button>
          </div>
        </>
      )}

      <h2>{activeTab === 'mine' ? 'My Posts' : 'All Posts'}</h2>
      {posts.length === 0 ? (
        <p style={{ marginTop: 12 }}>No posts found.</p>
      ) : (
        posts.map(p => (
          <div className="card" key={p.id}>
            <h3>{p.title}</h3>
            <p style={{ marginTop: 8 }}>{p.content}</p>
            <div className="meta">
              By <strong>{p.author_name || 'Author'}</strong> on {new Date(p.created_at).toLocaleDateString()}
              {/* Delete is restricted to admin by exam rubric */}
              {user && user.role === 'admin' && (
                <button
                  className="danger"
                  style={{ float: 'right', padding: '4px 8px', fontSize: 12 }}
                  onClick={() => handleDeletePost(p.id)}
                >
                  Delete (Admin)
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
