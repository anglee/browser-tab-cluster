import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useWindows } from '../hooks/useWindows';
import { useSearch } from '../hooks/useSearch';
import { useTheme } from '../hooks/useTheme';
import { Toolbar, ToolbarHandle } from '../components/Toolbar';
import { WindowCard } from '../components/WindowCard';
import { DragOverlay } from '../components/DragOverlay';
import { TabInfo, SortOption } from '../types';
import {
  closeTab,
  closeWindow,
  focusTab,
  moveTab,
  createWindow,
} from '../services/chromeApi';
import {
  mergeWindows,
  applySortToWindow,
  findDuplicates,
  removeDuplicates,
} from '../services/tabOperations';

type FocusTarget =
  | { type: 'search' }
  | { type: 'card'; cardIndex: number }
  | { type: 'tab'; cardIndex: number; tabIndex: number };

export default function App() {
  const { windows, loading, error } = useWindows();
  const { query, setQuery, filteredWindows } = useSearch(windows);
  const { theme, toggleTheme } = useTheme();
  const [selectedWindows, setSelectedWindows] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<TabInfo | null>(null);
  const [focus, setFocus] = useState<FocusTarget>({ type: 'search' });
  const toolbarRef = useRef<ToolbarHandle>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Helper to focus search input
  const focusSearchInput = useCallback(() => {
    setFocus({ type: 'search' });
    toolbarRef.current?.focusSearch();
  }, []);

  // Sync DOM focus with React focus state
  useEffect(() => {
    if (focus.type === 'search') {
      // Focus the search input when React state says search is focused
      toolbarRef.current?.focusSearch();
    } else {
      // Blur the search input when focus moves to card/tab
      // This prevents the confusing dual-focus state
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [focus.type]);

  // Global keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const cardCount = filteredWindows.length;
      if (cardCount === 0) return;

      // Escape: clear search and focus search input
      if (e.key === 'Escape') {
        e.preventDefault();
        setQuery('');
        focusSearchInput();
        return;
      }

      // Get current focus context
      const isSearchFocused = focus.type === 'search';
      const currentCardIndex = focus.type === 'card' ? focus.cardIndex : focus.type === 'tab' ? focus.cardIndex : -1;

      // Enter key
      if (e.key === 'Enter') {
        if (isSearchFocused) {
          // Switch to first tab in first window
          const firstWindow = filteredWindows[0];
          const firstTab = firstWindow?.tabs[0];
          if (firstTab) {
            e.preventDefault();
            handleActivateTab(firstTab.id, firstWindow.id);
          }
        } else if (focus.type === 'card') {
          // Focus the Chrome window
          e.preventDefault();
          handleFocusWindow(filteredWindows[focus.cardIndex].id);
        } else if (focus.type === 'tab') {
          // Activate the tab
          e.preventDefault();
          const window = filteredWindows[focus.cardIndex];
          const tab = window?.tabs[focus.tabIndex];
          if (tab) {
            handleActivateTab(tab.id, window.id);
          }
        }
        return;
      }

      // Tab key (forward navigation)
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        if (isSearchFocused) {
          // → First card
          setFocus({ type: 'card', cardIndex: 0 });
        } else {
          // → Next card (cycles: last → first)
          const nextIndex = (currentCardIndex + 1) % cardCount;
          setFocus({ type: 'card', cardIndex: nextIndex });
        }
        return;
      }

      // Shift+Tab (backward navigation)
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        if (isSearchFocused) {
          // → Last card
          setFocus({ type: 'card', cardIndex: cardCount - 1 });
        } else {
          // → Previous card (cycles: first → last)
          const prevIndex = currentCardIndex <= 0 ? cardCount - 1 : currentCardIndex - 1;
          setFocus({ type: 'card', cardIndex: prevIndex });
        }
        return;
      }

      // Down arrow
      if (e.key === 'ArrowDown') {
        if (isSearchFocused) {
          e.preventDefault();
          if (query.length > 0) {
            // Has text → 2nd item in first window (1st is already highlighted as search candidate)
            const firstWindow = filteredWindows[0];
            if (firstWindow && firstWindow.tabs.length > 1) {
              setFocus({ type: 'tab', cardIndex: 0, tabIndex: 1 });
            } else if (firstWindow && firstWindow.tabs.length === 1) {
              // Only one tab, stay on it
              setFocus({ type: 'tab', cardIndex: 0, tabIndex: 0 });
            }
          } else {
            // Empty → first card
            setFocus({ type: 'card', cardIndex: 0 });
          }
        } else if (focus.type === 'card') {
          e.preventDefault();
          // → First tab in that card
          const window = filteredWindows[focus.cardIndex];
          if (window && window.tabs.length > 0) {
            setFocus({ type: 'tab', cardIndex: focus.cardIndex, tabIndex: 0 });
          }
        } else if (focus.type === 'tab') {
          e.preventDefault();
          // → Next tab (cycles within card)
          const window = filteredWindows[focus.cardIndex];
          if (window) {
            const nextIndex = (focus.tabIndex + 1) % window.tabs.length;
            setFocus({ type: 'tab', cardIndex: focus.cardIndex, tabIndex: nextIndex });
          }
        }
        return;
      }

      // Up arrow
      if (e.key === 'ArrowUp') {
        if (isSearchFocused) {
          e.preventDefault();
          // → Last item in first window
          const firstWindow = filteredWindows[0];
          if (firstWindow && firstWindow.tabs.length > 0) {
            setFocus({ type: 'tab', cardIndex: 0, tabIndex: firstWindow.tabs.length - 1 });
          }
        } else if (focus.type === 'card') {
          e.preventDefault();
          // → Search input
          focusSearchInput();
        } else if (focus.type === 'tab') {
          e.preventDefault();
          // → Previous tab (cycles within card)
          const window = filteredWindows[focus.cardIndex];
          if (window) {
            const prevIndex = focus.tabIndex <= 0 ? window.tabs.length - 1 : focus.tabIndex - 1;
            setFocus({ type: 'tab', cardIndex: focus.cardIndex, tabIndex: prevIndex });
          }
        }
        return;
      }

      // Left/Right arrows - only handle when focus is on card or tab (not search, to allow text editing)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (focus.type === 'card' || focus.type === 'tab') {
          e.preventDefault();
          if (e.key === 'ArrowLeft') {
            // → Previous card (cycles)
            const prevIndex = currentCardIndex <= 0 ? cardCount - 1 : currentCardIndex - 1;
            setFocus({ type: 'card', cardIndex: prevIndex });
          } else {
            // → Next card (cycles)
            const nextIndex = (currentCardIndex + 1) % cardCount;
            setFocus({ type: 'card', cardIndex: nextIndex });
          }
        }
        // If focus is on search, let default behavior happen (cursor movement)
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focus, filteredWindows, query, focusSearchInput, setQuery]);

  const totalTabs = useMemo(
    () => windows.reduce((sum, w) => sum + w.tabs.length, 0),
    [windows]
  );

  const handleSelectWindow = (windowId: number, selected: boolean) => {
    setSelectedWindows(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(windowId);
      } else {
        next.delete(windowId);
      }
      return next;
    });
  };

  const handleCloseTab = async (tabId: number) => {
    try {
      await closeTab(tabId);
    } catch (err) {
      console.error('Failed to close tab:', err);
    }
  };

  const handleCloseWindow = async (windowId: number) => {
    try {
      await closeWindow(windowId);
      setSelectedWindows(prev => {
        const next = new Set(prev);
        next.delete(windowId);
        return next;
      });
    } catch (err) {
      console.error('Failed to close window:', err);
    }
  };

  const handleActivateTab = async (tabId: number, windowId: number) => {
    try {
      await focusTab(tabId, windowId);
    } catch (err) {
      console.error('Failed to activate tab:', err);
    }
  };

  const handleFocusWindow = async (windowId: number) => {
    try {
      await chrome.windows.update(windowId, { focused: true });
    } catch (err) {
      console.error('Failed to focus window:', err);
    }
  };

  const handleMoveToWindow = async (tabId: number, targetWindowId: number) => {
    try {
      await moveTab(tabId, targetWindowId, -1);
    } catch (err) {
      console.error('Failed to move tab to window:', err);
    }
  };

  const handleMoveToNewWindow = async (tabId: number) => {
    try {
      await createWindow([tabId]);
    } catch (err) {
      console.error('Failed to move tab to new window:', err);
    }
  };

  const handleTogglePin = async (tabId: number, pinned: boolean) => {
    try {
      await chrome.tabs.update(tabId, { pinned });
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handleSort = async (windowId: number, option: SortOption) => {
    const window = windows.find(w => w.id === windowId);
    if (window) {
      try {
        await applySortToWindow(windowId, window.tabs, option);
      } catch (err) {
        console.error('Failed to sort tabs:', err);
      }
    }
  };

  const handleDedupe = async (windowId: number) => {
    const window = windows.find(w => w.id === windowId);
    if (window) {
      const dups = findDuplicates(window.tabs);
      if (dups.length > 0) {
        try {
          await removeDuplicates(dups);
        } catch (err) {
          console.error('Failed to remove duplicates:', err);
        }
      }
    }
  };

  const handleDedupeAll = async () => {
    const allTabs = windows.flatMap(w => w.tabs);
    const dups = findDuplicates(allTabs);
    if (dups.length > 0) {
      try {
        await removeDuplicates(dups);
      } catch (err) {
        console.error('Failed to remove duplicates:', err);
      }
    }
  };

  const handleMerge = async () => {
    if (selectedWindows.size < 2) return;

    const windowIds = Array.from(selectedWindows);

    // If the current (focused) window is among selected, use it as target
    // so we don't lose sight of the Tab Cluster
    const focusedWindow = windows.find(w => w.focused && selectedWindows.has(w.id));
    const targetWindowId = focusedWindow ? focusedWindow.id : windowIds[0];
    const sourceWindowIds = windowIds.filter(id => id !== targetWindowId);

    try {
      await mergeWindows(sourceWindowIds, targetWindowId, windows);
      setSelectedWindows(new Set());
      // Focus the target window to ensure Tab Cluster stays visible
      await chrome.windows.update(targetWindowId, { focused: true });
    } catch (err) {
      console.error('Failed to merge windows:', err);
    }
  };

  const handleSortAll = async () => {
    for (const window of windows) {
      try {
        await applySortToWindow(window.id, window.tabs, 'domain');
      } catch (err) {
        console.error('Failed to sort window:', err);
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const tabId = parseInt(String(active.id).replace('tab-', ''), 10);

    for (const window of windows) {
      const tab = window.tabs.find(t => t.id === tabId);
      if (tab) {
        setActiveTab(tab);
        break;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTab(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const tabId = parseInt(activeId.replace('tab-', ''), 10);

    // Check if dropped on a window
    if (overId.startsWith('window-')) {
      const targetWindowId = parseInt(overId.replace('window-', ''), 10);
      try {
        await moveTab(tabId, targetWindowId, -1);
      } catch (err) {
        console.error('Failed to move tab:', err);
      }
      return;
    }

    // Dropped on another tab - find its position
    if (overId.startsWith('tab-')) {
      const overTabId = parseInt(overId.replace('tab-', ''), 10);

      // Find the target window and tab
      for (const window of windows) {
        const overTab = window.tabs.find(t => t.id === overTabId);
        if (overTab) {
          try {
            await moveTab(tabId, window.id, overTab.index);
          } catch (err) {
            console.error('Failed to move tab:', err);
          }
          break;
        }
      }
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} text-red-400`}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <Toolbar
        ref={toolbarRef}
        searchQuery={query}
        onSearchChange={setQuery}
        onFocus={() => setFocus({ type: 'search' })}
        tabCount={totalTabs}
        windowCount={windows.length}
        selectedCount={selectedWindows.size}
        onMerge={handleMerge}
        onDedupeAll={handleDedupeAll}
        onSortAll={handleSortAll}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-auto p-4">
          <div className="columns-1 md:columns-2 2xl:columns-3 gap-4">
            {filteredWindows.map((window, cardIndex) => {
              const isCardFocused = focus.type === 'card' && focus.cardIndex === cardIndex;
              const focusedTabIndex = focus.type === 'tab' && focus.cardIndex === cardIndex ? focus.tabIndex : -1;
              // Show search candidate highlight on first tab of first card when search has text and focus is on search
              const searchCandidateTabIndex = focus.type === 'search' && query.length > 0 && cardIndex === 0 ? 0 : -1;

              return (
                <WindowCard
                  key={window.id}
                  window={window}
                  allWindows={windows}
                  isSelected={selectedWindows.has(window.id)}
                  isCardFocused={isCardFocused}
                  focusedTabIndex={focusedTabIndex}
                  searchCandidateTabIndex={searchCandidateTabIndex}
                  onSelect={handleSelectWindow}
                  onCloseTab={handleCloseTab}
                  onCloseWindow={handleCloseWindow}
                  onActivateTab={handleActivateTab}
                  onMoveToWindow={handleMoveToWindow}
                  onMoveToNewWindow={handleMoveToNewWindow}
                  onTogglePin={handleTogglePin}
                  onSort={handleSort}
                  onDedupe={handleDedupe}
                  theme={theme}
                />
              );
            })}
          </div>

          {filteredWindows.length === 0 && query && (
            <div className="text-center text-gray-500 mt-8">
              No tabs match "{query}"
            </div>
          )}
        </div>

        <DragOverlay activeTab={activeTab} />
      </DndContext>
    </div>
  );
}
