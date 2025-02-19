'use client'

import { useSearchParams } from 'next/navigation'
import { ScriptGenerator } from "../../components/script-generator"

export default function ScriptwriterPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold text-center mb-8">
          No Project Selected
        </h1>
        <p className="text-center">Please select a project to generate scripts.</p>
      </div>
    )
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">
        Vision Vox Script Generator
      </h1>
      <ScriptGenerator projectId={projectId} />
    </main>
  )
}
