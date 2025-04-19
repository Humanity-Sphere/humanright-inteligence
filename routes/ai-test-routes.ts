/**
 * Test-Routen für KI-Services
 * 
 * Diese Routen dienen zum Testen der verschiedenen KI-Service-Implementierungen,
 * einschließlich OpenAI mit GPT-4o, Gemini und OpenRouter.
 */

import express from 'express';
import { getAIServiceFactory, TaskType } from '../services/ai-service-factory';

const router = express.Router();

/**
 * GET /api/ai-test/providers
 * 
 * Gibt alle verfügbaren KI-Provider zurück
 */
router.get('/providers', async (req, res) => {
  try {
    const aiFactory = getAIServiceFactory();
    const providers = aiFactory.getAvailableProviders();
    
    return res.status(200).json({ 
      success: true,
      providers,
      message: `${providers.length} KI-Provider verfügbar`
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der KI-Provider:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Fehler beim Abrufen der KI-Provider'
    });
  }
});

/**
 * POST /api/ai-test/generate
 * 
 * Testet die Textgenerierung mit einem bestimmten Provider
 */
router.post('/generate', async (req, res) => {
  try {
    const { prompt, provider, taskType } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        message: 'Prompt ist erforderlich'
      });
    }
    
    const aiFactory = getAIServiceFactory();
    
    // Service basierend auf Anforderungen auswählen
    const aiService = aiFactory.selectOptimalService({
      taskType: taskType || TaskType.CREATIVE_WRITING,
      preferredProvider: provider || undefined
    });
    
    // Provider-Information abrufen
    const selectedProvider = provider || 
      (aiFactory.isProviderAvailable('openai') ? 'openai' : aiFactory.getAvailableProviders()[0]);
    
    // Inhalt generieren
    const generatedContent = await aiService.generateContent({
      prompt,
      taskType,
      outputFormat: 'markdown'
    });
    
    return res.status(200).json({
      success: true,
      provider: selectedProvider,
      content: generatedContent
    });
  } catch (error) {
    console.error('Fehler bei der KI-Textgenerierung:', error);
    return res.status(500).json({ 
      success: false,
      message: `Fehler bei der KI-Textgenerierung: ${error.message}`
    });
  }
});

/**
 * POST /api/ai-test/openai
 * 
 * Testet die Textgenerierung mit OpenAI
 */
router.post('/openai', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        message: 'Prompt ist erforderlich'
      });
    }
    
    const aiFactory = getAIServiceFactory();
    
    // Prüfe, ob OpenAI verfügbar ist
    if (!aiFactory.isProviderAvailable('openai')) {
      return res.status(400).json({ 
        success: false,
        message: 'OpenAI ist nicht verfügbar'
      });
    }
    
    // Service für OpenAI auswählen
    const aiService = aiFactory.getService('openai');
    
    // Inhalt generieren
    const generatedContent = await aiService.generateContent({
      prompt,
      taskType: TaskType.CREATIVE_WRITING,
      outputFormat: 'text'
    });
    
    return res.status(200).json({
      success: true,
      provider: 'openai',
      content: generatedContent
    });
  } catch (error) {
    console.error('Fehler bei der OpenAI-Textgenerierung:', error);
    return res.status(500).json({ 
      success: false,
      message: `Fehler bei der OpenAI-Textgenerierung: ${error.message}`
    });
  }
});

/**
 * POST /api/ai-test/gemini
 * 
 * Testet die Textgenerierung mit Gemini
 */
router.post('/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        message: 'Prompt ist erforderlich'
      });
    }
    
    const aiFactory = getAIServiceFactory();
    
    // Prüfe, ob Gemini verfügbar ist
    if (!aiFactory.isProviderAvailable('gemini')) {
      return res.status(400).json({ 
        success: false,
        message: 'Gemini ist nicht verfügbar'
      });
    }
    
    // Service für Gemini auswählen
    const aiService = aiFactory.getService('gemini');
    
    // Inhalt generieren
    const generatedContent = await aiService.generateContent({
      prompt,
      taskType: TaskType.CREATIVE_WRITING,
      outputFormat: 'text'
    });
    
    return res.status(200).json({
      success: true,
      provider: 'gemini',
      content: generatedContent
    });
  } catch (error) {
    console.error('Fehler bei der Gemini-Textgenerierung:', error);
    return res.status(500).json({ 
      success: false,
      message: `Fehler bei der Gemini-Textgenerierung: ${error.message}`
    });
  }
});

/**
 * POST /api/ai-test/openrouter
 * 
 * Testet die Textgenerierung mit OpenRouter
 */
router.post('/openrouter', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        message: 'Prompt ist erforderlich'
      });
    }
    
    const aiFactory = getAIServiceFactory();
    
    // Prüfe, ob OpenRouter verfügbar ist
    if (!aiFactory.isProviderAvailable('openrouter')) {
      return res.status(400).json({ 
        success: false,
        message: 'OpenRouter ist nicht verfügbar'
      });
    }
    
    // Service für OpenRouter auswählen
    const aiService = aiFactory.getService('openrouter');
    
    // Inhalt generieren
    const generatedContent = await aiService.generateContent({
      prompt,
      taskType: TaskType.CREATIVE_WRITING,
      outputFormat: 'text',
      model: model // Spezifisches Modell verwenden, falls angegeben
    });
    
    return res.status(200).json({
      success: true,
      provider: 'openrouter',
      model: model || 'Standard',
      content: generatedContent
    });
  } catch (error) {
    console.error('Fehler bei der OpenRouter-Textgenerierung:', error);
    return res.status(500).json({ 
      success: false,
      message: `Fehler bei der OpenRouter-Textgenerierung: ${error.message}`
    });
  }
});

/**
 * GET /api/ai-test/openrouter/models
 * 
 * Gibt eine Liste gängiger Modelle zurück, die über OpenRouter verfügbar sind
 */
router.get('/openrouter/models', async (req, res) => {
  try {
    const aiFactory = getAIServiceFactory();
    
    // Prüfe, ob OpenRouter verfügbar ist
    if (!aiFactory.isProviderAvailable('openrouter')) {
      return res.status(400).json({ 
        success: false,
        message: 'OpenRouter ist nicht verfügbar'
      });
    }
    
    // Liste der gängigen OpenRouter-Modelle
    const commonModels = [
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        description: 'OpenAIs neuestes multimodales Modell mit exzellenter Leistung.'
      },
      {
        id: 'anthropic/claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        description: 'Ausgewogene Balance zwischen Leistung und Kosten von Anthropic.'
      },
      {
        id: 'anthropic/claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        description: 'Anthropics leistungsstärkstes Modell für komplexe Aufgaben.'
      },
      {
        id: 'anthropic/claude-3-haiku',
        name: 'Claude 3 Haiku',
        provider: 'Anthropic',
        description: 'Schnelles und kostengünstiges Modell für einfachere Aufgaben.'
      },
      {
        id: 'meta-llama/llama-3-70b-instruct',
        name: 'Llama 3 70B',
        provider: 'Meta',
        description: 'Metas großes Open-Source-Modell mit 70 Milliarden Parametern.'
      },
      {
        id: 'google/gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'Google',
        description: 'Googles leistungsstarkes multimodales Modell.'
      }
    ];
    
    return res.status(200).json({
      success: true,
      models: commonModels
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der OpenRouter-Modelle:', error);
    return res.status(500).json({ 
      success: false,
      message: `Fehler beim Abrufen der OpenRouter-Modelle: ${error.message}`
    });
  }
});

export default router;