import { useState, useCallback, useEffect } from "react";

export function useTemplateTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.templateType.getAll();
      setTypes(data);
    } catch (error) {
      console.error("Failed to fetch template types:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createType = useCallback(async (data) => {
    try {
      const result = await window.electronAPI.templateType.create(data);
      if (result.success) {
        await fetchTypes();
      }
      return result;
    } catch (error) {
      console.error("Failed to create template type:", error);
      return { success: false, message: error.message };
    }
  }, [fetchTypes]);

  const updateType = useCallback(async (id, data) => {
    try {
      const result = await window.electronAPI.templateType.update(id, data);
      if (result.success) {
        await fetchTypes();
      }
      return result;
    } catch (error) {
      console.error("Failed to update template type:", error);
      return { success: false, message: error.message };
    }
  }, [fetchTypes]);

  const deleteType = useCallback(async (id) => {
    try {
      const result = await window.electronAPI.templateType.delete(id);
      if (result.success) {
        await fetchTypes();
      }
      return result;
    } catch (error) {
      console.error("Failed to delete template type:", error);
      return { success: false, message: error.message };
    }
  }, [fetchTypes]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  return {
    types,
    loading,
    fetchTypes,
    createType,
    updateType,
    deleteType,
  };
}
