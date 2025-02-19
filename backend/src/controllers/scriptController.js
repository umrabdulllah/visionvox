const scriptService = require('../services/scriptService');

class ScriptController {
  async createScript(req, res) {
    try {
      const script = await scriptService.createScript(req.params.projectId, req.body);
      res.status(201).json(script);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getScripts(req, res) {
    try {
      const scripts = await scriptService.getScriptsByProject(req.params.projectId);
      res.json(scripts);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getScript(req, res) {
    try {
      const script = await scriptService.getScriptById(
        req.params.scriptId,
        req.params.projectId
      );
      res.json(script);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateScript(req, res) {
    try {
      const script = await scriptService.updateScript(
        req.params.scriptId,
        req.params.projectId,
        req.body
      );
      res.json(script);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteScript(req, res) {
    try {
      await scriptService.deleteScript(req.params.scriptId, req.params.projectId);
      res.json({ message: 'Script deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async addVisualSuggestion(req, res) {
    try {
      const script = await scriptService.addVisualSuggestion(
        req.params.scriptId,
        req.body
      );
      res.json(script);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async removeVisualSuggestion(req, res) {
    try {
      const script = await scriptService.removeVisualSuggestion(
        req.params.scriptId,
        req.params.visualId
      );
      res.json(script);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ScriptController(); 