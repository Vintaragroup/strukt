# Phase 1 Integration Testing Plan

**Project**: Visual Requirements Whiteboard  
**Phase**: 1 - Enhanced Node UI with Content System  
**Date**: October 22, 2025  
**Status**: Ready for Manual Testing

---

## Overview

Phase 1 implementation adds action menus and content system to nodes. This document outlines comprehensive test scenarios to validate functionality.

### Files Modified/Created

**New Files** (3):
- ✅ `client/src/components/NodeActionMenu.tsx` - Menu component with 4 content types
- ✅ `client/src/components/ContentEditor.tsx` - Modal for editing content
- ✅ `client/src/components/NodeActionMenu.css` - Menu styling reference
- ✅ `client/src/components/ContentEditor.css` - Editor modal styling

**Modified Files** (6):
- ✅ `client/src/types/index.ts` - Added ContentType, Content interface, store actions
- ✅ `client/src/store/useWorkspaceStore.ts` - Added addNodeContent, updateNodeContent, deleteNodeContent
- ✅ `client/src/components/NodeTypes/RootNode.tsx` - Integrated menu and badges
- ✅ `client/src/components/NodeTypes/FrontendNode.tsx` - Integrated menu and badges
- ✅ `client/src/components/NodeTypes/BackendNode.tsx` - Integrated menu and badges
- ✅ `client/src/components/NodeTypes/RequirementNode.tsx` - Integrated menu and badges
- ✅ `client/src/components/NodeTypes/DocNode.tsx` - Integrated menu and badges
- ✅ `client/src/components/NodeTypes/Node.css` - Added menu, badge, and header styles

**Build Status**: ✅ Success (TypeScript compilation: 0 errors, Vite build: 263 modules)

---

## Test Environment

**Infrastructure**:
- ✅ Docker Compose: 4 containers running
  - whiteboard-mongo (port 27019)
  - whiteboard-mongo-express (port 8081)
  - whiteboard-server (port 5050)
  - whiteboard-client (port 5174)

**Access Points**:
- Application: http://localhost:5174
- Server API: http://localhost:5050
- Mongo Admin: http://localhost:8081

---

## Test Scenarios

### Scenario 1: Add Content to Node

**Steps**:
1. Open http://localhost:5174
2. Verify default Root node is visible
3. Click the **+** button on the Root node
4. A menu appears with 4 options: Text, To-Do, Get Help, Generate PRD
5. Click "Text"
6. Verify a text content badge (📝) appears on the node
7. Verify node displays in "node-content-badges" section

**Expected Results**:
- ✅ Menu opens when clicking +
- ✅ Menu displays all 4 content types
- ✅ Menu closes after selecting
- ✅ Badge appears immediately
- ✅ Badge shows correct emoji
- ✅ Badge styling matches design

**Acceptance**: **PASS** / **FAIL**

---

### Scenario 2: Add Multiple Content Types

**Steps**:
1. From Scenario 1 (Root node already has Text content)
2. Click + on Root node again
3. Click "To-Do"
4. Verify ✓ badge appears
5. Click + again
6. Click "Get Help"
7. Verify ❓ badge appears
8. Click + again
9. Click "Generate PRD"
10. Verify 📋 badge appears

**Expected Results**:
- ✅ Multiple badges visible on same node
- ✅ All 4 badges can coexist
- ✅ Badges displayed in row with proper spacing
- ✅ Badges don't overflow node width

**Acceptance**: **PASS** / **FAIL**

---

### Scenario 3: Edit Content via Modal

**Steps**:
1. From Scenario 2 (node has multiple content items)
2. Click on any content badge (e.g., Text badge)
3. ContentEditor modal opens
4. Modal shows:
   - Title input with current value
   - Content textarea with current value
   - Type badge showing content type
   - Created date
   - Delete, Cancel, Save buttons
5. Edit title: Change to "My Project Summary"
6. Edit content: Add "This is a test project"
7. Click Save
8. Modal closes
9. Badge still visible

**Expected Results**:
- ✅ Modal opens on badge click
- ✅ Fields populated with current content
- ✅ Edits update correctly in store
- ✅ Modal closes after save
- ✅ Changes visible in node

**Acceptance**: **PASS** / **FAIL**

---

### Scenario 4: Delete Content

**Steps**:
1. From Scenario 3 (node has multiple content items)
2. Click on a content badge
3. Modal opens
4. Click Delete button
5. Confirm in alert
6. Verify badge is removed from node
7. Verify other badges remain

**Expected Results**:
- ✅ Delete button triggers confirmation
- ✅ Content removed from node
- ✅ Badge disappears
- ✅ Other badges unchanged
- ✅ Store updated correctly

**Acceptance**: **PASS** / **FAIL**

---

### Scenario 5: Undo/Redo Content Changes

**Steps**:
1. Start with fresh node
2. Click + and add Text content
3. Verify badge appears
4. Click Undo button in toolbar
5. Verify badge disappears
6. Verify content removed from store
7. Click Redo button
8. Verify badge reappears
9. Verify content restored

**Expected Results**:
- ✅ Undo removes content
- ✅ Redo restores content
- ✅ History limit respected (50 steps max)
- ✅ UI reflects state immediately

**Acceptance**: **PASS** / **FAIL**

---

### Scenario 6: Save and Load Persistence

