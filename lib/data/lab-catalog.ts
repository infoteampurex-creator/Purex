/**
 * Lab-panel catalog reader.
 *
 * The 11 panels and ~120 markers live in the database (seeded by
 * migration 00031) so admins can extend the catalog later without a
 * code push. This module reads and shapes them for the UI.
 *
 * Everything is cache-friendly — the catalog only changes when a new
 * marker is added, which is rare — but we don't add caching yet; a
 * seeded catalog reads in <10ms.
 */

import { createClient } from '@/lib/supabase/server';
import type { LabPanel, LabMarker, LabPanelWithMarkers } from './health-reports';

interface PanelRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  display_order: number;
}

interface MarkerRow {
  id: string;
  panel_id: string;
  slug: string;
  name: string;
  short_name: string | null;
  unit: string | null;
  ref_low: string | number | null;
  ref_high: string | number | null;
  ref_low_female: string | number | null;
  ref_high_female: string | number | null;
  higher_is_better: boolean;
  display_order: number;
}

function toPanel(row: PanelRow): LabPanel {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    displayOrder: row.display_order,
  };
}

function toNum(v: string | number | null): number | null {
  if (v == null) return null;
  return typeof v === 'number' ? v : Number(v);
}

function toMarker(row: MarkerRow): LabMarker {
  return {
    id: row.id,
    panelId: row.panel_id,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    unit: row.unit,
    refLow: toNum(row.ref_low),
    refHigh: toNum(row.ref_high),
    refLowFemale: toNum(row.ref_low_female),
    refHighFemale: toNum(row.ref_high_female),
    higherIsBetter: row.higher_is_better,
    displayOrder: row.display_order,
  };
}

/** All 11 panels with their markers, sorted by display_order. */
export async function getLabCatalog(): Promise<LabPanelWithMarkers[]> {
  const supabase = await createClient();

  const [{ data: panels, error: pErr }, { data: markers, error: mErr }] =
    await Promise.all([
      supabase
        .from('lab_panels')
        .select('id, slug, name, description, category, display_order')
        .order('display_order', { ascending: true }),
      supabase
        .from('lab_markers')
        .select(
          'id, panel_id, slug, name, short_name, unit, ref_low, ref_high, ref_low_female, ref_high_female, higher_is_better, display_order'
        )
        .order('display_order', { ascending: true }),
    ]);

  if (pErr) throw new Error(`Failed to load lab panels: ${pErr.message}`);
  if (mErr) throw new Error(`Failed to load lab markers: ${mErr.message}`);

  const markersByPanel = new Map<string, LabMarker[]>();
  for (const raw of (markers ?? []) as MarkerRow[]) {
    const m = toMarker(raw);
    const list = markersByPanel.get(m.panelId) ?? [];
    list.push(m);
    markersByPanel.set(m.panelId, list);
  }

  return ((panels ?? []) as PanelRow[]).map((raw) => {
    const p = toPanel(raw);
    return { ...p, markers: markersByPanel.get(p.id) ?? [] };
  });
}
