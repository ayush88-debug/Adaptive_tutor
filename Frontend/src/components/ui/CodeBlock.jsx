import * as React from "react"
import { Check, Clipboard } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { tomorrow } from '../../lib/code-theme' // Import our custom theme
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const CodeBlock = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("relative my-4 rounded-lg", className)} {...props}>
    {children}
  </div>
))
CodeBlock.displayName = "CodeBlock"

const CodeBlockHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center justify-between px-4 py-2 bg-slate-800 rounded-t-lg border-b border-slate-700", className)} {...props}>
    {children}
  </div>
))
CodeBlockHeader.displayName = "CodeBlockHeader"


const CodeBlockBody = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={className} {...props}>
    {children}
  </div>
))
CodeBlockBody.displayName = "CodeBlockBody"


const CodeBlockContent = React.forwardRef(({ code, language, ...props }, ref) => {
  return (
    <SyntaxHighlighter
        ref={ref}
        language={language || "cpp"}
        style={tomorrow}
        customStyle={{
          margin: 0,
          padding: '1rem',
          borderBottomLeftRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem',
          backgroundColor: '#0f172a' // slate-900
        }}
        codeTagProps={{
            style: {
                fontFamily: '"Fira Code", "Fira Mono", monospace',
                fontSize: "0.875rem"
            }
        }}
        {...props}
      >
        {String(code).trim()}
      </SyntaxHighlighter>
  )
})
CodeBlockContent.displayName = "CodeBlockContent"

const CodeBlockCopyButton = React.forwardRef(({ code, className, ...props }, ref) => {
  const [hasCopied, setHasCopied] = React.useState(false)

  const copyToClipboard = () => {
    if (!code) return
    navigator.clipboard.writeText(String(code)).then(() => {
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
    })
  }

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      className={cn("text-slate-400 hover:bg-slate-700 hover:text-white h-8 w-18", className)}
      onClick={copyToClipboard}
      {...props}
    >
      {hasCopied ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <Clipboard className="h-4 w-4 mr-2" />
      )}
      {hasCopied ? "Copied!" : "Copy"}
    </Button>
  )
})
CodeBlockCopyButton.displayName = "CodeBlockCopyButton"

export {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
}