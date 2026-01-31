import {
  AppstoreOutlined,
  SearchOutlined,
  CloseOutlined,
  ForkOutlined,
  MergeOutlined,
  SortAscendingOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';

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
        <AppstoreOutlined className="text-2xl text-blue-500" />
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
        <SearchOutlined
          className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            tabIndex={-1}
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CloseOutlined className="text-sm" />
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
          <ForkOutlined className="text-lg" />
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
          <MergeOutlined className="text-lg" rotate={90} />
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
          <SortAscendingOutlined className="text-lg" />
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
            <SunOutlined className="text-lg" />
          ) : (
            <MoonOutlined className="text-lg" />
          )}
        </button>
      </div>
    </div>
  );
}
