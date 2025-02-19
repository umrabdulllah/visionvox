from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv
import os
import traceback
import re
import random

from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

try:
    from groq import Groq
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not found in environment variables")
    client = Groq(api_key=GROQ_API_KEY)
except ImportError:
    raise ImportError(
        "Groq module not found. Ensure it is installed (pip install groq) and correctly imported."
    )

# Utility function to count words
def count_words(text: str) -> int:
    return len(text.split())

# Utility function to generate a session ID
def generate_session_id(text: str) -> str:
    return f"session_{abs(hash(text))}"

# Load and process example scripts
def load_example_scripts():
    try:
        with open("scripts.txt", "r", encoding="utf-8") as file:
            content = file.read()
            # Split scripts by separator
            scripts = content.split("---")
            # Clean and format scripts
            formatted_scripts = [script.strip() for script in scripts if script.strip()]
            print(f"Loaded {len(formatted_scripts)} example scripts")
            return formatted_scripts
    except FileNotFoundError:
        print("Warning: scripts.txt not found!")
        return []
    except Exception as e:
        print(f"Error loading scripts: {e}")
        return []

# Load example scripts
example_scripts = load_example_scripts()

# Create a few-shot learning prompt
def create_few_shot_prompt(query: str) -> list:
    # Select 2 random examples if available
    selected_examples = random.sample(example_scripts, min(2, len(example_scripts))) if example_scripts else []
    
    system_content = """You are a professional scriptwriter. Generate a script following these rules:
1. Write exactly between 190-220 words
2. Use clear, direct language
3. Focus on storytelling and engagement
4. Maintain consistent tone and style with the examples
5. Structure in a narrative format
6. Include natural transitions between ideas"""

    messages = [{"role": "system", "content": system_content}]
    
    # Add examples if available
    for example in selected_examples:
        messages.extend([
            {"role": "user", "content": "Write a professional script."},
            {"role": "assistant", "content": example}
        ])
    
    # Add the actual query
    messages.append({
        "role": "user", 
        "content": f"Write a professional script about: {query}. Follow the same style as the examples."
    })
    
    return messages

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    user_query: str

class ChatResponse(BaseModel):
    response: str

# In-memory storage for scripts
previous_scripts = {}

@app.get("/")
async def read_root():
    return {"message": "Hello, world!"}

@app.post("/chat", response_model=dict)
async def chat(request: ChatRequest):
    try:
        messages = create_few_shot_prompt(request.user_query)
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=400,
            top_p=0.9,
            stream=False
        )

        response_content = completion.choices[0].message.content.strip()
        word_count = count_words(response_content)

        # If word count is off, try one refinement
        if not (190 <= word_count <= 220):
            refine_prompt = f"Rewrite this script to be between 190-220 words while maintaining the same style:\n\n{response_content}"
            messages = create_few_shot_prompt(refine_prompt)

            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.5,
                max_tokens=400,
                top_p=0.9,
                stream=False
            )
            response_content = completion.choices[0].message.content.strip()

        session_id = generate_session_id(request.user_query)
        previous_scripts[session_id] = response_content

        return {
            "response": response_content, 
            "session_id": session_id,
            "word_count": count_words(response_content)
        }

    except Exception as e:
        print(f"Error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

class RefineRequest(BaseModel):
    user_refinement: str
    session_id: str

@app.post("/refine", response_model=ChatResponse)
async def refine_script(request: RefineRequest):
    try:
        if request.session_id not in previous_scripts:
            raise HTTPException(
                status_code=404,
                detail="Previous script not found. Start a new session."
            )

        previous_script = previous_scripts[request.session_id]

        refinement_prompt = f"""
<|start_header_id|>system<|end_header_id|>
Below is the script to refine:
{previous_script}

User wants the following refinements: {request.user_refinement}

Rules:
1. Maintain a 190–220 word count range.
2. Preserve the original tone, style, and clarity.
3. Keep it engaging, succinct, and impactful.
<|eot_id|>
"""

        max_attempts = 3
        refined_content = ""

        messages = [
            {"role": "system", "content": refinement_prompt},
        ]

        for _ in range(max_attempts):
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.7,
                max_tokens=300,
                top_p=1,
                stream=False,
            )

            refined_content = completion.choices[0].message.content.strip()
            word_count = count_words(refined_content)

            if 190 <= word_count <= 220:
                break
            else:
                correction_prompt = f"""
<|start_header_id|>system<|end_header_id|>
You generated a script with {word_count} words.
Refine again to fit within 190–220 words, preserving important content.
<|eot_id|>
"""
                messages = [
                    {"role": "system", "content": correction_prompt},
                    {"role": "assistant", "content": refined_content},
                ]

        # Update the script in memory
        previous_scripts[request.session_id] = refined_content

        return ChatResponse(response=refined_content)

    except Exception as e:
        print(f"Error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing refinement: {str(e)}")

if __name__ == "__main__":
    print("Chatbot script started...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
