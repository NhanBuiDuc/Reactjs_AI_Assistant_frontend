import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Clock, MapPin, Users, X, Calendar, Tag, Settings, 
  AlertCircle, Repeat, ChevronDown, ChevronUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/calendar_ui/dialog';
import { Button } from '@/components/calendar_ui/button';
import { Input } from '@/components/calendar_ui/input';
import { Label } from '@/components/calendar_ui/label';
import { Textarea } from '@/components/calendar_ui/textarea';

// Types matching your Django Task model
interface Task {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  deadline?: string;
  estimated_duration_minutes: number;
  minimum_duration_minutes?: number;
  maximum_duration_minutes?: number;
  base_priority: number;
  urgency_multiplier: number;
  can_be_split: boolean;
  requires_consecutive_time: boolean;
  preferred_time_of_day?: string[];
  avoid_time_of_day?: string[];
  deadline_flexibility_minutes: number;
  is_repeat: boolean;
  repeat_pattern?: string;
  repeat_frequency: number;
  repeat_days_of_week?: string[];
  repeat_end_date?: string;
  priority: number;
  urgency: number;
  difficulty_level: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  location?: string;
  ai_suggested: boolean;
}

interface TaskCategory {
  id: string;
  name: string;
  color_hex: string;
  icon: string;
}

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedTask?: Task | null;
  onSaveTask: (task: Omit<Task, 'id'>) => void;
  categories?: TaskCategory[];
}

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Critical', color: '#ef4444' },
  { value: 2, label: 'High', color: '#f97316' },
  { value: 3, label: 'Medium', color: '#eab308' },
  { value: 4, label: 'Low', color: '#3b82f6' },
  { value: 5, label: 'Lowest', color: '#6b7280' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'on_hold', label: 'On Hold' },
];

