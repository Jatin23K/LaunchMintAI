import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List
from pydantic import BaseModel

class ExtensionResult(BaseModel):
    status: str
    data: Dict[str, Any]
    artifacts: List[str] = []
    logs: List[str] = []
    confidence: float = 1.0
    cost: float = 0.0

class BaseExtension(ABC):
    def __init__(self):
        self.logs = []

    def log(self, message: str):
        ts = time.strftime("%H:%M:%S")
        self.logs.append(f"[{ts}] {message}")
        print(f"[{self.name}] {message}")

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        pass

    @abstractmethod
    async def run(self, payload: Dict[str, Any]) -> ExtensionResult:
        pass