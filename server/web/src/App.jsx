import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import DataTable from './components/DataTable';
import Links from './components/Links';
import AddLinkModal from './components/AddLinkModal';
import EditLinkModal from './components/EditLinkModal';
import EditTagsModal from './components/EditTagsModal';
import './App.css';

function App() {
  const appName = import.meta.env.VITE_APP_NAME || 'NodeSentry';
  const appDescription = import.meta.env.VITE_APP_DESCRIPTION || 'HomeLab Node Watcher';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditLinkModalOpen, setIsEditLinkModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [isEditTagsModalOpen, setIsEditTagsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const checkAuth = async () => {
    try {
      setAuthLoading(true);
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dataResponse, linksResponse] = await Promise.all([
        fetch('/api/data', { credentials: 'include' }),
        fetch('/api/links', { credentials: 'include' })
      ]);

      if (!dataResponse.ok) {
        throw new Error(`HTTP error! status: ${dataResponse.status}`);
      }

      if (!linksResponse.ok) {
        throw new Error(`HTTP error! status: ${linksResponse.status}`);
      }

      const dataResult = await dataResponse.json();
      const linksResult = await linksResponse.json();

      setData(dataResult.data || []);
      setLinks(linksResult.data || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async (linkData) => {
    const response = await fetch('/api/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(linkData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add link');
    }

    // Refresh links after adding
    const linksResponse = await fetch('/api/links', { credentials: 'include' });
    const linksResult = await linksResponse.json();
    setLinks(linksResult.data || []);
  };

  const handleEditLink = (link) => {
    setSelectedLink(link);
    setIsEditLinkModalOpen(true);
  };

  const handleUpdateLink = async (linkId, linkData) => {
    const response = await fetch(`/api/links/${linkId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(linkData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update link');
    }

    // Refresh links after updating
    const linksResponse = await fetch('/api/links', { credentials: 'include' });
    const linksResult = await linksResponse.json();
    setLinks(linksResult.data || []);
  };

  const handleDeleteLink = async (linkId) => {
    const response = await fetch(`/api/links/${linkId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete link');
    }

    // Refresh links after deleting
    const linksResponse = await fetch('/api/links', { credentials: 'include' });
    const linksResult = await linksResponse.json();
    setLinks(linksResult.data || []);
  };

  const handleEditTags = (client) => {
    setSelectedClient(client);
    setIsEditTagsModalOpen(true);
  };

  const handleUpdateTags = async (clientId, customTags) => {
    const response = await fetch(`/api/data/${clientId}/tags`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ custom_tags: customTags }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update tags');
    }

    // Refresh data after updating
    const dataResponse = await fetch('/api/data', { credentials: 'include' });
    const dataResult = await dataResponse.json();
    setData(dataResult.data || []);
  };

  useEffect(() => {
    // Check authentication on mount
    checkAuth();
  }, []);

  useEffect(() => {
    // Update document title with app name
    document.title = `${appName} - ${appDescription}`;
  }, [appName, appDescription]);

  useEffect(() => {
    // Fetch data only if authenticated
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchData();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleRefresh = () => {
    fetchData();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Show loading during auth check
  if (authLoading) {
    return <div className="loading">Checking authentication...</div>;
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={checkAuth} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>{appName}</h1>
          <p className="subtitle">{appDescription}</p>
        </div>
        <div className="header-controls">
          <div className="status-info">
            {lastUpdate && (
              <span className="last-update">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <span className="client-count">
              {data.length} {data.length === 1 ? 'client' : 'clients'}
            </span>
          </div>
          <button
            className={`toggle-btn ${autoRefresh ? 'active' : ''}`}
            onClick={toggleAutoRefresh}
          >
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && data.length === 0 ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <Links
              links={links}
              onAddClick={() => setIsModalOpen(true)}
              onEditClick={handleEditLink}
            />
            <DataTable data={data} onEditTags={handleEditTags} />
          </>
        )}
      </main>

      <AddLinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddLink}
        clients={data}
      />

      <EditLinkModal
        isOpen={isEditLinkModalOpen}
        onClose={() => {
          setIsEditLinkModalOpen(false);
          setSelectedLink(null);
        }}
        onSubmit={handleUpdateLink}
        onDelete={handleDeleteLink}
        link={selectedLink}
        clients={data}
      />

      <EditTagsModal
        isOpen={isEditTagsModalOpen}
        onClose={() => {
          setIsEditTagsModalOpen(false);
          setSelectedClient(null);
        }}
        onSubmit={handleUpdateTags}
        client={selectedClient}
      />

      <footer className="footer">
        <p>{appName} - {appDescription}</p>
      </footer>
    </div>
  );
}

export default App;
