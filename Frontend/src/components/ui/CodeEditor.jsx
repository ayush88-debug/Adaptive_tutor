import React from 'react';
import Editor from '@monaco-editor/react';
import { Card } from '@/components/ui/card'; 

const CodeEditor = ({ language, value, onChange }) => {
  function handleEditorChange(value) {
    onChange(value);
  }

  
  const editorLanguage = (lang) => {
    switch(lang) {
      case 'cpp': return 'cpp';
      case 'java': return 'java';
      case 'python': return 'python';
      default: return 'plaintext'; 
    }
  };

  return (
    <Card className="overflow-hidden border border-slate-300"> {/* Added border */}
      <Editor
        height="300px" 
        language={editorLanguage(language)} 
        theme="vs-dark" 
        value={value}
        onChange={handleEditorChange}
        options={{
          fontSize: 14,
          minimap: { enabled: false }, 
          scrollBeyondLastLine: false,
          automaticLayout: true, 
          wordWrap: "on", 
          padding: { top: 10, bottom: 10 } 
        }}
      />
    </Card>
  );
};

export default CodeEditor;