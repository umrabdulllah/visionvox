'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Clipboard, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { generateScript } from '@/app/actions'
import { getProjectScripts, createScript } from '@/utils/api'
import { Script } from '@/types/index'

interface ScriptGeneratorProps {
  projectId: string;
}

export function ScriptGenerator({ projectId }: ScriptGeneratorProps) {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [script, setScript] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedScripts, setGeneratedScripts] = useState<Script[]>([])
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0)
  const [isCopying, setIsCopying] = useState(false)

  useEffect(() => {
    const loadScripts = async () => {
      try {
        const scripts = await getProjectScripts(projectId)
        setGeneratedScripts(scripts)
        if (scripts.length > 0) {
          setScript(scripts[0].generatedScript)
        }
      } catch (error) {
        console.error('Error loading scripts:', error)
      }
    }

    loadScripts()
  }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await generateScript(topic, 220)
      const generatedContent = response.response

      // Save the script to the database
      const savedScript = await createScript(projectId, {
        title: topic,
        generatedScript: generatedContent
      })

      setScript(generatedContent)
      setGeneratedScripts((prevScripts) => [...prevScripts, savedScript])
      setCurrentScriptIndex(generatedScripts.length)
    } catch (error) {
      console.error('Error generating script:', error)
      setScript('An error occurred while generating the script. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    setIsCopying(true)
    navigator.clipboard.writeText(script).then(() => {
      setTimeout(() => setIsCopying(false), 2000)
    }).catch(err => {
      console.error('Failed to copy script:', err)
      setIsCopying(false)
    })
  }

  const handleNextScript = () => {
    if (currentScriptIndex < generatedScripts.length - 1) {
      setCurrentScriptIndex(currentScriptIndex + 1)
      setScript(generatedScripts[currentScriptIndex + 1].generatedScript)
    }
  }

  const handlePreviousScript = () => {
    if (currentScriptIndex > 0) {
      setCurrentScriptIndex(currentScriptIndex - 1)
      setScript(generatedScripts[currentScriptIndex - 1].generatedScript)
    }
  }

  const wordCount = script.split(/\s+/).filter(Boolean).length
  const charCount = script.trim().length

  return (
    <div className="h-screen overflow-hidden p-4 flex flex-col">
      <Card className="h-[600px] flex flex-col mx-auto w-full max-w-5xl">
        <CardHeader className="py-4">
          <CardTitle className="text-2xl">Generate Your Script</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Script'}
            </Button>
          </form>
          <div className="flex-1 min-h-0 relative">
            <Textarea
              placeholder="Your generated script will appear here..."
              value={script}
              readOnly
              className="h-full resize-none overflow-auto"
            />
            <div className="absolute bottom-2 right-2 flex items-center">
              <Clipboard 
                onClick={handleCopy}
                className={`cursor-pointer text-gray-500 hover:text-gray-700 ${isCopying ? 'text-blue-500' : ''}`}
                size={24}
              />
              {isCopying && (
                <span className="ml-2 text-sm text-blue-500">Copied!</span>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Words: {wordCount} | Characters: {charCount}
          </div>
        </CardContent>
        <CardFooter className="py-4 flex flex-col gap-4">
          <div className="flex justify-between items-center w-full">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => router.push('/edit')}
            >
              <ArrowLeft size={16} />
              Back to Video Editor
            </Button>
            <div className="flex items-center gap-4">
              <ChevronLeft 
                onClick={handlePreviousScript}
                className={`cursor-pointer ${currentScriptIndex === 0 ? 'text-gray-400' : 'text-black'}`}
                size={24}
              />
              <span>
                {generatedScripts.length > 0 ? currentScriptIndex + 1 : 0}/{generatedScripts.length}
              </span>
              <ChevronRight 
                onClick={handleNextScript}
                className={`cursor-pointer ${currentScriptIndex === generatedScripts.length - 1 ? 'text-gray-400' : 'text-black'}`}
                size={24}
              />
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}