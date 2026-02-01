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
import { useRecentlyClosed } from '../hooks/useRecentlyClosed';
import { useTheme } from '../hooks/useTheme';
import { Toolbar, ToolbarHandle } from '../components/Toolbar';
import { WindowCard } from '../components/WindowCard';
import { RecentlyClosedCard } from '../components/RecentlyClosedCard';
import { DragOverlay } from '../components/DragOverlay';
import { TabInfo, SortOption } from '../types';
import {
  closeTab,
  closeWindow,
  focusTab,
  moveTab,
  createWindow,
  restoreClosedTab,
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
  | { type: 'tab'; cardIndex: number; tabIndex: number }
  | { type: 'recentlyClosedCard' }
  | { type: 'recentlyClosedTab'; tabIndex: number };

export default function App() {
  const { windows, loading, error } = useWindows();
  const { closedTabs, loading: closedLoading } = useRecentlyClosed();
  const { theme, toggleTheme } = useTheme();
  const [selectedWindows, setSelectedWindows] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<TabInfo | null>(null);
  const [focus, setFocus] = useState<FocusTarget>({ type: 'search' });
  const [searchQuery, setSearchQuery] = useState('');
  const toolbarRef = useRef<ToolbarHandle>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter windows based on search query
  const filteredWindows = useMemo(() => {
    if (!searchQuery.trim()) {
      return windows;
    }
    const lowerQuery = searchQuery.toLowerCase();
    return windows
      .map(window => ({
        ...window,
        tabs: window.tabs.filter(
          tab =>
            tab.title.toLowerCase().includes(lowerQuery) ||
            tab.url.toLowerCase().includes(lowerQuery)
        ),
      }))
      .filter(window => window.tabs.length > 0);
  }, [windows, searchQuery]);

  // Filter closed tabs based on search query
  const filteredClosedTabs = useMemo(() => {
    if (!searchQuery.trim()) {
      return closedTabs;
    }
    const lowerQuery = searchQuery.toLowerCase();
    return closedTabs.filter(
      tab =>
        tab.title.toLowerCase().includes(lowerQuery) ||
        tab.url.toLowerCase().includes(lowerQuery)
    );
  }, [closedTabs, searchQuery]);

  // Helper to focus search input
  const focusSearchInput = useCallback(() => {
    setFocus({ type: 'search' });
    toolbarRef.current?.focusSearch();
  }, []);

  // Sync DOM focus with React focus state
  useEffect(() => {
    if (focus.type === 'search') {
      toolbarRef.current?.focusSearch();
    } else {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [focus.type]);

  // Global keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const windowCardCount = filteredWindows.length;
      const hasRecentlyClosed = filteredClosedTabs.length > 0;
      const totalCardCount = windowCardCount + (hasRecentlyClosed ? 1 : 0);

      if (totalCardCount === 0) return;

      // Escape: clear search and focus search input
      if (e.key === 'Escape') {
        e.preventDefault();
        setSearchQuery('');
        focusSearchInput();
        return;
      }

      // Get current focus context
      const isSearchFocused = focus.type === 'search';
      const isOnRecentlyClosed = focus.type === 'recentlyClosedCard' || focus.type === 'recentlyClosedTab';
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
        } else if (focus.type === 'recentlyClosedCard') {
          // Restore all visible closed tabs
          e.preventDefault();
          handleRestoreAllClosedTabs();
        } else if (focus.type === 'recentlyClosedTab') {
          // Restore the focused closed tab (to original location with switch)
          e.preventDefault();
          const closedTab = filteredClosedTabs[focus.tabIndex];
          if (closedTab) {
            handleRestoreClosedTab(closedTab.sessionId);
          }
        }
        return;
      }

      // Tab key (forward navigation)
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        if (isSearchFocused) {
          // → First card
          if (windowCardCount > 0) {
            setFocus({ type: 'card', cardIndex: 0 });
          } else if (hasRecentlyClosed) {
            setFocus({ type: 'recentlyClosedCard' });
          }
        } else if (isOnRecentlyClosed) {
          // From recently closed → first window card (cycle)
          if (windowCardCount > 0) {
            setFocus({ type: 'card', cardIndex: 0 });
          } else {
            setFocus({ type: 'recentlyClosedCard' });
          }
        } else {
          // From window card
          const nextIndex = currentCardIndex + 1;
          if (nextIndex < windowCardCount) {
            setFocus({ type: 'card', cardIndex: nextIndex });
          } else if (hasRecentlyClosed) {
            setFocus({ type: 'recentlyClosedCard' });
          } else {
            // Cycle to first card
            setFocus({ type: 'card', cardIndex: 0 });
          }
        }
        return;
      }

      // Shift+Tab (backward navigation)
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        if (isSearchFocused) {
          // → Last item (recently closed or last window card)
          if (hasRecentlyClosed) {
            setFocus({ type: 'recentlyClosedCard' });
          } else if (windowCardCount > 0) {
            setFocus({ type: 'card', cardIndex: windowCardCount - 1 });
          }
        } else if (isOnRecentlyClosed) {
          // From recently closed → last window card
          if (windowCardCount > 0) {
            setFocus({ type: 'card', cardIndex: windowCardCount - 1 });
          } else {
            setFocus({ type: 'recentlyClosedCard' });
          }
        } else {
          // From window card
          if (currentCardIndex <= 0) {
            // Cycle to recently closed or last card
            if (hasRecentlyClosed) {
              setFocus({ type: 'recentlyClosedCard' });
            } else {
              setFocus({ type: 'card', cardIndex: windowCardCount - 1 });
            }
          } else {
            setFocus({ type: 'card', cardIndex: currentCardIndex - 1 });
          }
        }
        return;
      }

      // Down arrow
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (isSearchFocused) {
          if (searchQuery.length > 0) {
            // Has text → 2nd item in first window (1st is already highlighted as search candidate)
            const firstWindow = filteredWindows[0];
            if (firstWindow && firstWindow.tabs.length > 1) {
              setFocus({ type: 'tab', cardIndex: 0, tabIndex: 1 });
            } else if (firstWindow && firstWindow.tabs.length === 1) {
              setFocus({ type: 'tab', cardIndex: 0, tabIndex: 0 });
            }
          } else {
            // Empty → first card
            if (windowCardCount > 0) {
              setFocus({ type: 'card', cardIndex: 0 });
            } else if (hasRecentlyClosed) {
              setFocus({ type: 'recentlyClosedCard' });
            }
          }
        } else if (focus.type === 'card') {
          // → First tab in that card
          const window = filteredWindows[focus.cardIndex];
          if (window && window.tabs.length > 0) {
            setFocus({ type: 'tab', cardIndex: focus.cardIndex, tabIndex: 0 });
          }
        } else if (focus.type === 'tab') {
          // → Next tab (cycles within card)
          const window = filteredWindows[focus.cardIndex];
          if (window) {
            const nextIndex = (focus.tabIndex + 1) % window.tabs.length;
            setFocus({ type: 'tab', cardIndex: focus.cardIndex, tabIndex: nextIndex });
          }
        } else if (focus.type === 'recentlyClosedCard') {
          // → First closed tab
          if (filteredClosedTabs.length > 0) {
            setFocus({ type: 'recentlyClosedTab', tabIndex: 0 });
          }
        } else if (focus.type === 'recentlyClosedTab') {
          // → Next closed tab (cycles)
          const nextIndex = (focus.tabIndex + 1) % filteredClosedTabs.length;
          setFocus({ type: 'recentlyClosedTab', tabIndex: nextIndex });
        }
        return;
      }

      // Up arrow
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (isSearchFocused) {
          // → Last item in first window
          const firstWindow = filteredWindows[0];
          if (firstWindow && firstWindow.tabs.length > 0) {
            setFocus({ type: 'tab', cardIndex: 0, tabIndex: firstWindow.tabs.length - 1 });
          }
        } else if (focus.type === 'card') {
          // → Search input
          focusSearchInput();
        } else if (focus.type === 'tab') {
          // → Previous tab (cycles within card)
          const window = filteredWindows[focus.cardIndex];
          if (window) {
            const prevIndex = focus.tabIndex <= 0 ? window.tabs.length - 1 : focus.tabIndex - 1;
            setFocus({ type: 'tab', cardIndex: focus.cardIndex, tabIndex: prevIndex });
          }
        } else if (focus.type === 'recentlyClosedCard') {
          // → Search input
          focusSearchInput();
        } else if (focus.type === 'recentlyClosedTab') {
          // → Previous closed tab (cycles)
          const prevIndex = focus.tabIndex <= 0 ? filteredClosedTabs.length - 1 : focus.tabIndex - 1;
          setFocus({ type: 'recentlyClosedTab', tabIndex: prevIndex });
        }
        return;
      }

      // Left/Right arrows
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (focus.type === 'card' || focus.type === 'tab') {
          e.preventDefault();
          if (e.key === 'ArrowLeft') {
            // → Previous card (cycles)
            if (currentCardIndex <= 0) {
              if (hasRecentlyClosed) {
                setFocus({ type: 'recentlyClosedCard' });
              } else {
                setFocus({ type: 'card', cardIndex: windowCardCount - 1 });
              }
            } else {
              setFocus({ type: 'card', cardIndex: currentCardIndex - 1 });
            }
          } else {
            // → Next card (cycles)
            const nextIndex = currentCardIndex + 1;
            if (nextIndex < windowCardCount) {
              setFocus({ type: 'card', cardIndex: nextIndex });
            } else if (hasRecentlyClosed) {
              setFocus({ type: 'recentlyClosedCard' });
            } else {
              setFocus({ type: 'card', cardIndex: 0 });
            }
          }
        } else if (focus.type === 'recentlyClosedCard' || focus.type === 'recentlyClosedTab') {
          e.preventDefault();
          if (e.key === 'ArrowLeft') {
            // → Last window card
            if (windowCardCount > 0) {
              setFocus({ type: 'card', cardIndex: windowCardCount - 1 });
            }
          } else {
            // → First window card (cycle)
            if (windowCardCount > 0) {
              setFocus({ type: 'card', cardIndex: 0 });
            }
          }
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focus, filteredWindows, filteredClosedTabs, searchQuery, focusSearchInput]);

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
    const focusedWindow = windows.find(w => w.focused && selectedWindows.has(w.id));
    const targetWindowId = focusedWindow ? focusedWindow.id : windowIds[0];
    const sourceWindowIds = windowIds.filter(id => id !== targetWindowId);

    try {
      await mergeWindows(sourceWindowIds, targetWindowId, windows);
      setSelectedWindows(new Set());
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

  // ==========================================================================
  // Recently Closed Tab Handlers
  // ==========================================================================
  //
  // Behavior spec:
  // - SINGLE ITEM (click or context menu): Always switch to the restored tab
  // - BULK (multi-select actions):
  //   - "Original location": Stay on Tab Cluster
  //   - "New window": Switch to the new window
  //   - "Current window": Stay on Tab Cluster
  // ==========================================================================

  // Helper: Switch to a specific tab
  const switchToTab = async (tabId: number, windowId: number) => {
    await chrome.windows.update(windowId, { focused: true });
    await chrome.tabs.update(tabId, { active: true });
  };

  // Helper: Get the current Tab Cluster tab (for switching back later)
  const getTabClusterTab = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  };

  // Helper: Switch back to Tab Cluster tab
  const switchBackToTabCluster = async (tabClusterTab: chrome.tabs.Tab | undefined) => {
    if (tabClusterTab?.id && tabClusterTab?.windowId) {
      await chrome.windows.update(tabClusterTab.windowId, { focused: true });
      await chrome.tabs.update(tabClusterTab.id, { active: true });
    }
  };

  // ---------------------------------------------------------------------------
  // Single Item Handlers - Always switch to the restored tab
  // ---------------------------------------------------------------------------

  const handleRestoreClosedTab = async (sessionId: string) => {
    try {
      const session = await restoreClosedTab(sessionId);
      if (session.tab?.id && session.tab?.windowId) {
        await switchToTab(session.tab.id, session.tab.windowId);
      }
    } catch (err) {
      console.error('Failed to restore closed tab:', err);
    }
  };

  const handleRestoreClosedTabInNewWindow = async (sessionId: string) => {
    try {
      const session = await restoreClosedTab(sessionId);
      if (session.tab?.id) {
        const newWindow = await chrome.windows.create({ tabId: session.tab.id });
        if (newWindow.id) {
          await chrome.windows.update(newWindow.id, { focused: true });
        }
      }
    } catch (err) {
      console.error('Failed to restore closed tab:', err);
    }
  };

  const handleRestoreClosedTabInCurrentWindow = async (sessionId: string) => {
    try {
      const currentWindow = await chrome.windows.getCurrent();
      const session = await restoreClosedTab(sessionId);
      if (session.tab?.id && currentWindow.id) {
        await chrome.tabs.move(session.tab.id, { windowId: currentWindow.id, index: -1 });
        await switchToTab(session.tab.id, currentWindow.id);
      }
    } catch (err) {
      console.error('Failed to restore closed tab:', err);
    }
  };

  const handleRestoreClosedTabToWindow = async (sessionId: string, windowId: number) => {
    try {
      const session = await restoreClosedTab(sessionId);
      if (session.tab?.id) {
        await chrome.tabs.move(session.tab.id, { windowId, index: -1 });
        await switchToTab(session.tab.id, windowId);
      }
    } catch (err) {
      console.error('Failed to restore closed tab to window:', err);
    }
  };

  const handleDeleteClosedTab = async (_sessionId: string) => {
    // Chrome's sessions API doesn't support deleting individual items.
    // Items are removed from the list when restored.
    console.warn('Delete from history is not supported by Chrome sessions API');
  };

  // ---------------------------------------------------------------------------
  // Bulk Handlers - Stay on Tab Cluster (except "New window" which switches)
  // ---------------------------------------------------------------------------

  const handleBulkRestoreClosedTabs = async (sessionIds: string[]) => {
    const tabClusterTab = await getTabClusterTab();

    for (const sessionId of sessionIds) {
      try {
        await restoreClosedTab(sessionId);
      } catch (err) {
        console.error('Failed to restore closed tab:', err);
      }
    }

    await switchBackToTabCluster(tabClusterTab);
  };

  const handleBulkRestoreClosedTabsInNewWindow = async (sessionIds: string[]) => {
    const restoredTabIds: number[] = [];

    for (const sessionId of sessionIds) {
      try {
        const session = await restoreClosedTab(sessionId);
        if (session.tab?.id) {
          restoredTabIds.push(session.tab.id);
        }
      } catch (err) {
        console.error('Failed to restore closed tab:', err);
      }
    }

    if (restoredTabIds.length > 0) {
      try {
        const [firstTabId, ...restTabIds] = restoredTabIds;
        const newWindow = await chrome.windows.create({ tabId: firstTabId });
        if (newWindow.id) {
          if (restTabIds.length > 0) {
            await chrome.tabs.move(restTabIds, { windowId: newWindow.id, index: -1 });
          }
          await chrome.windows.update(newWindow.id, { focused: true });
        }
      } catch (err) {
        console.error('Failed to move tabs to new window:', err);
      }
    }
  };

  const handleBulkRestoreClosedTabsInCurrentWindow = async (sessionIds: string[]) => {
    const currentWindow = await chrome.windows.getCurrent();
    if (!currentWindow.id) return;

    const tabClusterTab = await getTabClusterTab();

    for (const sessionId of sessionIds) {
      try {
        const session = await restoreClosedTab(sessionId);
        if (session.tab?.id) {
          await chrome.tabs.move(session.tab.id, { windowId: currentWindow.id, index: -1 });
        }
      } catch (err) {
        console.error('Failed to restore closed tab:', err);
      }
    }

    await switchBackToTabCluster(tabClusterTab);
  };

  const handleBulkRestoreClosedTabsToWindow = async (sessionIds: string[], windowId: number) => {
    const tabClusterTab = await getTabClusterTab();

    for (const sessionId of sessionIds) {
      try {
        const session = await restoreClosedTab(sessionId);
        if (session.tab?.id) {
          await chrome.tabs.move(session.tab.id, { windowId, index: -1 });
        }
      } catch (err) {
        console.error('Failed to restore closed tab to window:', err);
      }
    }

    await switchBackToTabCluster(tabClusterTab);
  };

  // ---------------------------------------------------------------------------
  // Restore All / Clear All Handlers
  // ---------------------------------------------------------------------------

  const handleRestoreAllClosedTabs = async () => {
    const sessionIds = filteredClosedTabs.map(tab => tab.sessionId);
    await handleBulkRestoreClosedTabsInNewWindow(sessionIds);
  };

  const handleClearAllClosedTabs = async () => {
    // Chrome's sessions API doesn't support clearing history directly.
    console.warn('Clear history is not directly supported by Chrome sessions API');
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

    if (overId.startsWith('window-')) {
      const targetWindowId = parseInt(overId.replace('window-', ''), 10);
      try {
        await moveTab(tabId, targetWindowId, -1);
      } catch (err) {
        console.error('Failed to move tab:', err);
      }
      return;
    }

    if (overId.startsWith('tab-')) {
      const overTabId = parseInt(overId.replace('tab-', ''), 10);

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

  if (loading || closedLoading) {
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

  const isRecentlyClosedCardFocused = focus.type === 'recentlyClosedCard';
  const recentlyClosedFocusedTabIndex = focus.type === 'recentlyClosedTab' ? focus.tabIndex : -1;

  return (
    <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <Toolbar
        ref={toolbarRef}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
              const searchCandidateTabIndex = focus.type === 'search' && searchQuery.length > 0 && cardIndex === 0 ? 0 : -1;

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

            {/* Recently Closed Card - always last */}
            {filteredClosedTabs.length > 0 && (
              <RecentlyClosedCard
                closedTabs={filteredClosedTabs}
                windows={windows}
                isCardFocused={isRecentlyClosedCardFocused}
                focusedTabIndex={recentlyClosedFocusedTabIndex}
                searchCandidateTabIndex={-1}
                onRestore={handleRestoreClosedTab}
                onRestoreInNewWindow={handleRestoreClosedTabInNewWindow}
                onRestoreInCurrentWindow={handleRestoreClosedTabInCurrentWindow}
                onRestoreToWindow={handleRestoreClosedTabToWindow}
                onDelete={handleDeleteClosedTab}
                onBulkRestore={handleBulkRestoreClosedTabs}
                onBulkRestoreInNewWindow={handleBulkRestoreClosedTabsInNewWindow}
                onBulkRestoreInCurrentWindow={handleBulkRestoreClosedTabsInCurrentWindow}
                onBulkRestoreToWindow={handleBulkRestoreClosedTabsToWindow}
                onRestoreAll={handleRestoreAllClosedTabs}
                onClearAll={handleClearAllClosedTabs}
                theme={theme}
              />
            )}
          </div>

          {filteredWindows.length === 0 && filteredClosedTabs.length === 0 && searchQuery && (
            <div className="text-center text-gray-500 mt-8">
              No tabs match "{searchQuery}"
            </div>
          )}
        </div>

        <DragOverlay activeTab={activeTab} />
      </DndContext>
    </div>
  );
}
