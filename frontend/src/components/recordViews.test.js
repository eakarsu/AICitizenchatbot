import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import FeaturePage from './FeaturePage';
import AIReport from './AIReport';
import { recordList } from './recordList';
import features from '../config/features';
import Login from './Login';
import PermitEligibility from './PermitEligibility';
import { workspaceFields, workspacePresets } from './AIWorkspace';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import fs from 'fs';
import path from 'path';

global.IS_REACT_ACT_ENVIRONMENT = true;

const documentTitles = [
  'FY2026 Annual County Budget', 'Comprehensive Land Use Plan 2026-2036',
  'County Emergency Operations Plan', 'Water Quality Annual Report',
  'Employee Benefits Handbook 2026', 'Parks Master Plan',
  'Transportation Improvement Program', 'Property Tax Assessment Guide',
  'Building Code Compliance Manual', 'Animal Control Ordinance Summary',
  'Recycling Program Guidelines', 'Senior Services Resource Directory',
  'Small Business Licensing Guide', 'Stormwater Management Plan',
  'Voter Registration Procedures Manual',
];

test('document list renders 15 existing seed records from a paginated API envelope', async () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const errors = [];
  const oldError = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({
    success: true,
    data: documentTitles.map((title) => ({ title, category: 'Report', department: 'County', file_type: 'PDF', status: 'active' })),
    pagination: { page: 1, total: 15 },
  }) });
  try {
    await act(async () => { root.render(<FeaturePage feature={features.find((f) => f.key === 'documents')} />); });
    expect(host.querySelectorAll('tbody tr')).toHaveLength(15);
    expect(host.textContent).toContain(documentTitles[0]);
    expect(host.textContent).toContain(documentTitles[14]);
    expect(errors).toEqual([]);
  } finally {
    await act(async () => root.unmount());
    document.body.removeChild(host);
    console.error = oldError;
  }
});

test('all ten core record tables render 15 project seed entries without console errors', async () => {
  const seed = fs.readFileSync(path.resolve(process.cwd(), '../backend/seed.js'), 'utf8');
  const oldError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args.join(' '));
  try {
    for (const feature of features) {
      const start = seed.indexOf(`INSERT INTO ${feature.key} (`);
      expect(start).toBeGreaterThan(-1);
      const statement = seed.slice(start, seed.indexOf('`);', start));
      const labels = statement.split('\n').map((line) => line.match(/^\s*\('([^']+)'/)).filter(Boolean).map((match) => match[1]);
      expect(labels).toHaveLength(15);
      const key = feature.fields[0].name;
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({
        success: true,
        data: labels.map((label) => ({ [key]: label })),
        pagination: { page: 1, total: 15 },
      }) });
      const host = document.createElement('div');
      document.body.appendChild(host);
      const root = createRoot(host);
      try {
        await act(async () => root.render(<FeaturePage feature={feature} />));
        expect(host.querySelectorAll('tbody tr')).toHaveLength(15);
        expect(host.textContent).toContain(labels[0]);
      } finally {
        await act(async () => root.unmount());
        document.body.removeChild(host);
      }
    }
    expect(errors).toEqual([]);
  } finally {
    console.error = oldError;
  }
});

test('record arrays are guarded and nested paginated shapes are accepted', () => {
  expect(recordList({ data: { items: documentTitles } })).toHaveLength(15);
  expect(recordList({ data: { records: documentTitles } })).toHaveLength(15);
  expect(recordList({ data: { rules: documentTitles } }, 'rules')).toHaveLength(15);
  expect(recordList({ data: { unexpected: true } })).toEqual([]);
  expect(recordList({ success: false, data: documentTitles })).toEqual([]);
});

test('returned and saved structured reports show nested sections, facts, lists, and tables', async () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const result = { result_json: { assessment: { eligible: false, total: 0, note: '' }, steps: ['Review', 'Follow up'], cases: [{ area: 'Roads', count: 0 }, { area: 'Parks', count: 2 }] } };
  try {
    await act(async () => root.render(<AIReport response={result} title="Returned report" />));
    expect(host.textContent).toContain('Assessment');
    expect(host.textContent).toContain('No');
    expect(host.textContent).toContain('0');
    expect(host.querySelectorAll('li')).toHaveLength(2);
    expect(host.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(host.querySelector('dd:last-child')).not.toBeNull();
    await act(async () => root.render(<AIReport response={{ ...result, id: 42, input: { goal: 'Check' } }} title="Saved report" />));
    expect(host.textContent).toContain('Assessment');
    expect(host.textContent).toContain('No');
    expect(host.querySelectorAll('tbody tr')).toHaveLength(2);
  } finally {
    await act(async () => root.unmount());
    document.body.removeChild(host);
  }
});

test('demo login button uses the configured server route and signs in on success', async () => {
  localStorage.clear();
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({
    success: true,
    data: { token: 'fixture-token', user: { id: 1, name: 'Demo fixture', role: 'resident' } },
  }) });
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<Login />} /><Route path="/" element={<div>Signed in fixture</div>} /></Routes></MemoryRouter>));
    await act(async () => host.querySelector('[aria-label="Log In as Demo"]').click());
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/demo-login', { method: 'POST' });
    expect(localStorage.getItem('token')).toBe('fixture-token');
    expect(host.textContent).toContain('Signed in fixture');
  } finally {
    await act(async () => root.unmount());
    document.body.removeChild(host);
    localStorage.clear();
  }
});

test('native permit presets fill the editable fields without submitting or inventing supplied documents', async () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  global.fetch = jest.fn();
  try {
    await act(async () => root.render(<PermitEligibility />));
    const buttons = Array.from(host.querySelectorAll('button')).filter((button) => button.textContent.includes('Fill all fields'));
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      await act(async () => button.click());
      const form = host.querySelector('form');
      expect(form.querySelector('input').value.trim()).not.toBe('');
      const profile = JSON.parse(form.querySelector('textarea').value);
      expect(profile.name.trim()).not.toBe('');
      expect(profile).toHaveProperty('is_resident');
      expect(profile.documents_supplied).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(host.querySelector('[role="status"]').textContent).toContain('Generation remains a separate action');
    }
  } finally {
    await act(async () => root.unmount());
    document.body.removeChild(host);
  }
});

test('every county workspace preset fills required and optional fields', () => {
  const feature = { title: 'Permit assistance', samples: [{ value: 'Review a permit request' }] };
  for (const preset of workspacePresets(feature)) {
    expect(Object.keys(preset.values).sort()).toEqual(workspaceFields.map((field) => field.key).sort());
    for (const field of workspaceFields) expect(String(preset.values[field.key]).trim()).not.toBe('');
    expect(preset.values.context).toContain('county service');
  }
});