const REPEAT_PATTERNS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const EventDialog = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  selectedTask, 
  onSaveTask,
  categories = []
}: EventDialogProps) => {
  const [formData, setFormData] = useState<Omit<Task, 'id'>>({
    name: '',
    description: '',
    category: '',
    tags: [],
    deadline: new Date().toISOString().slice(0, 16), // Default to current date/time
    estimated_duration_minutes: 60,
    minimum_duration_minutes: 30,
    maximum_duration_minutes: 120,
    base_priority: 3,
    urgency_multiplier: 1.0,
    can_be_split: true,
    requires_consecutive_time: false,
    preferred_time_of_day: [],
    avoid_time_of_day: [],
    deadline_flexibility_minutes: 0,
    is_repeat: false,
    repeat_pattern: 'daily',
    repeat_frequency: 1,
    repeat_days_of_week: [],
    priority: 3,
    urgency: 3,
    difficulty_level: 3,
    status: 'pending',
    location: '',
    ai_suggested: false,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data when task changes
  useEffect(() => {
    if (selectedTask) {
      setFormData({
        name: selectedTask.name || '',
        description: selectedTask.description || '',
        category: selectedTask.category || '',
        tags: selectedTask.tags || [],
        deadline: selectedTask.deadline || '',
        estimated_duration_minutes: selectedTask.estimated_duration_minutes || 60,
        minimum_duration_minutes: selectedTask.minimum_duration_minutes || 30,
        maximum_duration_minutes: selectedTask.maximum_duration_minutes || 120,
        base_priority: selectedTask.base_priority || 3,
        urgency_multiplier: selectedTask.urgency_multiplier || 1.0,
        can_be_split: selectedTask.can_be_split !== undefined ? selectedTask.can_be_split : true,
        requires_consecutive_time: selectedTask.requires_consecutive_time || false,
        preferred_time_of_day: selectedTask.preferred_time_of_day || [],
        avoid_time_of_day: selectedTask.avoid_time_of_day || [],
        deadline_flexibility_minutes: selectedTask.deadline_flexibility_minutes || 0,
        is_repeat: selectedTask.is_repeat || false,
        repeat_pattern: selectedTask.repeat_pattern || 'daily',
        repeat_frequency: selectedTask.repeat_frequency || 1,
        repeat_days_of_week: selectedTask.repeat_days_of_week || [],
        priority: selectedTask.priority || 3,
        urgency: selectedTask.urgency || 3,
        difficulty_level: selectedTask.difficulty_level || 3,
        status: selectedTask.status || 'pending',
        location: selectedTask.location || '',
        ai_suggested: selectedTask.ai_suggested || false,
      });
    } else if (selectedDate) {
      // Set deadline to selected date if creating new task
      const deadlineString = format(selectedDate, "yyyy-MM-dd'T'HH:mm");
      setFormData(prev => ({
        ...prev,
        deadline: deadlineString,
      }));
    }
  }, [selectedTask, selectedDate]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags?.includes(currentTag.trim())) {
      handleInputChange('tags', [...(formData.tags || []), currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Task name is required');
      return;
    }

    setIsLoading(true);
    try {
      const taskData = {
        ...formData,
        // Ensure arrays are properly formatted
        tags: formData.tags || [],
        preferred_time_of_day: formData.preferred_time_of_day || [],
        avoid_time_of_day: formData.avoid_time_of_day || [],
        repeat_days_of_week: formData.repeat_days_of_week || [],
      };

      await onSaveTask(taskData);
      handleClose();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      tags: [],
      deadline: new Date().toISOString().slice(0, 16), // Reset to current date/time
      estimated_duration_minutes: 60,
      minimum_duration_minutes: 30,
      maximum_duration_minutes: 120,
      base_priority: 3,
      urgency_multiplier: 1.0,
      can_be_split: true,
      requires_consecutive_time: false,
      preferred_time_of_day: [],
      avoid_time_of_day: [],
      deadline_flexibility_minutes: 0,
      is_repeat: false,
      repeat_pattern: 'daily',
      repeat_frequency: 1,
      repeat_days_of_week: [],
      priority: 3,
      urgency: 3,
      difficulty_level: 3,
      status: 'pending',
      location: '',
      ai_suggested: false,
    });
    setShowAdvanced(false);
    setCurrentTag('');
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {selectedTask ? 'Edit Task' : 'New Task'}
            </span>
            <Button variant="ghost" size="icon" onClick={handleClose} disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Left Column - Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            {selectedDate && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                📅 {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>
            )}

            {/* Task Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Task Name *</Label>
              <Input
                id="name"
                placeholder="What needs to be done?"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-lg font-medium"
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add details about this task..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="min-h-[80px]"
                disabled={isLoading}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                disabled={isLoading}
              >
                <option value="" style={{ color: '#6b7280' }}>Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id} style={{ color: '#1f2937' }}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                disabled={isLoading}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value} style={{ color: '#1f2937' }}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  disabled={isLoading}
                />
                <Button type="button" onClick={addTag} size="sm" disabled={isLoading}>
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.tags?.map((tag) => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                    onClick={() => !isLoading && removeTag(tag)}
                  >
                    {tag} <X className="h-3 w-3 ml-1" />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Timing & Priority */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Timing & Priority</h3>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Deadline
              </Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Duration */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>Est. Duration (min)</Label>
                <Input
                  type="number"
                  value={formData.estimated_duration_minutes}
                  onChange={(e) => handleInputChange('estimated_duration_minutes', parseInt(e.target.value) || 60)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>Min (min)</Label>
                <Input
                  type="number"
                  value={formData.minimum_duration_minutes || ''}
                  onChange={(e) => handleInputChange('minimum_duration_minutes', parseInt(e.target.value) || undefined)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>Max (min)</Label>
                <Input
                  type="number"
                  value={formData.maximum_duration_minutes || ''}
                  onChange={(e) => handleInputChange('maximum_duration_minutes', parseInt(e.target.value) || undefined)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Priority Settings */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                  disabled={isLoading}
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority.value} value={priority.value} style={{ color: '#1f2937' }}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Urgency</Label>
                <select
                  value={formData.urgency}
                  onChange={(e) => handleInputChange('urgency', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                  disabled={isLoading}
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority.value} value={priority.value} style={{ color: '#1f2937' }}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => handleInputChange('difficulty_level', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                  disabled={isLoading}
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority.value} value={priority.value} style={{ color: '#1f2937' }}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="Where will this task be done?"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Task Constraints */}
            <div className="space-y-3">
              <Label>Task Constraints</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.can_be_split}
                    onChange={(e) => handleInputChange('can_be_split', e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={isLoading}
                  />
                  <span className="text-sm">Can be split into chunks</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.requires_consecutive_time}
                    onChange={(e) => handleInputChange('requires_consecutive_time', e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={isLoading}
                  />
                  <span className="text-sm">Requires consecutive time</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.ai_suggested}
                    onChange={(e) => handleInputChange('ai_suggested', e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={isLoading}
                  />
                  <span className="text-sm">AI suggested task</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <div className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-between"
            disabled={isLoading}
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Advanced Settings
            </span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showAdvanced && (
            <div className="mt-4 space-y-6">
              {/* Repeat Settings */}
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_repeat}
                    onChange={(e) => handleInputChange('is_repeat', e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={isLoading}
                  />
                  <span className="flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    Repeat this task
                  </span>
                </label>

                {formData.is_repeat && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Pattern</Label>
                      <select
                        value={formData.repeat_pattern}
                        onChange={(e) => handleInputChange('repeat_pattern', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
                        disabled={isLoading}
                      >
                        {REPEAT_PATTERNS.map((pattern) => (
                          <option key={pattern.value} value={pattern.value} style={{ color: '#1f2937' }}>
                            {pattern.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.repeat_frequency}
                        onChange={(e) => handleInputChange('repeat_frequency', parseInt(e.target.value) || 1)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={formData.repeat_end_date}
                        onChange={(e) => handleInputChange('repeat_end_date', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.name.trim() || isLoading}
            className="bg-primary hover:bg-primary-hover"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {selectedTask ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              selectedTask ? 'Update Task' : 'Create Task'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};