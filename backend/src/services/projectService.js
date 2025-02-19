const Project = require('../models/Project');
const Script = require('../models/Script');

class ProjectService {
  async createProject(userId, projectData) {
    const project = new Project({
      ...projectData,
      userId
    });
    await project.save();
    return project;
  }

  async getProjects(userId) {
    return await Project.find({ userId })
      .populate('scripts')
      .sort({ createdAt: -1 });
  }

  async getProjectById(projectId, userId) {
    const project = await Project.findOne({ _id: projectId, userId })
      .populate('scripts');
    
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  }

  async updateProject(projectId, userId, updateData) {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw new Error('Project not found');
    }

    Object.keys(updateData).forEach(key => {
      project[key] = updateData[key];
    });

    await project.save();
    return project;
  }

  async deleteProject(projectId, userId) {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw new Error('Project not found');
    }

    // Delete associated scripts
    await Script.deleteMany({ projectId });
    
    // Use findOneAndDelete instead of remove
    await Project.findOneAndDelete({ _id: projectId, userId });
    
    return { message: 'Project deleted successfully' };
  }

  async addVideoToProject(projectId, userId, videoData) {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw new Error('Project not found');
    }

    project.videoFile = videoData;
    await project.save();
    return project;
  }
}

module.exports = new ProjectService(); 