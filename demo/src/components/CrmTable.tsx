'use client';

/**
 * ResponseLock Simulated CRM Inspection Table Component
 * Location: demo/src/components/CrmTable.tsx
 *
 * Renders the 10-column CRM inspection table mandated by R4:
 * 1. Submission ID
 * 2. Scenario
 * 3. Contact Values
 * 4. Created At
 * 5. Lead Source
 * 6. Lead Source Detail
 * 7. Campaign Name
 * 8. GCLID
 * 9. Mapping Status
 * 10. Intentionally Missing Fields
 */

import React, { useState, useMemo } from 'react';
import { CrmRecord, CrmMappingStatus } from '@/lib/contracts/crm';

export interface CrmTableProps {
  records: CrmRecord[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const STATUS_BADGES: Record<CrmMappingStatus, { bg: string; text: string; border: string; label: string }> = {
  valid: {
    bg: 'var(--color-success-bg)',
    text: 'var(--color-success-text)',
    border: 'var(--color-success-border)',
    label: 'Valid',
  },
  mismapped: {
    bg: 'var(--color-warning-bg)',
    text: 'var(--color-warning-text)',
    border: 'var(--color-warning-border)',
    label: 'Mismapped',
  },
  incomplete: {
    bg: 'rgba(249, 115, 22, 0.15)',
    text: '#fb923c',
    border: '#f97316',
    label: 'Incomplete',
  },
  corrupted: {
    bg: 'var(--color-error-bg)',
    text: 'var(--color-error-text)',
    border: 'var(--color-error-border)',
    label: 'Corrupted',
  },
};

export function CrmTable({
  records,
  isLoading = false,
  emptyMessage = 'No CRM records stored yet. Submit any scenario form to inspect CRM field mapping.',
  className = '',
}: CrmTableProps): React.ReactElement {
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Scenarios present in the records
  const availableScenarios = useMemo(() => {
    const set = new Set(records.map((r) => r.scenario));
    return Array.from(set).sort();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (scenarioFilter !== 'all' && rec.scenario !== scenarioFilter) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const contact = `${rec.full_name} ${rec.work_email} ${rec.company_name}`.toLowerCase();
        const ids = `${rec.submission_id} ${rec.scenario} ${rec.campaign_name} ${rec.lead_source}`.toLowerCase();
        return contact.includes(query) || ids.includes(query);
      }
      return true;
    });
  }, [records, scenarioFilter, searchTerm]);

  return (
    <div
      className={`crm-table-container ${className}`}
      data-testid="crm-table-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      {/* Controls Strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          backgroundColor: 'var(--color-bg-surface-raised)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label
              htmlFor="crm-scenario-filter"
              style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}
            >
              Scenario:
            </label>
            <select
              id="crm-scenario-filter"
              value={scenarioFilter}
              onChange={(e) => setScenarioFilter(e.target.value)}
              data-testid="crm-scenario-filter"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-primary)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <option value="all">All Scenarios ({records.length})</option>
              {availableScenarios.map((sc) => (
                <option key={sc} value={sc}>
                  {sc} ({records.filter((r) => r.scenario === sc).length})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label
              htmlFor="crm-search-input"
              style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}
            >
              Search:
            </label>
            <input
              id="crm-search-input"
              type="search"
              placeholder="Search ID, email, source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="crm-search-input"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-primary)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
                width: '180px',
              }}
            />
          </div>
        </div>

        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> records
        </div>
      </div>

      {/* 10-Column Responsive Table */}
      <div
        style={{
          overflowX: 'auto',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-bg-surface)',
        }}
      >
        <table
          data-testid="crm-table"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-bg-surface-raised)',
                borderBottom: '2px solid var(--color-border-default)',
                color: 'var(--color-text-secondary)',
                fontWeight: 'var(--font-weight-semibold)',
                whiteSpace: 'nowrap',
              }}
            >
              <th scope="col" style={{ padding: '10px 12px' }}>1. Submission ID</th>
              <th scope="col" style={{ padding: '10px 12px' }}>2. Scenario</th>
              <th scope="col" style={{ padding: '10px 12px' }}>3. Contact Values</th>
              <th scope="col" style={{ padding: '10px 12px' }}>4. Created At</th>
              <th scope="col" style={{ padding: '10px 12px' }}>5. lead_source</th>
              <th scope="col" style={{ padding: '10px 12px' }}>6. lead_source_detail</th>
              <th scope="col" style={{ padding: '10px 12px' }}>7. campaign_name</th>
              <th scope="col" style={{ padding: '10px 12px' }}>8. gclid</th>
              <th scope="col" style={{ padding: '10px 12px' }}>9. Mapping Status</th>
              <th scope="col" style={{ padding: '10px 12px' }}>10. Intentionally Missing Fields</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Loading simulated CRM records...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  data-testid="crm-empty-state"
                  style={{
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => {
                const statusMeta = STATUS_BADGES[rec.mapping_status] || STATUS_BADGES.valid;
                const missingList =
                  rec.intentionally_missing_fields && rec.intentionally_missing_fields.length > 0
                    ? rec.intentionally_missing_fields
                    : rec.missing_fields && rec.missing_fields.length > 0
                    ? rec.missing_fields
                    : [];

                return (
                  <tr
                    key={rec.submission_id}
                    data-testid={`crm-row-${rec.submission_id}`}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    {/* 1. Submission ID */}
                    <td
                      style={{
                        padding: '10px 12px',
                        fontFamily: 'var(--font-family-mono)',
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                      }}
                      title={rec.submission_id}
                    >
                      {rec.submission_id.substring(0, 13)}...
                    </td>

                    {/* 2. Scenario */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          backgroundColor: 'var(--color-bg-subtle)',
                          color: 'var(--color-accent-500)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          fontFamily: 'var(--font-family-mono)',
                          fontSize: '0.7rem',
                        }}
                      >
                        {rec.scenario}
                      </span>
                    </td>

                    {/* 3. Contact Values */}
                    <td style={{ padding: '10px 12px', minWidth: '180px' }}>
                      <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                        {rec.full_name || '<blank name>'}
                      </div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}>
                        {rec.work_email || '<blank email>'}
                      </div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                        {rec.company_name || '<blank company>'}
                      </div>
                    </td>

                    {/* 4. Created At */}
                    <td
                      style={{
                        padding: '10px 12px',
                        fontFamily: 'var(--font-family-mono)',
                        color: 'var(--color-text-muted)',
                        whiteSpace: 'nowrap',
                        fontSize: '0.7rem',
                      }}
                    >
                      {rec.created_at ? new Date(rec.created_at).toLocaleString() : 'N/A'}
                    </td>

                    {/* 5. lead_source */}
                    <td
                      style={{
                        padding: '10px 12px',
                        fontFamily: 'var(--font-family-mono)',
                        color: rec.lead_source ? 'var(--color-text-primary)' : 'var(--color-error-text)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {rec.lead_source || <em style={{ color: 'var(--color-error-text)' }}>[EMPTY]</em>}
                    </td>

                    {/* 6. lead_source_detail */}
                    <td
                      style={{
                        padding: '10px 12px',
                        fontFamily: 'var(--font-family-mono)',
                        color: rec.lead_source_detail ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {rec.lead_source_detail || <em style={{ color: 'var(--color-text-muted)' }}>none</em>}
                    </td>

                    {/* 7. campaign_name */}
                    <td
                      style={{
                        padding: '10px 12px',
                        fontFamily: 'var(--font-family-mono)',
                        color: rec.campaign_name ? 'var(--color-text-primary)' : 'var(--color-error-text)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {rec.campaign_name || <em style={{ color: 'var(--color-error-text)' }}>[EMPTY]</em>}
                    </td>

                    {/* 8. gclid */}
                    <td
                      style={{
                        padding: '10px 12px',
                        fontFamily: 'var(--font-family-mono)',
                        color: rec.gclid ? 'var(--color-accent-500)' : 'var(--color-text-muted)',
                        whiteSpace: 'nowrap',
                        fontSize: '0.7rem',
                      }}
                    >
                      {rec.gclid ? `${rec.gclid.substring(0, 16)}...` : <span style={{ color: 'var(--color-text-muted)' }}>none</span>}
                    </td>

                    {/* 9. Mapping Status */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <span
                        data-testid={`mapping-badge-${rec.submission_id}`}
                        style={{
                          backgroundColor: statusMeta.bg,
                          color: statusMeta.text,
                          border: `1px solid ${statusMeta.border}`,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* 10. Intentionally Missing Fields */}
                    <td style={{ padding: '10px 12px', minWidth: '150px' }}>
                      {missingList.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {missingList.map((field) => (
                            <span
                              key={field}
                              style={{
                                backgroundColor: 'var(--color-error-bg)',
                                color: 'var(--color-error-text)',
                                border: '1px solid var(--color-error-border)',
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.65rem',
                                fontFamily: 'var(--font-family-mono)',
                              }}
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                          None (intact)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
