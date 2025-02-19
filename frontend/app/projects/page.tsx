'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from '@/hooks/use-toast'
import { getProjects, createProject, updateProject, deleteProject } from '@/utils/api'
import { Project } from '@/types'
import { Pencil, Trash2, Video, FileText, PlusCircle } from 'lucide-react'

type ProjectType = 'video' | 'script' | 'both' | null

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedType, setSelectedType] = useState<ProjectType>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectType: '' as 'video' | 'script' | 'both'
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const data = await getProjects()
      setProjects(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!formData.name.trim() || !selectedType) {
      toast({
        title: 'Error',
        description: 'Project name and type are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newProject = await createProject({
        name: formData.name.trim(),
        description: formData.description.trim(),
        projectType: selectedType
      });
      setProjects([...projects, newProject]);
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', projectType: '' as 'video' | 'script' | 'both' });
      setSelectedType(null);

      if (selectedType === 'video') {
        router.push(`/edit?projectId=${newProject._id}`);
      } else if (selectedType === 'script') {
        router.push(`/scriptwriter?projectId=${newProject._id}`);
      } else {
        router.push(`/projects/${newProject._id}`);
      }

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });
    } catch (error) {
      console.error('Create project error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create project',
        variant: 'destructive',
      });
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject) return

    try {
      const updatedProject = await updateProject(selectedProject._id, formData)
      setProjects(projects.map(p => p._id === updatedProject._id ? updatedProject : p))
      setIsEditModalOpen(false)
      setSelectedProject(null)
      setFormData({ name: '', description: '', projectType: '' as 'video' | 'script' | 'both' })
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      const response = await deleteProject(selectedProject._id);
      setProjects(projects.filter(p => p._id !== selectedProject._id));
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
      toast({
        title: 'Success',
        description: response.message || 'Project deleted successfully',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete project',
        variant: 'destructive',
      });
    }
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      projectType: project.projectType
    })
    setIsEditModalOpen(true)
  }

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project)
    setIsDeleteDialogOpen(true)
  }

  if (isLoading) {
    return <div>Loading projects...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project._id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{project.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {project.projectType === 'video' && <Video className="h-4 w-4" />}
                    {project.projectType === 'script' && <FileText className="h-4 w-4" />}
                    {project.projectType === 'both' && (
                      <div className="flex items-center gap-1">
                        <Video className="h-4 w-4" />
                        <FileText className="h-4 w-4" />
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground capitalize">
                      {project.projectType} Project
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(project)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteDialog(project)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              
              {project.description && (
                <p className="text-muted-foreground mb-4">{project.description}</p>
              )}

              <div className="mt-auto space-y-2">
                <Button
                  className="w-full"
                  onClick={() => router.push(`/projects/${project._id}`)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Open Project
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Project Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Choose how you want to start your project
            </DialogDescription>
          </DialogHeader>

          {!selectedType ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
              <Card
                className={`p-4 cursor-pointer hover:border-primary transition-colors ${
                  selectedType === 'video' ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedType('video')}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <Video className="h-8 w-8" />
                  <h3 className="font-semibold">Video Editor</h3>
                  <p className="text-sm text-muted-foreground">
                    Start with video editing
                  </p>
                </div>
              </Card>

              <Card
                className={`p-4 cursor-pointer hover:border-primary transition-colors ${
                  selectedType === 'script' ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedType('script')}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <FileText className="h-8 w-8" />
                  <h3 className="font-semibold">Script Writer</h3>
                  <p className="text-sm text-muted-foreground">
                    Start with script writing
                  </p>
                </div>
              </Card>

              <Card
                className={`p-4 cursor-pointer hover:border-primary transition-colors ${
                  selectedType === 'both' ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedType('both')}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <PlusCircle className="h-8 w-8" />
                  <h3 className="font-semibold">Combined</h3>
                  <p className="text-sm text-muted-foreground">
                    Work on both simultaneously
                  </p>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Project Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Textarea
                placeholder="Project Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setSelectedType(null)}>
                  Back
                </Button>
                <Button onClick={handleCreateProject}>Create Project</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Project Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Textarea
              placeholder="Project Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProject}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
