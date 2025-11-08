import React, { useState, useEffect } from 'react';
import DataTable from './components/DataTable';
import Links from './components/Links';
import AddLinkModal from './components/AddLinkModal';
import EditTagsModal from './components/EditTagsModal';
import './App.css';

function App() {
  const appName = import.meta.env.VITE_APP_NAME || 'NodeSentry';
  const [data, setData] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditTagsModalOpen, setIsEditTagsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dataResponse, linksResponse] = await Promise.all([
        fetch('/api/data'),
        fetch('/api/links')
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
      body: JSON.stringify(linkData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add link');
    }

    // Refresh links after adding
    const linksResponse = await fetch('/api/links');
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
      body: JSON.stringify({ custom_tags: customTags }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update tags');
    }

    // Refresh data after updating
    const dataResponse = await fetch('/api/data');
    const dataResult = await dataResponse.json();
    setData(dataResult.data || []);
  };

  useEffect(() => {
    // Update document title with app name
    document.title = `${appName} - HomeLab Node Watcher`;
  }, [appName]);

  useEffect(() => {
    fetchData();
  }, []);

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

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>{appName}</h1>
          <p className="subtitle">HomeLab Node Watcher</p>
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
            <Links links={links} onAddClick={() => setIsModalOpen(true)} />
            <DataTable data={data} onEditTags={handleEditTags} />
          </>
        )}
      </main>

      <AddLinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddLink}
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
        <p>{appName} v1.0.0 - HomeLab Node Monitoring System</p>
      </footer>
    </div>
  );
}

export default App;
