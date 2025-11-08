// @ts-nocheck
import React, { useMemo, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';

type Props = {
  nodes: Node[];
  edges: Edge[];
};

/**
 * NodeInspector: Lists nodes with key properties and in/out degree.
 * Useful to verify aggregate flags, labels, and connectivity quickly.
 */
export function NodeInspector({ nodes, edges }: Props) {
  const [query, setQuery] = useState('');

  const degree = useMemo(() => {
    const out: Record<string, number> = {};
    const inn: Record<string, number> = {};
    edges.forEach((e) => {
      out[e.source] = (out[e.source] || 0) + 1;
      inn[e.target] = (inn[e.target] || 0) + 1;
    });
    return { out, inn };
  }, [edges]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = nodes.map((n) => {
      const d: any = n.data || {};
      const posAbs: any = (n as any).positionAbsolute;
      return {
        id: n.id,
        label: String(d.label ?? ''),
        type: String(d.type ?? n.type ?? ''),
        domain: d.domain ? String(d.domain) : undefined,
        ring: typeof d.ring === 'number' ? d.ring : undefined,
        isAggregate: Boolean(d.isAggregate || d.type === 'aggregate'),
        collapsed: Boolean(d.collapsed),
        pos: n.position,
        posAbs: posAbs,
        out: degree.out[n.id] || 0,
        inn: degree.inn[n.id] || 0,
      };
    });
    return q
      ? items.filter((i) =>
          i.id.toLowerCase().includes(q) ||
          i.label.toLowerCase().includes(q) ||
          i.type.toLowerCase().includes(q)
        )
      : items;
  }, [nodes, degree, query]);

  return (
    <div className="fixed right-4 top-4 z-50 w-[360px] max-h-[60vh] overflow-hidden rounded-lg border border-slate-200 bg-white/95 backdrop-blur shadow">
      <div className="px-3 py-2 border-b border-slate-200 flex items-center gap-2">
        <div className="text-[11px] font-semibold text-slate-700">Node inspector</div>
        <input
          className="ml-auto text-[11px] border rounded px-2 py-1 w-[200px]"
          placeholder="Search id/label/type"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="max-h-[50vh] overflow-y-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="text-left px-2 py-1">Id</th>
              <th className="text-left px-2 py-1">Label</th>
              <th className="text-left px-2 py-1">Type</th>
              <th className="text-right px-2 py-1">x</th>
              <th className="text-right px-2 py-1">y</th>
              <th className="text-left px-2 py-1">deg</th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-2 py-1 font-mono text-[10px]">{i.id}</td>
                <td className="px-2 py-1 truncate" title={i.label}>{i.label}</td>
                <td className="px-2 py-1">
                  <span className="inline-flex items-center gap-1">
                    <span>{i.type}</span>
                    {i.domain && <span className="text-slate-400">• {i.domain}</span>}
                    {typeof i.ring === 'number' && <span className="text-slate-400">• r{i.ring}</span>}
                    {i.isAggregate && <span className="ml-1 rounded bg-slate-800 text-white px-1">agg</span>}
                    {i.collapsed && <span className="ml-1 rounded bg-slate-600 text-white px-1">collapsed</span>}
                  </span>
                </td>
                <td className="px-2 py-1 text-right font-mono text-[10px]" title={i.posAbs ? `abs ${Math.round(i.posAbs.x)}, ${Math.round(i.posAbs.y)}` : ''}>
                  {typeof (i.posAbs?.x ?? i.pos?.x) === 'number' ? Math.round(i.posAbs?.x ?? i.pos?.x) : '—'}
                </td>
                <td className="px-2 py-1 text-right font-mono text-[10px]" title={i.posAbs ? `abs ${Math.round(i.posAbs.x)}, ${Math.round(i.posAbs.y)}` : ''}>
                  {typeof (i.posAbs?.y ?? i.pos?.y) === 'number' ? Math.round(i.posAbs?.y ?? i.pos?.y) : '—'}
                </td>
                <td className="px-2 py-1 font-mono text-[10px]">{i.out} / {i.inn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default NodeInspector;
