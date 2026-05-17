# backend/app/core/registry.py
from .extension_base import BaseExtension
from typing import Dict, List

class ExtensionRegistry:
    def __init__(self):
        self._extensions: Dict[str, BaseExtension] = {}

    def register(self, extension: BaseExtension):
        """Registers an extension so the API can find it."""
        print(f"✅ [Registry] Loaded extension: {extension.display_name} ({extension.name})")
        self._extensions[extension.name] = extension

    def get(self, name: str) -> BaseExtension:
        return self._extensions.get(name)

    def list_extensions(self) -> List[dict]:
        """Returns metadata for the frontend dashboard"""
        return [
            {"id": ext.name, "name": ext.display_name}
            for ext in self._extensions.values()
        ]

# Global instance
registry = ExtensionRegistry()