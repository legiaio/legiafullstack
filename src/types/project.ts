export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  budget: number;
  currency: string;
  startDate: Date;
  endDate?: Date;
  clientId: string;
  professionalId?: string;
  serviceId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  client: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  professional?: {
    id: string;
    name: string;
    email: string;
    image?: string;
    title: string;
  };
  service: {
    id: string;
    title: string;
    category: string;
  };
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  messages: ProjectMessage[];
  files: ProjectFile[];
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  assignee?: {
    id: string;
    name: string;
    image?: string;
  };
  comments: TaskComment[];
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  amount: number;
  dueDate: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  content: string;
  type: MessageType;
  createdAt: Date;
  
  // Relations
  sender: {
    id: string;
    name: string;
    image?: string;
    role: 'CLIENT' | 'PROFESSIONAL';
  };
  attachments: MessageAttachment[];
}

export interface ProjectFile {
  id: string;
  projectId: string;
  uploadedById: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: Date;
  
  // Relations
  uploadedBy: {
    id: string;
    name: string;
    image?: string;
  };
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  
  // Relations
  author: {
    id: string;
    name: string;
    image?: string;
  };
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

// Enums
export enum ProjectStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ProjectPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE'
}

export enum MessageType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  MILESTONE_UPDATE = 'MILESTONE_UPDATE',
  TASK_UPDATE = 'TASK_UPDATE'
}

// Request/Response types
export interface CreateProjectRequest {
  title: string;
  description: string;
  serviceId: string;
  budget: number;
  currency: string;
  startDate: string;
  endDate?: string;
  priority: ProjectPriority;
  milestones: {
    title: string;
    description?: string;
    amount: number;
    dueDate: string;
  }[];
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  budget?: number;
  endDate?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  assignedTo?: string;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  dueDate?: string;
}

export interface SendMessageRequest {
  content: string;
  type: MessageType;
  attachments?: {
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  }[];
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  averageProjectDuration: number;
  taskCompletionRate: number;
  clientSatisfactionRate: number;
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  priority?: ProjectPriority[];
  clientId?: string;
  professionalId?: string;
  serviceCategory?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}