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
      <div className={`rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col ring-1 ${
        isDark ? 'bg-mist-900 ring-white/10' : 'bg-mist-50 ring-mist-950/10'
      }`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-mist-950/10'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-mist-100' : 'text-mist-950'}`}>
            Found {totalDuplicates} Duplicate Tab{totalDuplicates !== 1 ? 's' : ''}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-mist-400' : 'text-mist-500'}`}>
            The first tab in each group will be kept, others will be closed.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {duplicates.map((group, index) => (
            <div key={index} className="space-y-2">
              <div className={`text-xs truncate ${isDark ? 'text-mist-400' : 'text-mist-500'}`} title={group.url}>
                {group.url}
              </div>
              <div className={`space-y-1 pl-2 border-l-2 ${isDark ? 'border-white/10' : 'border-mist-950/10'}`}>
                {group.tabs.map((tab, tabIndex) => (
                  <div
                    key={tab.id}
                    className={`flex items-center gap-2 text-sm ${
                      tabIndex === 0
                        ? 'text-green-500'
                        : isDark ? 'text-mist-500 line-through' : 'text-mist-400 line-through'
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

        <div className={`px-4 py-3 border-t flex justify-end gap-3 ${isDark ? 'border-white/10' : 'border-mist-950/10'}`}>
          <button
            onClick={onCancel}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              isDark
                ? 'text-mist-300 hover:text-white hover:bg-mist-700'
                : 'text-mist-600 hover:text-mist-950 hover:bg-mist-100'
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
