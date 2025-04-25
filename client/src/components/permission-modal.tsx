interface PermissionModalProps {
  show: boolean;
  onAllow: () => void;
  onCancel: () => void;
}

export function PermissionModal({ show, onAllow, onCancel }: PermissionModalProps) {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
        <h3 className="text-lg font-semibold mb-2">Microphone Access Required</h3>
        <p className="mb-4">Please allow access to your microphone to use the recording feature.</p>
        <div className="flex justify-end space-x-2">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={onAllow}
            className="px-4 py-2 bg-primary text-white rounded-md font-medium"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
