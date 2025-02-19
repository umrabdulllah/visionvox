const projectService = require('../services/projectService');

class ProjectController {
  async createProject(req, res) {
    try {
      const project = await projectService.createProject(req.user._id, req.body);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProjects(req, res) {
    try {
      const projects = await projectService.getProjects(req.user._id);
      res.json(projects);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProject(req, res) {
    try {
      const project = await projectService.getProjectById(req.params.id, req.user._id);
      res.json(project);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateProject(req, res) {
    try {
      const project = await projectService.updateProject(
        req.params.id,
        req.user._id,
        req.body
      );
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteProject(req, res) {
    try {
      await projectService.deleteProject(req.params.id, req.user._id);
      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async addVideoToProject(req, res) {
    try {
      const videoData = {
        url: req.body.url,
        filename: req.body.filename
      };
      
      const project = await projectService.addVideoToProject(
        req.params.id,
        req.user._id,
        videoData
      );
      
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ProjectController(); 