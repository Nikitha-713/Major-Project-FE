import { useEffect, useState } from 'react';
import axiosInstance from '../axiosInstance.js';

// Note formats (free-form, SOAP, DAP) are defined on the server; this just loads them.
export default function useNoteTemplates() {
  const [templates, setTemplates] = useState(null);
  useEffect(() => {
    axiosInstance.get('/notes/templates').then((res) => setTemplates(res.data.templates)).catch(() => setTemplates([]));
  }, []);
  return templates;
}
