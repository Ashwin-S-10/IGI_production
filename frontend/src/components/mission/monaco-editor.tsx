"use client";

import { useEffect, useRef } from "react";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    monaco: any;
    require: {
      config: (config: any) => void;
      (modules: string[], callback: (...args: any[]) => void): void;
    };
  }
}

export default function MonacoEditor({
  value,
  onChange,
  language,
  disabled = false,
}: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorInstance = useRef<any>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    // Load Monaco Editor from CDN
    if (typeof window === "undefined" || isLoadingRef.current) return;

    const loadMonaco = () => {
      // Skip if Monaco is already loaded
      if (window.monaco) {
        initializeEditor();
        return;
      }

      isLoadingRef.current = true;

      // Load Monaco loader script
      const loaderScript = document.createElement("script");
      loaderScript.src = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js";
      loaderScript.async = true;
      loaderScript.onload = () => {
        // Configure AMD loader
        window.require.config({
          paths: {
            vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs",
          },
        });

        // Load Monaco editor
        window.require(["vs/editor/editor.main"], () => {
          isLoadingRef.current = false;
          initializeEditor();
        });
      };

      document.head.appendChild(loaderScript);
    };

    const initializeEditor = () => {
      if (!editorRef.current || !window.monaco || monacoEditorInstance.current) return;

      // Map language values to Monaco language identifiers
      const languageMap: Record<string, string> = {
        python: "python",
        java: "java",
        cpp: "cpp",
        c: "c",
        javascript: "javascript",
      };

      const monacoLanguage = languageMap[language] || "plaintext";

      // Create editor instance
      const editor = window.monaco.editor.create(editorRef.current, {
        value: value,
        language: monacoLanguage,
        theme: "vs-dark",
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: "on",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        readOnly: disabled,
        tabSize: 4,
        insertSpaces: true,
        formatOnPaste: true,
        formatOnType: true,
        autoIndent: "full",
        bracketPairColorization: { enabled: true },
        matchBrackets: "always",
        folding: true,
        foldingStrategy: "indentation",
        showFoldingControls: "always",
        renderWhitespace: "boundary",
        padding: { top: 8, bottom: 8 },
      });

      // Sync changes back to parent
      editor.onDidChangeModelContent(() => {
        const currentValue = editor.getValue();
        onChange(currentValue);
      });

      monacoEditorInstance.current = editor;

      // Expose getCode and setCode functions globally for external access
      (window as any).monacoGetCode = () => editor.getValue();
      (window as any).monacoSetCode = (code: string) => editor.setValue(code);
    };

    loadMonaco();

    // Cleanup
    return () => {
      if (monacoEditorInstance.current) {
        monacoEditorInstance.current.dispose();
        monacoEditorInstance.current = null;
      }
    };
  }, []);

  // Update editor value when prop changes
  useEffect(() => {
    if (monacoEditorInstance.current && value !== monacoEditorInstance.current.getValue()) {
      monacoEditorInstance.current.setValue(value);
    }
  }, [value]);

  // Update language when prop changes
  useEffect(() => {
    if (!monacoEditorInstance.current || !window.monaco) return;

    const languageMap: Record<string, string> = {
      python: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      javascript: "javascript",
    };

    const monacoLanguage = languageMap[language] || "plaintext";
    const model = monacoEditorInstance.current.getModel();
    
    if (model) {
      window.monaco.editor.setModelLanguage(model, monacoLanguage);
    }
  }, [language]);

  // Update disabled state
  useEffect(() => {
    if (monacoEditorInstance.current) {
      monacoEditorInstance.current.updateOptions({ readOnly: disabled });
    }
  }, [disabled]);

  return (
    <div
      ref={editorRef}
      className="w-full h-96 border border-[#FF6B00]/30 rounded overflow-hidden"
      style={{ minHeight: "384px" }}
    />
  );
}
