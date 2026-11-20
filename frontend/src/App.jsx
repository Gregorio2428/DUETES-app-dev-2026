import React, { useState, useEffect } from 'react';

const AUTH_URL = 'http://localhost:4000/api/auth';
const BLOG_URL = 'http://localhost:5000/api/posts';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [posts, setPosts] = useState([]);
  
  // Auth Form State
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Post Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postError, setPostError] = useState('');

  const fetchPosts = async () => {
    try {
      const res = await fetch(BLOG_URL);
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
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isRegister ? `${AUTH_URL}/register` : `${AUTH_URL}/login`;
    const payload = isRegister ? { username, email, password } : { email, password };

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
        setAuthError('Registered! Please login now.');
      } else {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostError('');
    try {
      const res = await fetch(BLOG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create post');
      setTitle('');
      setContent('');
      fetchPosts();
    } catch (err) {
      setPostError(err.message);
    }
  };

  const handleDeletePost = async (id) => {
    try {
      const res = await fetch(`${BLOG_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Final Exam - Blog Website</h1>
        {user ? (
          <div>
            <span>Welcome, <strong>{user.username}</strong> ({user.role}) </span>
            <button className="secondary" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <small>Log in to publish and manage posts</small>
        )}
      </header>

      {!user ? (
        <div className="card">
          <h2>{isRegister ? 'Register' : 'Login'}</h2>
          {authError && <div className="error-msg">{authError}</div>}
          <form onSubmit={handleAuth}>
            {isRegister && (
              <div>
                <label>Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
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
              onClick={() => { setIsRegister(!isRegister); setAuthError(''); }}
            >
              Switch to {isRegister ? 'Login' : 'Register'}
            </button>
          </form>
        </div>
      ) : (
        <div className="card">
          <h2>Create New Post</h2>
          {postError && <div className="error-msg">{postError}</div>}
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

      <h2>All Posts</h2>
      {posts.length === 0 ? (
        <p style={{ marginTop: 12 }}>No posts yet.</p>
      ) : (
        posts.map(p => (
          <div className="card" key={p.id}>
            <h3>{p.title}</h3>
            <p style={{ marginTop: 8 }}>{p.content}</p>
            <div className="meta">
              By {p.author_name || 'Anonymous'} on {new Date(p.created_at).toLocaleDateString()}
              {user && (user.id === p.author_id || user.role === 'admin') && (
                <button
                  className="danger"
                  style={{ float: 'right', padding: '4px 8px', fontSize: 12 }}
                  onClick={() => handleDeletePost(p.id)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
