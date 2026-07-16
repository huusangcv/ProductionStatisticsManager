import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Reusable drag & drop hook for file imports.
 * @param {Object} options
 * @param {Function} options.onDropFile Callback when a valid file is dropped: (file) => void
 * @param {Function} options.onInvalidFile Callback when an invalid file is dropped: (errorMessage) => void
 * @param {string[]} options.acceptedExtensions List of accepted extensions (e.g. ['.xls', '.xlsx'])
 */
export function useDragDropImport({
  onDropFile,
  onInvalidFile,
  acceptedExtensions = [".xls", ".xlsx"],
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types && e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types && e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
      // Ensure state is true just in case enter was missed
      if (!isDragging) setIsDragging(true);
    }
  }, [isDragging]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        const fileName = file.name.toLowerCase();
        const isValid = acceptedExtensions.some((ext) => fileName.endsWith(ext));

        if (isValid) {
          if (onDropFile) onDropFile(file);
        } else {
          if (onInvalidFile) {
            onInvalidFile("Chỉ hỗ trợ file Excel (.xls, .xlsx)");
          }
        }
      }
    },
    [acceptedExtensions, onDropFile, onInvalidFile]
  );

  // Handle escape key to cancel drag state
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isDragging) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDragging]);

  return {
    isDragging,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}

export default useDragDropImport;
