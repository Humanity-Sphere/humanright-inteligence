
import express from 'express';
import IntegrationManager from '../services/integration-manager';

const router = express.Router();

// Get all integrations
router.get('/integrations', async (req, res) => {
  try {
    const integrations = await IntegrationManager.getIntegrations();
    res.json(integrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Get specific integration by ID
router.get('/integrations/:id', async (req, res) => {
  try {
    const integration = await IntegrationManager.getIntegrationById(req.params.id);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    res.json(integration);
  } catch (error) {
    console.error('Error fetching integration:', error);
    res.status(500).json({ error: 'Failed to fetch integration' });
  }
});

// Create new integration
router.post('/integrations', async (req, res) => {
  try {
    const newIntegration = await IntegrationManager.addIntegration(req.body);
    res.status(201).json(newIntegration);
  } catch (error) {
    console.error('Error creating integration:', error);
    res.status(500).json({ error: 'Failed to create integration' });
  }
});

// Update integration
router.put('/integrations/:id', async (req, res) => {
  try {
    const updatedIntegration = await IntegrationManager.updateIntegration(req.params.id, req.body);
    if (!updatedIntegration) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    res.json(updatedIntegration);
  } catch (error) {
    console.error('Error updating integration:', error);
    res.status(500).json({ error: 'Failed to update integration' });
  }
});

// Delete integration
router.delete('/integrations/:id', async (req, res) => {
  try {
    const deleted = await IntegrationManager.deleteIntegration(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting integration:', error);
    res.status(500).json({ error: 'Failed to delete integration' });
  }
});

// STORAGE CONFIGURATIONS

// Get all storage configs
router.get('/storage-configs', async (req, res) => {
  try {
    const configs = await IntegrationManager.getStorageConfigs();
    res.json(configs);
  } catch (error) {
    console.error('Error fetching storage configs:', error);
    res.status(500).json({ error: 'Failed to fetch storage configurations' });
  }
});

// Get specific storage config
router.get('/storage-configs/:provider', async (req, res) => {
  try {
    const config = await IntegrationManager.getStorageConfig(req.params.provider);
    if (!config) {
      return res.status(404).json({ error: 'Storage configuration not found' });
    }
    res.json(config);
  } catch (error) {
    console.error('Error fetching storage config:', error);
    res.status(500).json({ error: 'Failed to fetch storage configuration' });
  }
});

// Update storage config
router.put('/storage-configs/:provider', async (req, res) => {
  try {
    const updatedConfig = await IntegrationManager.updateStorageConfig(req.params.provider, req.body);
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating storage config:', error);
    res.status(500).json({ error: 'Failed to update storage configuration' });
  }
});

// Delete storage config
router.delete('/storage-configs/:provider', async (req, res) => {
  try {
    const deleted = await IntegrationManager.deleteStorageConfig(req.params.provider);
    if (!deleted) {
      return res.status(404).json({ error: 'Storage configuration not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting storage config:', error);
    res.status(500).json({ error: 'Failed to delete storage configuration' });
  }
});

// API CONFIGURATIONS

// Get all API configs
router.get('/api-configs', async (req, res) => {
  try {
    const configs = await IntegrationManager.getApiConfigs();
    res.json(configs);
  } catch (error) {
    console.error('Error fetching API configs:', error);
    res.status(500).json({ error: 'Failed to fetch API configurations' });
  }
});

// Get specific API config
router.get('/api-configs/:provider', async (req, res) => {
  try {
    const config = await IntegrationManager.getApiConfig(req.params.provider);
    if (!config) {
      return res.status(404).json({ error: 'API configuration not found' });
    }
    res.json(config);
  } catch (error) {
    console.error('Error fetching API config:', error);
    res.status(500).json({ error: 'Failed to fetch API configuration' });
  }
});

// Update API config
router.put('/api-configs/:provider', async (req, res) => {
  try {
    const updatedConfig = await IntegrationManager.updateApiConfig(req.params.provider, req.body);
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating API config:', error);
    res.status(500).json({ error: 'Failed to update API configuration' });
  }
});

// Delete API config
router.delete('/api-configs/:provider', async (req, res) => {
  try {
    const deleted = await IntegrationManager.deleteApiConfig(req.params.provider);
    if (!deleted) {
      return res.status(404).json({ error: 'API configuration not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting API config:', error);
    res.status(500).json({ error: 'Failed to delete API configuration' });
  }
});

// EMAIL & CALENDAR CONFIGURATIONS

// Get email config
router.get('/email-config', async (req, res) => {
  try {
    const config = await IntegrationManager.getEmailConfig();
    res.json(config || { provider: 'none', settings: {}, enabled: false });
  } catch (error) {
    console.error('Error fetching email config:', error);
    res.status(500).json({ error: 'Failed to fetch email configuration' });
  }
});

// Update email config
router.put('/email-config', async (req, res) => {
  try {
    const updatedConfig = await IntegrationManager.updateEmailConfig(req.body);
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating email config:', error);
    res.status(500).json({ error: 'Failed to update email configuration' });
  }
});

// Get calendar config
router.get('/calendar-config', async (req, res) => {
  try {
    const config = await IntegrationManager.getCalendarConfig();
    res.json(config || { provider: 'none', settings: {}, enabled: false });
  } catch (error) {
    console.error('Error fetching calendar config:', error);
    res.status(500).json({ error: 'Failed to fetch calendar configuration' });
  }
});

// Update calendar config
router.put('/calendar-config', async (req, res) => {
  try {
    const updatedConfig = await IntegrationManager.updateCalendarConfig(req.body);
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating calendar config:', error);
    res.status(500).json({ error: 'Failed to update calendar configuration' });
  }
});

export default router;
