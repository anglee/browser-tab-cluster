import { useState, useMemo } from 'react';
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
import { Toolbar } from '../components/Toolbar';
import { WindowCard } from '../components/WindowCard';
import { DragOverlay } from '../components/DragOverlay';
import { DuplicatesModal } from '../components/DuplicatesModal';
import { TabInfo, DuplicateGroup, SortOption } from '../types';
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

export default function App() {
  const { windows, loading, error } = useWindows();
  const { query, setQuery, filteredWindows } = useSearch(windows);
  const { theme, toggleTheme } = useTheme();
  const [selectedWindows, setSelectedWindows] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<TabInfo | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const handleDedupe = (windowId: number) => {
    const window = windows.find(w => w.id === windowId);
    if (window) {
      const dups = findDuplicates(window.tabs);
      if (dups.length > 0) {
        setDuplicates(dups);
      }
    }
  };

  const handleDedupeAll = () => {
    const allTabs = windows.flatMap(w => w.tabs);
    const dups = findDuplicates(allTabs);
    if (dups.length > 0) {
      setDuplicates(dups);
    }
  };

  const handleConfirmDedupe = async () => {
    if (duplicates) {
      try {
        await removeDuplicates(duplicates);
      } catch (err) {
        console.error('Failed to remove duplicates:', err);
      }
    }
    setDuplicates(null);
  };

  const handleCancelDedupe = () => {
    setDuplicates(null);
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
        searchQuery={query}
        onSearchChange={setQuery}
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
            {filteredWindows.map(window => (
              <WindowCard
                key={window.id}
                window={window}
                allWindows={windows}
                isSelected={selectedWindows.has(window.id)}
                onSelect={handleSelectWindow}
                onCloseTab={handleCloseTab}
                onCloseWindow={handleCloseWindow}
                onActivateTab={handleActivateTab}
                onFocusWindow={handleFocusWindow}
                onMoveToWindow={handleMoveToWindow}
                onMoveToNewWindow={handleMoveToNewWindow}
                onTogglePin={handleTogglePin}
                onSort={handleSort}
                onDedupe={handleDedupe}
                theme={theme}
              />
            ))}
          </div>

          {filteredWindows.length === 0 && query && (
            <div className="text-center text-gray-500 mt-8">
              No tabs match "{query}"
            </div>
          )}
        </div>

        <DragOverlay activeTab={activeTab} />
      </DndContext>

      {duplicates && duplicates.length > 0 && (
        <DuplicatesModal
          duplicates={duplicates}
          onConfirm={handleConfirmDedupe}
          onCancel={handleCancelDedupe}
          theme={theme}
        />
      )}
    </div>
  );
}
