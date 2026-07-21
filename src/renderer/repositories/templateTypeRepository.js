/**
 * templateTypeRepository.js — Renderer-side API for template_types.
 */

export const templateTypeRepository = {
  getAll: async () => {
    return await window.electronAPI.templateType.getAll();
  },
};
