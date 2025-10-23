# 📋 Phase 1: Enhanced Node UI with Action Menus

## Overview
Upgrade node cards to support interactive action menus enabling users to add content (text, to-do items, help documentation, PRD generation hints) to each node directly from the canvas.

## Current State
- ✅ 5 node types exist (Root, Frontend, Backend, Requirement, Doc)
- ✅ Basic double-click editing implemented
- ❌ No action menu UI
- ❌ No content type system
- ❌ No inline multi-content support

## Target State
- ✅ Each node has an "Add Content" menu
- ✅ Content options: Text, To-Do, Get Help, Generate PRD
- ✅ Visual badges/icons on nodes showing content type
- ✅ Inline content editing
- ✅ Store content metadata in node data

---

## Task Breakdown

### Task 1.1: Update Type Definitions
**File**: `client/src/types/index.ts`
**Goal**: Extend node data structure to support content types

Changes needed:
- Add `ContentType` enum: `TEXT | TODO | HELP | PRD`
- Add `Content` interface with `{ type, value, metadata }`
- Extend `WorkspaceNodeData` to include `contents: Content[]`
- Update `WorkspaceNode` to support new data structure

**Acceptance Criteria**:
- TypeScript compilation passes
- New types exported and importable
- Backward compatible with existing nodes

---

### Task 1.2: Create Node Action Menu Component
**File**: `client/src/components/NodeActionMenu.tsx` (NEW)
**Goal**: Reusable menu for node content actions

Implementation:
- Menu triggers on button click (not double-click)
- Options: Add Text, Add To-Do, Get Help, Generate PRD
- Each option has icon and label
- Styled to match design mockup
- Callback props to handle selections

**Acceptance Criteria**:
- Component renders without errors
- All 4 menu options visible
- Click handlers functional
- Styling matches mockup

---

### Task 1.3: Update Node Components with Menu
**Files**: 
- `client/src/components/NodeTypes/RootNode.tsx`
- `client/src/components/NodeTypes/FrontendNode.tsx`
- `client/src/components/NodeTypes/BackendNode.tsx`
- `client/src/components/NodeTypes/RequirementNode.tsx`
- `client/src/components/NodeTypes/DocNode.tsx`

**Goal**: Integrate action menu into all node types

Changes for each:
- Add state management for menu visibility
- Import and render NodeActionMenu
- Add handler for content additions
- Update Zustand store on action
- Show content badges/indicators
- Update styling for new UI

**Acceptance Criteria**:
- All 5 node types have action menu button
- Menu appears/disappears on click
- Store updates when content added
- No console errors or warnings
- Nodes render correctly in canvas

---

### Task 1.4: Add Content Display to Nodes
**File**: `client/src/components/NodeTypes/Node.css` (update)
**Goal**: Visual feedback for node contents

Styling needed:
- Content badges (small icons indicating content type)
- Badge positioning on node corner
- Hover effects on content indicators
- Animation when content added
- Responsive layout

**Acceptance Criteria**:
- Content badges render
- Multiple badges display without overlap
- Hover states work
- Mobile responsive
- Performance acceptable

---

### Task 1.5: Update Zustand Store
**File**: `client/src/store/useWorkspaceStore.ts` (update)
**Goal**: Handle content mutations

New actions needed:
- `addNodeContent(nodeId, contentType, value)` - Add content to node
- `updateNodeContent(nodeId, contentIndex, value)` - Edit existing content
- `deleteNodeContent(nodeId, contentIndex)` - Remove content
- Ensure undo/redo works with content changes

**Acceptance Criteria**:
- All new actions functional
- TypeScript types correct
- Undo/redo preserves content state
- No breaking changes to existing store

---

### Task 1.6: Update Toolbar for Content Actions
**File**: `client/src/components/Toolbar.tsx` (update)
**Goal**: Expose content API to toolbar

Changes:
- Add handler for receiving node selection
- Pass selected node data to content creation
- Show content summary in node info
- Update load/save to preserve content

**Acceptance Criteria**:
- Toolbar reflects content additions
- Save/load preserves all content
- No UI conflicts or overlaps

---

### Task 1.7: Create Content Editor Modal
**File**: `client/src/components/ContentEditor.tsx` (NEW)
**Goal**: UI for editing node content

Implementation:
- Modal/drawer for viewing/editing content
- Support different input types (text, checkbox for todos, etc.)
- Save/cancel buttons
- Delete content option
- Keyboard shortcuts (Esc to close)

**Acceptance Criteria**:
- Modal opens/closes properly
- Content editable
- Changes persist to store
- Esc key closes modal
- Mobile friendly

---

### Task 1.8: Integration Testing
**Goal**: Verify Phase 1 complete end-to-end

Test scenarios:
1. Add node → Click menu → Select "Add Text" → Enter text → Verify badge shows
2. Add node → Add multiple content types → All badges visible
3. Edit content → Close → Reopen → Content persists
4. Add content → Undo → Content removed
5. Save workspace → Close → Load → Content restored
6. Keyboard shortcuts work (Escape closes menu)

**Acceptance Criteria**:
- All 6 scenarios pass
- No console errors
- Performance acceptable
- UX feels smooth

---

### Task 1.9: Documentation Update
**Files**: 
- `QUICK_REFERENCE.md` (add content operations)
- `BUILD_CHECKLIST.md` (check Phase 1 items)
- `PROGRESS.md` (create - document completion)

Changes:
- Document new content types
- Add usage examples
- Update feature matrix
- Document Phase 1 completion

**Acceptance Criteria**:
- All docs updated
- Examples clear and complete
- New features listed

---

## Implementation Order

1. **Task 1.1** - Types (prerequisite for all others)
2. **Task 1.5** - Store (prerequisite for 1.3)
3. **Task 1.2** - Menu component (foundation)
4. **Task 1.3** - Node integration (main feature)
5. **Task 1.4** - Styling (UX polish)
6. **Task 1.7** - Content editor (supporting feature)
7. **Task 1.6** - Toolbar updates (integration)
8. **Task 1.8** - Testing (validation)
9. **Task 1.9** - Documentation (completion)

## Success Metrics

- [ ] All TypeScript types added
- [ ] Action menus visible on all node types
- [ ] Content can be added via UI
- [ ] Content badges display
- [ ] Undo/redo work with content
- [ ] Save/load preserves content
- [ ] Documentation complete
- [ ] Zero console errors
- [ ] Tested on desktop & mobile viewports

## Estimated Timeline

- Task 1.1: 30 min
- Task 1.2: 1 hour
- Task 1.3: 1.5 hours
- Task 1.4: 45 min
- Task 1.5: 45 min
- Task 1.6: 30 min
- Task 1.7: 1 hour
- Task 1.8: 1 hour
- Task 1.9: 30 min

**Total: ~7 hours** (or 1.5-2 days depending on design iterations)

---

## Dependencies

- React Flow (already installed)
- Zustand (already installed)
- No new npm packages needed (use existing deps)

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Type complexity | High | Break Task 1.1 into smaller type additions |
| Performance with many contents | Medium | Virtualize content lists if needed |
| Mobile UX for menus | Medium | Test early on mobile, adjust spacing |
| Undo/redo state bloat | Low | Keep history entries minimal |

---

## Notes

- Keep backward compatibility with existing nodes
- Prefer component composition over modification
- Use containerized dev environment (already running)
- Test in hot-reload to verify updates
- Commit after each 2-3 tasks
