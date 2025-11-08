'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  MessageSquare,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Paperclip
} from 'lucide-react';
import Link from 'next/link';
import { Project, ProjectTask, CreateTaskRequest, SendMessageRequest, TaskPriority, MessageType } from '@/types/project';

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const taskStatusColors = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

export default function ProjectDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const taskData: CreateTaskRequest = {
        title: newTaskTitle,
        description: newTaskDescription,
        priority: TaskPriority.MEDIUM
      };

      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        setNewTaskTitle('');
        setNewTaskDescription('');
        fetchProject(); // Refresh project data
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const messageData: SendMessageRequest = {
        content: newMessage,
        type: MessageType.TEXT
      };

      const response = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        setNewMessage('');
        fetchProject(); // Refresh project data
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getProjectProgress = () => {
    if (!project?.tasks.length) return 0;
    const completedTasks = project.tasks.filter(task => task.status === 'COMPLETED').length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  };

  const getMilestoneProgress = () => {
    if (!project?.milestones.length) return 0;
    const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED').length;
    return Math.round((completedMilestones / project.milestones.length) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
            <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
            <Button asChild>
              <Link href="/projects">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-gray-600 mt-2">{project.description}</p>
        </div>
        <Badge className={statusColors[project.status]}>
          {project.status}
        </Badge>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Budget</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: project.currency
                  }).format(project.budget)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-xl font-bold text-gray-900">{getProjectProgress()}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tasks</p>
                <p className="text-xl font-bold text-gray-900">{project.tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Due Date</p>
                <p className="text-xl font-bold text-gray-900">
                  {project.endDate 
                    ? new Date(project.endDate).toLocaleDateString()
                    : 'Not set'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team */}
            <Card>
              <CardHeader>
                <CardTitle>Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={project.client.image || ''} />
                    <AvatarFallback>{project.client.name?.charAt(0) || 'C'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{project.client.name}</p>
                    <p className="text-sm text-gray-600">Client</p>
                  </div>
                </div>
                {project.professional && (
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={project.professional.image || ''} />
                      <AvatarFallback>{project.professional.name?.charAt(0) || 'P'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{project.professional.name}</p>
                      <p className="text-sm text-gray-600">Professional</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.messages.slice(0, 5).map((message) => (
                    <div key={message.id} className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.sender.image || ''} />
                        <AvatarFallback className="text-xs">
                          {message.sender.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{message.sender.name}</span>
                          <span className="text-gray-600 ml-2">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {/* Create Task */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title..."
                />
              </div>
              <div>
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Enter task description..."
                  rows={3}
                />
              </div>
              <Button onClick={createTask} disabled={!newTaskTitle.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <div className="space-y-4">
            {project.tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      {task.description && (
                        <p className="text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <Badge className={taskStatusColors[task.status]}>
                          {task.status}
                        </Badge>
                        {task.assignee && (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={task.assignee.image || ''} />
                              <AvatarFallback className="text-xs">
                                {task.assignee.name?.charAt(0) || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-600">{task.assignee.name}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Milestones</CardTitle>
              <CardDescription>
                Track project milestones and payment releases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        milestone.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {milestone.status === 'COMPLETED' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{milestone.title}</h4>
                      {milestone.description && (
                        <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-medium">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: project.currency
                          }).format(milestone.amount)}
                        </span>
                        <span className="text-sm text-gray-600">
                          Due: {new Date(milestone.dueDate).toLocaleDateString()}
                        </span>
                        <Badge className={
                          milestone.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800'
                            : milestone.status === 'OVERDUE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {milestone.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          {/* Send Message */}
          <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                />
                <div className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach File
                  </Button>
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <div className="space-y-4">
            {project.messages.map((message) => (
              <Card key={message.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={message.sender.image || ''} />
                      <AvatarFallback>{message.sender.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{message.sender.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {message.sender.role}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-900">{message.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Files</CardTitle>
              <CardDescription>
                Files and documents related to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.files.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <FileText className="w-8 h-8 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium">{file.originalName}</p>
                        <p className="text-sm text-gray-600">
                          Uploaded by {file.uploadedBy.name} on{' '}
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}