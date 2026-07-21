import { useState, useCallback, useEffect } from "react";
import printerService from "../services/printerService";

export function usePrinters() {
  const [printers, setPrinters] = useState([]);
  const [defaultPrinter, setDefaultPrinter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const fetchPrinters = useCallback(async () => {
    setLoading(true);
    try {
      const [allPrinters, settings] = await Promise.all([
        printerService.getAll(),
        printerService.getDefault(),
      ]);
      setPrinters(allPrinters);
      setDefaultPrinter(settings);
    } catch (error) {
      console.error("Failed to fetch printers", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPrinters = useCallback(async () => {
    setLoading(true);
    try {
      const allPrinters = await printerService.refresh();
      setPrinters(allPrinters);
      return allPrinters;
    } catch (error) {
      console.error("Failed to refresh printers", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const saveDefaultPrinter = useCallback(
    async (printerName) => {
      setLoading(true);
      try {
        const result = await printerService.save(printerName);
        if (result.ok) {
          await fetchPrinters();
        }
        return result;
      } catch (error) {
        console.error("Failed to save default printer", error);
        return { ok: false, message: "Lỗi không xác định" };
      } finally {
        setLoading(false);
      }
    },
    [fetchPrinters],
  );

  const checkPrinter = useCallback(async (printerName) => {
    try {
      return await printerService.check(printerName);
    } catch (error) {
      console.error("Failed to check printer", error);
      return null;
    }
  }, []);

  const printTestPage = useCallback(async (printerName) => {
    setPrinting(true);
    try {
      return await printerService.test(printerName);
    } catch (error) {
      console.error("Failed to print test page", error);
      return { ok: false, message: "Lỗi không xác định" };
    } finally {
      setPrinting(false);
    }
  }, []);

  const printExcel = useCallback(async (filePath, moduleKey = null) => {
    setPrinting(true);
    try {
      return await printerService.printExcel(filePath, moduleKey);
    } catch (error) {
      console.error("Failed to print Excel", error);
      return { ok: false, message: "Lỗi không xác định" };
    } finally {
      setPrinting(false);
    }
  }, []);

  const printPdf = useCallback(async (filePath) => {
    setPrinting(true);
    try {
      return await printerService.printPdf(filePath);
    } catch (error) {
      console.error("Failed to print PDF", error);
      return { ok: false, message: "Lỗi không xác định" };
    } finally {
      setPrinting(false);
    }
  }, []);

  const getPrintLogs = useCallback(async (limit = 50) => {
    try {
      return await printerService.getLogs(limit);
    } catch (error) {
      console.error("Failed to get print logs", error);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchPrinters();
  }, [fetchPrinters]);

  return {
    printers,
    defaultPrinter,
    loading,
    printing,
    fetchPrinters,
    refreshPrinters,
    saveDefaultPrinter,
    checkPrinter,
    printTestPage,
    printExcel,
    printPdf,
    getPrintLogs,
  };
}
