interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  tabCount: number;
  windowCount: number;
  selectedCount: number;
  onMerge: () => void;
  onDedupeAll: () => void;
  onSortAll: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Toolbar({
  searchQuery,
  onSearchChange,
  tabCount,
  windowCount,
  selectedCount,
  onMerge,
  onDedupeAll,
  onSortAll,
  theme,
  onToggleTheme,
}: ToolbarProps) {
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-2 px-4 py-2 border-b ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Logo */}
      <div className="flex-shrink-0">
        <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z" />
        </svg>
      </div>

      {/* Search */}
      <div className="relative flex-shrink-0 w-64">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          autoFocus
          className={`w-full px-3 py-1.5 pl-8 text-sm border rounded focus:outline-none focus:border-blue-500 ${
            isDark
              ? 'bg-gray-900 border-gray-600 text-gray-100 placeholder-gray-400'
              : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
        <svg
          className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            tabIndex={-1}
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className={`text-sm px-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {windowCount} Windows | {tabCount} Tabs
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* Merge Windows */}
        <button
          onClick={onMerge}
          disabled={selectedCount < 2}
          tabIndex={-1}
          className={`p-2 rounded transition-colors group relative ${
            selectedCount >= 2
              ? isDark
                ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              : isDark
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 cursor-not-allowed'
          }`}
          title={selectedCount >= 2 ? `Merge ${selectedCount} windows` : 'Merge windows. Select 2 or more windows first'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {selectedCount >= 2 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-green-500 text-white rounded-full flex items-center justify-center">
              {selectedCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />

        {/* Dedupe All */}
        <button
          onClick={onDedupeAll}
          tabIndex={-1}
          className={`p-2 rounded transition-colors ${
            isDark
              ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          title="Remove all duplicates"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Sort All */}
        <button
          onClick={onSortAll}
          tabIndex={-1}
          className={`p-2 rounded transition-colors ${
            isDark
              ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          title="Sort all windows by domain"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
        </button>

        {/* Divider */}
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          tabIndex={-1}
          className={`p-2 rounded transition-colors ${
            isDark
              ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
