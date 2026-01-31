import { DuplicateGroup } from '../types';

interface DuplicatesModalProps {
  duplicates: DuplicateGroup[];
  onConfirm: () => void;
  onCancel: () => void;
  theme: 'light' | 'dark';
}

export function DuplicatesModal({ duplicates, onConfirm, onCancel, theme }: DuplicatesModalProps) {
  const totalDuplicates = duplicates.reduce((sum, g) => sum + g.tabs.length - 1, 0);
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Found {totalDuplicates} Duplicate Tab{totalDuplicates !== 1 ? 's' : ''}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            The first tab in each group will be kept, others will be closed.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {duplicates.map((group, index) => (
            <div key={index} className="space-y-2">
              <div className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`} title={group.url}>
                {group.url}
              </div>
              <div className={`space-y-1 pl-2 border-l-2 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                {group.tabs.map((tab, tabIndex) => (
                  <div
                    key={tab.id}
                    className={`flex items-center gap-2 text-sm ${
                      tabIndex === 0
                        ? 'text-green-500'
                        : isDark ? 'text-gray-500 line-through' : 'text-gray-400 line-through'
                    }`}
                  >
                    <span className="text-xs">
                      {tabIndex === 0 ? '✓ Keep' : '✕ Close'}
                    </span>
                    <span className="truncate">{tab.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={`px-4 py-3 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onCancel}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              isDark
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Close {totalDuplicates} Duplicate{totalDuplicates !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
