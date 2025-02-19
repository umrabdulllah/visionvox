const Script = require('../models/Script');
const Project = require('../models/Project');

class ScriptService {
  async createScript(projectId, scriptData) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const script = new Script({
      ...scriptData,
      projectId
    });

    await script.save();
    
    // Add script to project
    project.scripts.push(script._id);
    await project.save();

    return script;
  }

  async getScriptsByProject(projectId) {
    return await Script.find({ projectId }).sort({ createdAt: -1 });
  }

  async getScriptById(scriptId, projectId) {
    const script = await Script.findOne({ _id: scriptId, projectId });
    if (!script) {
      throw new Error('Script not found');
    }
    return script;
  }

  async updateScript(scriptId, projectId, updateData) {
    const script = await Script.findOne({ _id: scriptId, projectId });
    if (!script) {
      throw new Error('Script not found');
    }

    Object.keys(updateData).forEach(key => {
      script[key] = updateData[key];
    });

    await script.save();
    return script;
  }

  async deleteScript(scriptId, projectId) {
    const script = await Script.findOne({ _id: scriptId, projectId });
    if (!script) {
      throw new Error('Script not found');
    }

    // Remove script reference from project
    await Project.findByIdAndUpdate(projectId, {
      $pull: { scripts: scriptId }
    });

    await Script.deleteOne({ _id: scriptId });
    return { message: 'Script deleted successfully' };
  }

  async addVisualSuggestion(scriptId, visualData) {
    const script = await Script.findById(scriptId);
    if (!script) {
      throw new Error('Script not found');
    }

    script.suggestedVisuals.push(visualData);
    await script.save();
    return script;
  }

  async removeVisualSuggestion(scriptId, visualId) {
    const script = await Script.findById(scriptId);
    if (!script) {
      throw new Error('Script not found');
    }

    script.suggestedVisuals = script.suggestedVisuals.filter(
      visual => visual._id.toString() !== visualId
    );

    await script.save();
    return script;
  }
}

module.exports = new ScriptService(); 