**Steps**:
1. Add Frontend node
2. Click +, add Text content to Frontend node
3. Add Backend node
4. Click +, add To-Do content to Backend node
5. Save workspace as "test-phase-1"
6. Verify save dialog closes
7. Close tab / refresh page
8. Click Load button
9. Select "test-phase-1"
10. Verify Frontend node has Text badge
11. Verify Backend node has To-Do badge
12. Edit one content, change title
13. Save again
14. Load again
15. Verify changes persisted

**Expected Results**:
- ✅ Content saved with workspace
- ✅ Content restored on load
- ✅ All badges visible after load
- ✅ Content edits persisted
- ✅ No data loss on refresh

**Acceptance**: **PASS** / **FAIL**

---

### Scenario 7: Content on All Node Types

**Steps**:
1. Add node for each type: Frontend, Backend, Requirement, Doc
2. For each node:
   - Click +
   - Add Text content
   - Verify badge appears
3. Verify all 5 node types display badges correctly

**Expected Results**:
- ✅ All node types support content
- ✅ Menu works on all types
- ✅ Badges display on all types
- ✅ No TypeErrors in console

**Acceptance**: **PASS** / **FAIL**

---

### Scenario 8: Menu Interaction

**Steps**:
1. Click + on a node
2. Menu appears
3. Hover over "Text" option
4. Verify styling changes (color changes, highlight)
5. Move mouse away
6. Verify styling reverts
7. Click outside menu
8. Verify menu closes

**Expected Results**:
- ✅ Menu opens/closes smoothly
- ✅ Hover effects work
- ✅ Click-outside closes menu
- ✅ No flickering or lag

**Acceptance**: **PASS** / **FAIL**

---

### Scenario 9: Keyboard Shortcuts

**Steps**:
1. With menu open, press Escape key
2. Verify menu closes

**Expected Results**:
- ✅ Escape closes menu
- ✅ Node remains selected
- ✅ No error in console

**Acceptance**: **PASS** / **FAIL**

---

### Scenario 10: Mobile Responsiveness

**Steps** (in browser DevTools):
1. Toggle device toolbar (mobile view)
2. Set viewport to iPhone 12 (390x844)
3. Perform Scenario 1 (add content)
4. Verify menu is readable on small screen
5. Verify badges don't overflow
6. Verify modal is usable on mobile

**Expected Results**:
- ✅ Menu fits on mobile screen
- ✅ Modal is accessible
- ✅ Touch interactions work
- ✅ No horizontal scroll needed

**Acceptance**: **PASS** / **FAIL**

---

### Scenario 11: Content Type Icons

**Steps**:
1. Add each content type to a node
2. Verify correct emoji displays:
   - Text: 📝
   - To-Do: ✓
   - Get Help: ❓
   - Generate PRD: 📋

**Expected Results**:
- ✅ All emojis display correctly
- ✅ Icons are recognizable
- ✅ Colors match design

**Acceptance**: **PASS** / **FAIL**

---

### Scenario 12: Performance Check

**Steps**:
1. Add 20 nodes to canvas
2. Add content to 15 of them
3. Each node has 2-3 content items
4. Perform interactions:
   - Open/close menus
   - Add more content
   - Edit content
   - Undo/redo multiple times
5. Check browser console for errors
6. Monitor for lag or slowdown

**Expected Results**:
- ✅ No console errors
- ✅ Smooth animations (60fps)
- ✅ UI responsive
- ✅ No memory leaks
- ✅ Undo/redo fast

**Acceptance**: **PASS** / **FAIL**

---

## Manual Test Checklist

### Pre-Test Setup
- [ ] Verify Docker containers running: `docker-compose ps`
- [ ] Visit http://localhost:5174 in browser
- [ ] Open browser DevTools Console (check for errors)
- [ ] Clear browser cache/cookies

### Tests to Execute
- [ ] Scenario 1: Add Content to Node
- [ ] Scenario 2: Add Multiple Content Types
- [ ] Scenario 3: Edit Content via Modal
- [ ] Scenario 4: Delete Content
- [ ] Scenario 5: Undo/Redo Content Changes
- [ ] Scenario 6: Save and Load Persistence
- [ ] Scenario 7: Content on All Node Types
- [ ] Scenario 8: Menu Interaction
- [ ] Scenario 9: Keyboard Shortcuts
- [ ] Scenario 10: Mobile Responsiveness
- [ ] Scenario 11: Content Type Icons
- [ ] Scenario 12: Performance Check

### Results Summary
- [ ] All scenarios: PASS
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No performance issues
- [ ] Mobile view acceptable

---

## Success Criteria (All Must Pass)

✅ **Code Quality**:
- 0 TypeScript errors
- 0 console warnings/errors  
- All 12 scenarios pass
- No memory leaks

✅ **Functionality**:
- Content can be added to all node types
- Content persists on undo/redo
- Content persists on save/load
- Menu interactions smooth and responsive

✅ **UX**:
- Icons recognizable
- Badges clearly visible
- Modal easy to use
- Mobile view acceptable
- Performance smooth

✅ **Documentation**:
- Tests documented
- Issues logged
- Fixes tracked
- Ready for Phase 2

---

## Known Issues / Notes

*To be filled during testing*

---

## Sign-Off

**Tester**: [Your Name]  
**Date**: [Date of Testing]  
**Status**: **PENDING** / **PASS** / **FAIL**

**Comments**:
```
[Add any notes or observations]
```

---

**Next Step**: After all tests pass, proceed to Task 1.9 (Documentation Update).
