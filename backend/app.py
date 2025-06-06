from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_ollama.llms import OllamaLLM

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = OllamaLLM(model="gemma3:1b", base_url="http://ollama-app:11434")


class GenerateQuery(BaseModel):
    question: str


@app.get("/test")
def test():
    return {"status": "OK"}


@app.post("/generate")
def generate(query: GenerateQuery):
    response = model.invoke(query.question)

    return {"response": response}
