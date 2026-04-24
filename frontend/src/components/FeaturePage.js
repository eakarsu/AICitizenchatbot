import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:3001';

function FeaturePage({ feature }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('token');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}${feature.endpoint}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [feature.endpoint, token]); // eslint-disable-line

  useEffect(() => {
    fetchItems();
    setSelectedItem(null);
    setShowDetail(false);
    setShowForm(false);
    setSearchTerm('');
  }, [fetchItems, feature.key]);

  const initFormData = (item = null) => {
    const data = {};
    feature.fields.forEach((field) => {
      if (item) {
        data[field.name] = item[field.name] || '';
      } else {
        data[field.name] = field.type === 'select' && field.options?.length ? field.options[0] : '';
      }
    });
    return data;
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData(initFormData());
    setShowForm(true);
    setShowDetail(false);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData(initFormData(item));
    setShowForm(true);
    setShowDetail(false);
  };

  const openDetail = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleFormChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem
        ? `${API_BASE}${feature.endpoint}/${editingItem._id || editingItem.id}`
        : `${API_BASE}${feature.endpoint}`;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        fetchItems();
      } else {
        alert(data.error || 'Save failed');
      }
    } catch {
      alert('Error saving item. Please try again.');
    }
  };

  const confirmDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(
        `${API_BASE}${feature.endpoint}/${deleteTarget._id || deleteTarget.id}`,
        { method: 'DELETE', headers }
      );
      const data = await res.json();
      if (data.success) {
        setShowDeleteConfirm(false);
        setShowDetail(false);
        setDeleteTarget(null);
        fetchItems();
      } else {
        alert(data.error || 'Delete failed');
      }
    } catch {
      alert('Error deleting item. Please try again.');
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return feature.fields.some((field) => {
      const val = item[field.name];
      return val && String(val).toLowerCase().includes(term);
    });
  });

  const formatFieldValue = (value, field) => {
    if (value === null || value === undefined || value === '') return '\u2014';
    if (field.type === 'date' && value) {
      try {
        return new Date(value).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
      } catch {
        return value;
      }
    }
    return String(value);
  };

  const getStatusClass = (status) => {
    if (!status) return '';
    const s = String(status).toLowerCase();
    if (['active', 'completed', 'scheduled', 'upcoming'].includes(s)) return 'status-active';
    if (['inactive', 'cancelled', 'repealed', 'expired'].includes(s)) return 'status-inactive';
    if (['draft', 'pending', 'suspended', 'amended'].includes(s)) return 'status-pending';
    if (['urgent', 'high'].includes(s)) return 'status-urgent';
    return 'status-default';
  };

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div className="feature-title-section">
          <span className="feature-icon">{feature.icon}</span>
          <div>
            <h1>{feature.name}</h1>
            <p>{feature.description}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + New {feature.name.replace(/s$/, '')}
        </button>
      </div>

      <div className="feature-toolbar">
        <div className="search-box">
          <span className="search-icon">{'\uD83D\uDD0D'}</span>
          <input
            type="text"
            placeholder={`Search ${feature.name.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span className="item-count">{filteredItems.length} items</span>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading {feature.name.toLowerCase()}...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">{feature.icon}</span>
          <h3>No {feature.name.toLowerCase()} found</h3>
          <p>{searchTerm ? 'Try a different search term' : `Create your first ${feature.name.toLowerCase().replace(/s$/, '')}`}</p>
          {!searchTerm && (
            <button className="btn btn-primary" onClick={openCreate}>
              + Create {feature.name.replace(/s$/, '')}
            </button>
          )}
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                {(feature.tableColumns || feature.fields.slice(0, 5).map(f => f.name)).map((col) => {
                  const field = feature.fields.find((f) => f.name === col);
                  return <th key={col}>{field ? field.label : col}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr key={item._id || item.id || idx} onClick={() => openDetail(item)}>
                  {(feature.tableColumns || feature.fields.slice(0, 5).map(f => f.name)).map((col) => (
                    <td key={col}>
                      {col === 'status' || col === 'priority' ? (
                        <span className={`status-badge ${getStatusClass(item[col])}`}>
                          {item[col] || '\u2014'}
                        </span>
                      ) : (
                        <span className="cell-text">
                          {item[col] ? String(item[col]).substring(0, 80) : '\u2014'}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span className="modal-icon">{feature.icon}</span>
                {selectedItem[feature.fields[0]?.name] || 'Detail'}
              </h2>
              <button className="modal-close" onClick={() => setShowDetail(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {feature.fields.map((field) => (
                  <div key={field.name} className={`detail-item ${field.type === 'textarea' ? 'full-width' : ''}`}>
                    <label>{field.label}</label>
                    {field.name === 'status' || field.name === 'priority' ? (
                      <span className={`status-badge ${getStatusClass(selectedItem[field.name])}`}>
                        {formatFieldValue(selectedItem[field.name], field)}
                      </span>
                    ) : (
                      <p>{formatFieldValue(selectedItem[field.name], field)}</p>
                    )}
                  </div>
                ))}
                {selectedItem.created_at && (
                  <div className="detail-item">
                    <label>Created</label>
                    <p>{new Date(selectedItem.created_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedItem.updated_at && (
                  <div className="detail-item">
                    <label>Last Updated</label>
                    <p>{new Date(selectedItem.updated_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => openEdit(selectedItem)}>
                {'\u270F\uFE0F'} Edit
              </button>
              <button className="btn btn-danger" onClick={() => confirmDelete(selectedItem)}>
                {'\uD83D\uDDD1\uFE0F'} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingItem ? `Edit ${feature.name.replace(/s$/, '')}` : `New ${feature.name.replace(/s$/, '')}`}
              </h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  {feature.fields.map((field) => (
                    <div key={field.name} className={`form-group ${field.type === 'textarea' ? 'full-width' : ''}`}>
                      <label htmlFor={`form-${field.name}`}>
                        {field.label}
                        {field.required && <span className="required">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          id={`form-${field.name}`}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleFormChange(field.name, e.target.value)}
                          required={field.required}
                          rows={4}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          id={`form-${field.name}`}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleFormChange(field.name, e.target.value)}
                          required={field.required}
                        >
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`form-${field.name}`}
                          type={field.type || 'text'}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleFormChange(field.name, e.target.value)}
                          required={field.required}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="confirm-content">
                <span className="confirm-icon">{'\u26A0\uFE0F'}</span>
                <p>Are you sure you want to delete this {feature.name.replace(/s$/, '').toLowerCase()}?</p>
                <p className="confirm-subtext">This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeaturePage;
