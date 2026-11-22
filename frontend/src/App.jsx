import React, { useState, useEffect } from 'react';

const AUTH_URL = 'http://localhost:4000/api/auth';
const BLOG_URL = 'http://localhost:5000/api/posts';
const ME_POSTS_URL = 'http://localhost:5000/api/me/posts';

export default function App() {
  // Authentication & Session State
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || '');
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Post & View State
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'mine'
  const [readingPost, setReadingPost] = useState(null); // full single-post view
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Auth Form State
  const [showAuthDesk, setShowAuthDesk] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('reader');
  const [authMsg, setAuthMsg] = useState({ text: '', type: '' });

  // Drafting Desk State (Author & Admin)
  const [showDraftDesk, setShowDraftDesk] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [postMsg, setPostMsg] = useState({ text: '', type: '' });
  const [isPublishing, setIsPublishing] = useState(false);

  // Admin Deletion Confirmation Modal State
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const authenticatedFetch = async (url, options = {}) => {
    const sendWithToken = (token) => fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` }
    });

    let response = await sendWithToken(accessToken);
    if (response.status !== 401 || !refreshToken) return response;

    try {
      const refreshResponse = await fetch(`${AUTH_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (!refreshResponse.ok) throw new Error('Session expired');

      const data = await refreshResponse.json();
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      return await sendWithToken(data.accessToken);
    } catch {
      setAccessToken('');
      setRefreshToken('');
      setUser(null);
      setActiveTab('all');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return response;
    }
  };

  // Fetch posts from API (all or current user's posts)
  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const isMine = activeTab === 'mine' && accessToken;
      const url = isMine ? ME_POSTS_URL : BLOG_URL;
      const headers = isMine ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = isMine
        ? await authenticatedFetch(url, { headers })
        : await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load dispatches', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab, accessToken]);

  // Read full single-post via /api/posts/:id
  const handleOpenSinglePost = async (postSummary) => {
    try {
      const res = await fetch(`${BLOG_URL}/${postSummary.id}`);
      if (res.ok) {
        const fullPost = await res.json();
        setReadingPost(fullPost);
      } else {
        setReadingPost(postSummary);
      }
    } catch {
      setReadingPost(postSummary);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth handler (Login / Register)
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthMsg({ text: '', type: '' });
    const endpoint = isRegister ? `${AUTH_URL}/register` : `${AUTH_URL}/login`;
    const payload = isRegister
      ? { username, email, password, role }
      : { identifier: loginIdentifier, password };

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
        setAuthMsg({
          text: 'Credentials issued successfully. You may now sign in to your desk.',
          type: 'success'
        });
      } else {
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        setUser(data.user);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setShowAuthDesk(false);
        setAuthMsg({ text: '', type: '' });
      }
    } catch (err) {
      setAuthMsg({ text: err.message, type: 'error' });
    }
  };

  // Logout handler
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
      setReadingPost(null);
      setShowDraftDesk(false);
    }
  };

  const canEditPost = (post) => Boolean(
    user && (user.role === 'admin' || user.username === post.author_name)
  );

  const startNewPost = () => {
    setEditingPost(null);
    setTitle('');
    setContent('');
    setPostMsg({ text: '', type: '' });
    setShowDraftDesk(true);
  };

  const startEditingPost = (post) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setPostMsg({ text: '', type: '' });
    setReadingPost(null);
    setShowDraftDesk(true);
  };

  const cancelDraft = () => {
    setEditingPost(null);
    setTitle('');
    setContent('');
    setShowDraftDesk(false);
  };

  // Create or update a post
  const handleSavePost = async (e) => {
    e.preventDefault();
    setPostMsg({ text: '', type: '' });
    setIsPublishing(true);

    try {
      const res = await authenticatedFetch(
        editingPost ? `${BLOG_URL}/${editingPost.id}` : BLOG_URL,
        {
        method: editingPost ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content })
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save dispatch');

      setTitle('');
      setContent('');
      setEditingPost(null);
      setShowDraftDesk(false);
      setPostMsg({
        text: editingPost ? 'Dispatch updated successfully.' : 'Dispatch published to the public record.',
        type: 'success'
      });
      fetchPosts();
      setTimeout(() => setPostMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setPostMsg({ text: err.message || 'Failed to save dispatch', type: 'error' });
    } finally {
      setIsPublishing(false);
    }
  };

  // Delete post handler (Admin only)
  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);

    try {
      const res = await authenticatedFetch(`${BLOG_URL}/${postToDelete.id}`, {
        method: 'DELETE',
        headers: {}
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove dispatch');

      if (readingPost && readingPost.id === postToDelete.id) {
        setReadingPost(null);
      }
      setPostToDelete(null);
      fetchPosts();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helpers
  const calculateReadingTime = (text) => {
    if (!text) return '1 min read';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 190));
    return `${minutes} min read`;
  };

  const formatEditorialDate = (dateString) => {
    if (!dateString) return 'Undated';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRoleBadge = (roleName) => {
    const r = (roleName || 'reader').toLowerCase();
    if (r === 'admin') return <span className="badge badge-admin">Admin</span>;
    if (r === 'author') return <span className="badge badge-author">Author</span>;
    return <span className="badge badge-reader">Reader</span>;
  };

  const draftWordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const draftEstTime = calculateReadingTime(content);

  const formattedMastheadDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="broadsheet-container">
      {/* Integrated Editorial Broadsheet Masthead */}
      <header className="masthead">
        <div className="masthead-frame">
          {/* Inner terracotta accent rule rendered via CSS ::before */}

          {/* Flanking Masthead "Ears" (Newspaper Style) */}
          <div className="masthead-ears-row">
            {/* Left Ear: Date + Weather */}
            <div className="masthead-ear ear-left">
              <div className="ear-headline">{formattedMastheadDate}</div>
              <div className="ear-sub">Global Edition · Weather: Clear</div>
            </div>

            {/* Center: SVG Editorial Press Seal / Fountain Pen Crest */}
            <div className="masthead-crest-wrapper">
              <svg className="press-crest-svg" width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Editorial Press Seal">
                {/* Outer ring */}
                <circle cx="28" cy="28" r="26" stroke="#d97706" strokeWidth="2" fill="none" />
                <circle cx="28" cy="28" r="22" stroke="#c2410c" strokeWidth="1" fill="#faf8f5" />
                {/* Fountain pen nib */}
                <path d="M28 12 L26 28 L28 42 L30 28 Z" fill="#090d16" />
                <path d="M24 26 L28 32 L32 26" stroke="#c2410c" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* Ink dot */}
                <circle cx="28" cy="20" r="2" fill="#d97706" />
                {/* Decorative serifs */}
                <line x1="22" y1="38" x2="34" y2="38" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="24" y1="41" x2="32" y2="41" stroke="#c2410c" strokeWidth="0.8" strokeLinecap="round" />
              </svg>
              <span className="crest-est-label">Est. 2026</span>
            </div>
          </div>

          {/* Central Brand & Title with Flanking Ornamental Rules */}
          <div className="masthead-brand">
            <div className="masthead-title-container">
              <div className="masthead-flank-rule rule-left">
                <span className="flank-diamond">✦</span>
              </div>
              <h1 className="masthead-title">The Dispatch</h1>
              <div className="masthead-flank-rule rule-right">
                <span className="flank-diamond">✦</span>
              </div>
            </div>

            {/* Engraved Tagline Ribbon */}
            <div className="masthead-tagline-wrapper">
              <span className="masthead-tagline-ribbon">
                Final Exam Chronicle · Independent Essays, Dispatches & Peer Critiques
              </span>
            </div>
          </div>

          {/* Account Action Bar */}
          <div className="masthead-live-bar">
            <div className="masthead-docked-actions">
              {user ? (
                <>
                  <div className="user-docked-meta">
                    <span>Signed in as <strong>{user.username}</strong></span>
                    {getRoleBadge(user.role)}
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <span className="guest-docked-label">Reader Edition · Public Access</span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setShowAuthDesk(!showAuthDesk);
                      setAuthMsg({ text: '', type: '' });
                    }}
                  >
                    {showAuthDesk ? 'Close Press Desk' : 'Sign In / Register'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Guest Authentication Desk */}
      {!user && showAuthDesk && (
        <section className="auth-slip" aria-labelledby="auth-slip-title">
          <div className="auth-slip-header">
            <h2 id="auth-slip-title" className="auth-slip-title">
              {isRegister ? 'Register for Press Credentials' : 'Sign In to Your Desk'}
            </h2>
            <p className="auth-slip-subtitle">
              {isRegister
                ? 'Select your designation to begin reading, writing, or editing dispatches.'
                : 'Access your authoring desk or subscription preferences.'}
            </p>
          </div>

          {authMsg.text && (
            <div
              className={`editorial-alert ${
                authMsg.type === 'error' ? 'editorial-alert-error' : 'editorial-alert-success'
              }`}
            >
              {authMsg.text}
            </div>
          )}

          <form onSubmit={handleAuth}>
            <div className="auth-form-grid">
              {isRegister && (
                <>
                  <div className="auth-form-group">
                    <label htmlFor="reg-username">Author / Pen Name</label>
                    <input
                      id="reg-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. j_didion"
                      required
                    />
                  </div>
                  <div className="auth-form-group">
                    <label htmlFor="reg-role">Editorial Designation</label>
                    <select
                      id="reg-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="reader">Reader — Read and explore dispatches</option>
                      <option value="author">Author — Compose and publish original stories</option>
                      <option value="admin">Admin — Editorial oversight and archive curation</option>
                    </select>
                  </div>
                </>
              )}

              <div className="auth-form-group">
                <label htmlFor="auth-identifier">
                  {isRegister ? 'Correspondence Email' : 'Username or Email'}
                </label>
                <input
                  id="auth-identifier"
                  type={isRegister ? 'email' : 'text'}
                  value={isRegister ? email : loginIdentifier}
                  onChange={(e) => isRegister
                    ? setEmail(e.target.value)
                    : setLoginIdentifier(e.target.value)}
                  placeholder={isRegister ? 'editor@press.org' : 'Your username or email'}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="auth-password">Secret Passcode</label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="auth-slip-footer">
              <button type="submit" className="btn btn-primary">
                {isRegister ? 'Register Credentials' : 'Enter Desk'}
              </button>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setAuthMsg({ text: '', type: '' });
                }}
              >
                {isRegister
                  ? 'Already holding credentials? Sign in here.'
                  : 'Require an account? Apply for credentials here.'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Main Content Area */}
      {readingPost ? (
        /* Single-Post Full Reading Expansion View */
        <article className="single-reading-view">
          <button
            className="reading-back-button"
            onClick={() => setReadingPost(null)}
          >
            ← Return to Front Page
          </button>

          <header className="reading-article-header">
            <div className="reading-article-kicker">Dispatch No. {readingPost.id}</div>
            <h1 className="reading-article-title">{readingPost.title}</h1>
            <div className="reading-article-byline">
              <span className="author-credit">By {readingPost.author_name || 'Staff Contributor'}</span>
              <span className="bullet-divider">•</span>
              {getRoleBadge(
                user && user.username === readingPost.author_name
                  ? user.role
                  : readingPost.author_name === 'admin_user'
                  ? 'admin'
                  : 'author'
              )}
              <span className="bullet-divider">•</span>
              <span>{formatEditorialDate(readingPost.created_at)}</span>
              <span className="bullet-divider">•</span>
              <span>{calculateReadingTime(readingPost.content)}</span>
            </div>
          </header>

          <div className="reading-article-body">
            {readingPost.content
              ? readingPost.content
                  .split(/\n+/)
                  .filter((p) => p.trim().length > 0)
                  .map((paragraph, idx) => <p key={idx}>{paragraph}</p>)
              : <p>{readingPost.content}</p>}
          </div>

          <footer className="reading-article-footer">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setReadingPost(null)}
            >
              ← Return to Front Page
            </button>

            <div className="reading-article-actions">
              {canEditPost(readingPost) && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => startEditingPost(readingPost)}
                >
                  Edit Dispatch
                </button>
              )}
              {user && user.role === 'admin' && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setPostToDelete(readingPost)}
                >
                  Delete Dispatch (Admin)
                </button>
              )}
            </div>
          </footer>
        </article>
      ) : (
        /* Front Page & Magazine Stream View */
        <>
          {/* Editorial Navigation Tabs */}
          <nav className="editorial-nav" aria-label="Sections">
            <div className="nav-tabs">
              <button
                className={`nav-tab-button ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Front Page
              </button>

              {user && (
                <button
                  className={`nav-tab-button ${activeTab === 'mine' ? 'active' : ''}`}
                  onClick={() => setActiveTab('mine')}
                >
                  My Dispatches
                </button>
              )}
            </div>

            {/* Author / Admin quick compose toggle */}
            {user && ['author', 'admin'].includes(user.role) && (
              <button
                className="nav-desk-action"
                onClick={() => showDraftDesk ? cancelDraft() : startNewPost()}
              >
                {showDraftDesk ? 'Close Drafting Desk' : 'Compose Dispatch +'}
              </button>
            )}
          </nav>

          {/* Refined Drafting Desk (Author & Admin) */}
          {user && ['author', 'admin'].includes(user.role) && showDraftDesk && (
            <section className="drafting-desk" aria-labelledby="drafting-desk-title">
              <div className="drafting-desk-header">
                <h2 id="drafting-desk-title" className="drafting-desk-title">
                  {editingPost ? 'Edit Dispatch' : "The Writer's Desk"}
                </h2>
                <div className="drafting-meta-stats">
                  <span>{draftWordCount} words</span> · <span>{draftEstTime}</span>
                </div>
              </div>

              {postMsg.text && (
                <div
                  className={`editorial-alert ${
                    postMsg.type === 'error' ? 'editorial-alert-error' : 'editorial-alert-success'
                  }`}
                >
                  {postMsg.text}
                </div>
              )}

              <form onSubmit={handleSavePost}>
                <div className="desk-form-group">
                  <label htmlFor="post-title" className="desk-label">Headline / Title</label>
                  <input
                    id="post-title"
                    className="desk-input-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a compelling headline..."
                    required
                  />
                </div>

                <div className="desk-form-group">
                  <label htmlFor="post-content" className="desk-label">Story / Dispatch Prose</label>
                  <textarea
                    id="post-content"
                    className="desk-textarea-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Compose the narrative here. Generous paragraph breaks are formatted automatically upon publication..."
                    required
                  />
                </div>

                <div className="desk-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={cancelDraft}
                  >
                    Cancel Draft
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isPublishing}
                  >
                    {isPublishing
                      ? (editingPost ? 'Saving Changes...' : 'Publishing Story...')
                      : (editingPost ? 'Save Changes' : 'Publish Story')}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Section Header */}
          <div className="stream-section-header">
            <h2 className="stream-section-title">
              {activeTab === 'mine' ? 'My Filed Dispatches' : 'Current Dispatches'}
            </h2>
            <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>
              {posts.length} {posts.length === 1 ? 'dispatch' : 'dispatches'} in archive
            </span>
          </div>

          {/* Post Stream Content: Lead Dispatch + Magazine Story Grid */}
          <main className="post-stream">
            {loadingPosts ? (
              <div className="editorial-empty-state">
                <p className="empty-state-text">Fetching latest dispatches from the wire...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="editorial-empty-state">
                <h3 className="empty-state-title">No Dispatches in Record</h3>
                <p className="empty-state-text">
                  {activeTab === 'mine'
                    ? 'You have not filed any dispatches under this byline. Use the drafting desk to contribute your first story.'
                    : 'The press archive is presently silent. Stories published by authors and editors will appear here.'}
                </p>
              </div>
            ) : (
              <div className="editorial-magazine-layout">
                {/* 1. Featured Lead Dispatch (First/Latest Post) */}
                {(() => {
                  const leadPost = posts[0];
                  const leadReadingTime = calculateReadingTime(leadPost.content);
                  const leadRoleBadge = getRoleBadge(
                    user && user.username === leadPost.author_name
                      ? user.role
                      : leadPost.author_name === 'admin_user'
                      ? 'admin'
                      : 'author'
                  );

                  return (
                    <article className="lead-dispatch-card" key={leadPost.id}>
                      <div className="lead-dispatch-kicker">
                        <span>★ Featured Lead Dispatch</span>
                        <span className="dispatch-badge-id">Dispatch No. {leadPost.id}</span>
                      </div>

                      <h2
                        className="lead-story-title"
                        onClick={() => handleOpenSinglePost(leadPost)}
                        title="Read full dispatch"
                      >
                        {leadPost.title}
                      </h2>

                      <div className="lead-story-byline">
                        <span className="author-credit">By {leadPost.author_name || 'Staff Contributor'}</span>
                        <span className="bullet-divider">•</span>
                        {leadRoleBadge}
                        <span className="bullet-divider">•</span>
                        <span>{formatEditorialDate(leadPost.created_at)}</span>
                        <span className="bullet-divider">•</span>
                        <span>{leadReadingTime}</span>
                      </div>

                      <p className="lead-story-excerpt">
                        {leadPost.content && leadPost.content.length > 380
                          ? `${leadPost.content.slice(0, 380)}…`
                          : leadPost.content}
                      </p>

                      <div className="lead-dispatch-footer">
                        <button
                          className="read-dispatch-link"
                          onClick={() => handleOpenSinglePost(leadPost)}
                        >
                          Read Full Story →
                        </button>

                        {user && user.role === 'admin' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setPostToDelete(leadPost)}
                          >
                            Delete
                          </button>
                        )}
                        {canEditPost(leadPost) && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => startEditingPost(leadPost)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })()}

                {/* 2. Responsive 2-column or 3-column Magazine Story Grid for Subsequent Posts */}
                {posts.length > 1 && (
                  <div className="magazine-story-grid">
                    {posts.slice(1).map((p) => {
                      const readingTime = calculateReadingTime(p.content);
                      const roleBadge = getRoleBadge(
                        user && user.username === p.author_name
                          ? user.role
                          : p.author_name === 'admin_user'
                          ? 'admin'
                          : 'author'
                      );

                      return (
                        <article className="grid-story-card" key={p.id}>
                          <div className="grid-story-content">
                            <div className="grid-story-kicker">
                              <span>Dispatch No. {p.id}</span>
                            </div>

                            <h3
                              className="grid-story-title"
                              onClick={() => handleOpenSinglePost(p)}
                              title="Read full dispatch"
                            >
                              {p.title}
                            </h3>

                            <div className="grid-story-byline">
                              <span className="author-credit">By {p.author_name || 'Staff Contributor'}</span>
                              <span className="bullet-divider">•</span>
                              {roleBadge}
                              <span className="bullet-divider">•</span>
                              <span>{formatEditorialDate(p.created_at)}</span>
                              <span className="bullet-divider">•</span>
                              <span>{readingTime}</span>
                            </div>

                            <p className="grid-story-excerpt">
                              {p.content && p.content.length > 190
                                ? `${p.content.slice(0, 190)}…`
                                : p.content}
                            </p>
                          </div>

                          <div className="grid-story-footer">
                            <button
                              className="read-dispatch-link"
                              onClick={() => handleOpenSinglePost(p)}
                            >
                              Read full story →
                            </button>

                            {user && user.role === 'admin' && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => setPostToDelete(p)}
                              >
                                Delete
                              </button>
                            )}
                            {canEditPost(p) && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => startEditingPost(p)}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}

      {/* Modal Confirmation for Admin Post Deletion */}
      {postToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => !isDeleting && setPostToDelete(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-title"
        >
          <div
            className="editorial-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-kicker">Editorial Curation Action</div>
            <h2 id="modal-delete-title" className="modal-title">
              Delete Dispatch
            </h2>
            <div className="modal-body">
              Are you certain you wish to strike this piece from the public press? This action cannot be reversed.
              <div className="modal-target-quote">
                “{postToDelete.title}”
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isDeleting}
                onClick={() => setPostToDelete(null)}
              >
                Keep Dispatch
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={isDeleting}
                onClick={confirmDeletePost}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
