from langchain_openai import ChatOpenAI

class LLMSingleton:
    _instance = None
    _default_model = "gpt-4o"  
    _alternate_model = "o1-preview"

    @classmethod
    def get_instance(cls, model: str = None):
        if model is None:
            model = cls._default_model
            
        if cls._instance is None:
            cls._instance = ChatOpenAI(model=model, temperature=1)
        return cls._instance

    @classmethod
    def set_default_model(cls, model: str):
        """Set the default model to use when no specific model is requested"""
        cls._default_model = model
        cls._instance = None  # Reset instance to force recreation with new model

    @classmethod
    def revert_to_default_model(cls):
        """Set the default model to use when no specific model is requested"""
        print("Reverting to default model: ", cls._default_model, "Performance will be degraded as Integuru is using non O1 model")
        cls._alternate_model = cls._default_model

    @classmethod
    def switch_to_alternate_model(cls):
        """Returns a ChatOpenAI instance configured for o1-miniss"""
        # Create a new instance only if we don't have one yet
        cls._instance = ChatOpenAI(model=cls._alternate_model, temperature=1)

        return cls._instance

llm = LLMSingleton()

