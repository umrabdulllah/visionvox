// app/actions.ts
'use server'

export async function generateScript(topic: string, length: number) {
  const response = await fetch('http://localhost:8000/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_query: topic,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate script')
  }

  return response.json()
}

export async function refineScript(refinementPrompt: string, sessionId: string) {
  const response = await fetch('http://localhost:8000/refine', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_refinement: refinementPrompt,
      session_id: sessionId,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refine script')
  }

  return response.json()
}
