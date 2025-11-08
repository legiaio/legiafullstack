'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { CreateProjectRequest, ProjectPriority } from '@/types/project';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
}

interface Milestone {
  title: string;
  description: string;
  amount: number;
  dueDate: string;
}

export default function NewProjectPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    serviceId: '',
    budget: '',
    currency: 'IDR',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    priority: 'MEDIUM' as ProjectPriority
  });
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      title: 'Project Kickoff',
      description: 'Initial project setup and planning',
      amount: 0,
      dueDate: ''
    }
  ]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addMilestone = () => {
    setMilestones(prev => [...prev, {
      title: '',
      description: '',
      amount: 0,
      dueDate: ''
    }]);
  };

  const updateMilestone = (index: number, field: string, value: string | number) => {
    setMilestones(prev => prev.map((milestone, i) => 
      i === index ? { ...milestone, [field]: value } : milestone
    ));
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateTotalMilestoneAmount = () => {
    return milestones.reduce((total, milestone) => total + (milestone.amount || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.serviceId || !formData.budget) {
      alert('Please fill in all required fields');
      return;
    }

    const totalMilestoneAmount = calculateTotalMilestoneAmount();
    const projectBudget = parseFloat(formData.budget);
    
    if (totalMilestoneAmount > projectBudget) {
      alert('Total milestone amount cannot exceed project budget');
      return;
    }

    setLoading(true);

    try {
      const projectData: CreateProjectRequest = {
        title: formData.title,
        description: formData.description,
        serviceId: formData.serviceId,
        budget: projectBudget,
        currency: formData.currency,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        priority: formData.priority,
        milestones: milestones.filter(m => m.title && m.dueDate).map(m => ({
          ...m,
          amount: m.amount || 0
        }))
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        const project = await response.json();
        router.push(`/projects/${project.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find(s => s.id === formData.serviceId);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-2">Set up a new project with milestones and budget</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>Basic details about your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter project title..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your project requirements..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="service">Service Category *</Label>
                  <Select value={formData.serviceId} onValueChange={(value) => handleInputChange('serviceId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service category" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{service.title}</span>
                            <Badge variant="outline" className="ml-2">
                              {service.category}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">Budget *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="budget"
                        type="number"
                        value={formData.budget}
                        onChange={(e) => handleInputChange('budget', e.target.value)}
                        placeholder="0"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Milestones</CardTitle>
                    <CardDescription>Break down your project into manageable milestones</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Milestone {index + 1}</h4>
                      {milestones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMilestone(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={milestone.title}
                          onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                          placeholder="Milestone title..."
                        />
                      </div>

                      <div>
                        <Label>Amount (IDR)</Label>
                        <Input
                          type="number"
                          value={milestone.amount}
                          onChange={(e) => updateMilestone(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={milestone.description}
                        onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        placeholder="Milestone description..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={milestone.dueDate}
                        onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                {formData.budget && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Total Milestone Amount:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        }).format(calculateTotalMilestoneAmount())}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Project Budget:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        }).format(parseFloat(formData.budget) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-medium mt-1 pt-1 border-t">
                      <span>Remaining:</span>
                      <span className={
                        (parseFloat(formData.budget) || 0) - calculateTotalMilestoneAmount() < 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }>
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        }).format((parseFloat(formData.budget) || 0) - calculateTotalMilestoneAmount())}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Service */}
            {selectedService && (
              <Card>
                <CardHeader>
                  <CardTitle>Selected Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{selectedService.title}</h4>
                      <Badge variant="outline">{selectedService.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{selectedService.description}</p>
                    <div className="text-lg font-bold text-blue-600">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR'
                      }).format(selectedService.price)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Project...' : 'Create Project'}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link href="/projects">Cancel</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}