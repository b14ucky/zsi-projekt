from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = OllamaLLM(model="gemma3:1b", base_url="http://ollama-app:11434")

template = """
You are an AI assistant, answering user's questions.

You have access to the history of your chat with the user. Here it is: {history}

Words "User:" and "AI:" are used to indicate who is speaking.

Here's the user's question: {question}
"""

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

chat_histories = {}


class GenerateQuery(BaseModel):
    question: str
    user_id: str


@app.get("/test")
def test():
    return {"status": "OK"}


@app.post("/generate")
def generate(query: GenerateQuery):
    history = chat_histories.get(query.user_id, [])
    context = "\n".join(history)

    response = chain.invoke({"history": context, "question": query.question})

    history.append(f"User: {query.question}")
    history.append(f"AI: {response}")
    chat_histories[query.user_id] = history

    return {"response": response, "history": history}


@app.post("/upload")
async def upload_file(user_id: str = Form(...), file: UploadFile = File(...)):
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except Exception:
        return {"error": "Plik musi byc tekstowy (UTF-8)."}

    history = chat_histories.get(user_id, [])
    history.append(f"User uploaded file '{file.filename}':\n{text}")
    chat_histories[user_id] = history

    return {"status": "file received", "filename": file.filename}
