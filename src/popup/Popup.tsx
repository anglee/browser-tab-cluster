
export default function Popup() {
  const openManager = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manager/index.html') });
    window.close();
  };

  return (
    <div className="w-64 p-4 bg-gray-900 text-gray-100">
      <h1 className="text-lg font-semibold mb-3">Tab Cluster</h1>
      <button
        onClick={openManager}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Open Tab Cluster
      </button>
    </div>
  );
}
