'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, FileText, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getProject, getProjectScripts, deleteScript } from '@/utils/api';
import { Project, Script } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProjectDetails() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptToDelete, setScriptToDelete] = useState<Script | null>(null);

  useEffect(() => {
    const fetchProjectAndScripts = async () => {
      try {
        const projectData = await getProject(params.id as string);
        setProject(projectData);
        const scriptsData = await getProjectScripts(params.id as string);
        setScripts(scriptsData);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load project details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchProjectAndScripts();
    }
  }, [params.id]);

  const getScriptPreview = (content: string) => {
    const words = content.split(' ');
    return words.slice(0, 30).join(' ') + (words.length > 30 ? '...' : '');
  };

  const handleDeleteScript = async () => {
    if (!project || !scriptToDelete) return;

    try {
      await deleteScript(project._id, scriptToDelete._id);
      setScripts(scripts.filter(s => s._id !== scriptToDelete._id));
      toast({
        title: 'Success',
        description: 'Script deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete script',
        variant: 'destructive',
      });
    } finally {
      setScriptToDelete(null);
    }
  };

  if (isLoading) {
    return <div>Loading project details...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-2">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last edited: {new Date(project.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <Tabs defaultValue="scripts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scripts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Scripts ({scripts.length})
          </TabsTrigger>
          <TabsTrigger value="edits" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video Edits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scripts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Project Scripts</h2>
            <Button onClick={() => router.push(`/scriptwriter?projectId=${project._id}`)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate New Script
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {scripts.map((script) => (
              <Card key={script._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-lg font-semibold">{script.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Created: {new Date(script.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-100"
                      onClick={() => setScriptToDelete(script)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm line-clamp-4">
                    {getScriptPreview(script.generatedScript)}
                  </CardDescription>
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => router.push(`/scriptwriter?projectId=${project._id}&scriptId=${script._id}`)}
                    >
                      View Full Script
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {scripts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No Scripts Yet</h3>
              <p className="text-muted-foreground">Generate your first script to get started.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="edits">
          {/* Video edits content */}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!scriptToDelete} onOpenChange={() => setScriptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the script "{scriptToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteScript}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
