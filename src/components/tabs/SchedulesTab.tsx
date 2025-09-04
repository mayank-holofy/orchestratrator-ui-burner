import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Play, Pause, Trash2, Plus, RefreshCw, CheckCircle, XCircle, Bell, Coffee, MessageSquare, FileText, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { orchestratorAPI } from '../../services/orchestrator';
import '../ChatScrollbar.css';

interface CronJob {
  cron_id: string;
  thread_id: string;
  assistant_id?: string;
  schedule: string;
  payload: any;
  created_at: string;
  updated_at: string;
  end_time?: string;
  next_run_date?: string;
  metadata?: any;
  user_id?: string;
}

interface SchedulesTabProps {
  threadId?: string;
  assistantId?: string;
  activities?: any[];
}

const SchedulesTab = ({ threadId, assistantId, activities = [] }: SchedulesTabProps) => {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to convert cron to human-readable format
  const humanizeCronSchedule = (cronExpression: string) => {
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) return cronExpression;
    
    const [minute, hour, day, month, weekday] = parts;
    
    // Common patterns
    if (cronExpression === '0 9 * * 1-5') return 'Every weekday at 9:00 AM';
    if (cronExpression === '0 17 * * 1-5') return 'Every weekday at 5:00 PM';
    if (cronExpression === '0 9 * * *') return 'Daily at 9:00 AM';
    if (cronExpression === '0 0 * * 0') return 'Every Sunday at midnight';
    if (cronExpression === '*/15 * * * *') return 'Every 15 minutes';
    if (cronExpression === '0 */2 * * *') return 'Every 2 hours';
    
    // Try to build human-readable description
    let description = '';
    
    // Handle frequency
    if (minute === '0' && hour !== '*') {
      const hourNum = parseInt(hour);
      const timeStr = hourNum === 0 ? '12:00 AM' : 
                     hourNum < 12 ? `${hourNum}:00 AM` : 
                     hourNum === 12 ? '12:00 PM' : 
                     `${hourNum - 12}:00 PM`;
      
      if (weekday === '1-5') description = `Weekdays at ${timeStr}`;
      else if (weekday === '*' && day === '*') description = `Daily at ${timeStr}`;
      else if (weekday === '0') description = `Sundays at ${timeStr}`;
      else if (weekday === '1') description = `Mondays at ${timeStr}`;
      else description = `At ${timeStr}`;
    } else if (minute.startsWith('*/')) {
      const interval = minute.substring(2);
      description = `Every ${interval} minutes`;
    } else if (hour.startsWith('*/')) {
      const interval = hour.substring(2);
      description = `Every ${interval} hours`;
    }
    
    return description || cronExpression;
  };

  // Helper function to get task type icon
  const getTaskTypeIcon = (description: string, payload: any) => {
    const desc = description?.toLowerCase() || '';
    const payloadStr = JSON.stringify(payload).toLowerCase();
    
    if (desc.includes('calendar') || desc.includes('schedule') || desc.includes('meeting')) {
      return <Calendar className="w-4 h-4 text-blue-400" />;
    }
    if (desc.includes('report') || desc.includes('summary') || desc.includes('update')) {
      return <FileText className="w-4 h-4 text-green-400" />;
    }
    if (desc.includes('reminder') || desc.includes('notify') || desc.includes('alert')) {
      return <Bell className="w-4 h-4 text-yellow-400" />;
    }
    if (desc.includes('coffee') || desc.includes('break')) {
      return <Coffee className="w-4 h-4 text-orange-400" />;
    }
    if (desc.includes('message') || desc.includes('chat') || desc.includes('email')) {
      return <MessageSquare className="w-4 h-4 text-purple-400" />;
    }
    
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  // Helper function to make descriptions more personal
  const humanizeTaskDescription = (description: string, schedule: string) => {
    if (!description) {
      // Generate description based on schedule
      const humanSchedule = humanizeCronSchedule(schedule);
      return `Remind me - ${humanSchedule}`;
    }
    
    // Make descriptions more personal/human
    const personalPhrases = [
      'Remind me to',
      'Don\'t forget to',
      'Make sure to',
      'Time to',
      'Remember to',
      'Check on',
      'Follow up on',
      'Review'
    ];
    
    // If description doesn't start with a personal phrase, add one
    const lowerDesc = description.toLowerCase();
    const hasPersonalPhrase = personalPhrases.some(phrase => 
      lowerDesc.startsWith(phrase.toLowerCase())
    );
    
    if (!hasPersonalPhrase) {
      // Pick a random personal phrase based on task type
      if (lowerDesc.includes('calendar') || lowerDesc.includes('schedule')) {
        return `Check ${description}`;
      } else if (lowerDesc.includes('report') || lowerDesc.includes('summary')) {
        return `Time to ${description.toLowerCase()}`;
      } else if (lowerDesc.includes('meeting') || lowerDesc.includes('call')) {
        return `Don't forget: ${description}`;
      } else {
        return `Remind me to ${description.toLowerCase()}`;
      }
    }
    
    return description;
  };

  // Filter activities for schedule-related tasks (execution plans)
  const executionPlanCalls = activities.filter(activity => {
    if (activity.type === 'tool_call' && activity.data?.toolCall) {
      const toolName = activity.data.toolCall.name;
      return toolName === 'list_tasks' || 
             toolName === 'list_scheduled_tasks' || 
             toolName === 'check_scheduled_task' || 
             toolName === 'schedule_task';
    }
    return false;
  });

  // Filter activities to show scheduled tool calls (excluding execution plan calls to avoid duplication)
  const scheduledToolCalls = activities.filter(activity => {
    if (activity.type === 'tool_call' && activity.data?.toolCall) {
      const toolName = activity.data.toolCall.name;
      // Exclude execution plan tools to avoid showing them twice
      if (toolName === 'list_tasks' || 
          toolName === 'list_scheduled_tasks' || 
          toolName === 'check_scheduled_task' || 
          toolName === 'schedule_task') {
        return false;
      }
      const toolCallString = JSON.stringify(activity.data.toolCall);
      return toolCallString.includes('schedule');
    }
    return false;
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [formData, setFormData] = useState({
    schedule: '',
    description: '',
    input: '',
    endTime: ''
  });

  const fetchCronJobs = async () => {
    setIsLoading(true);
    try {
      const jobs = await orchestratorAPI.searchCronJobs({
        thread_id: threadId,
        assistant_id: assistantId,
        limit: 100
      });
      console.log('CronJobs API response:', jobs);
      console.log('Search params:', { thread_id: threadId, assistant_id: assistantId });
      
      // Also search for all cron jobs to see if any exist
      const allJobs = await orchestratorAPI.searchCronJobs({ limit: 100 });
      console.log('ALL CronJobs in system:', allJobs);
      
      setCronJobs(jobs);
    } catch (error) {
      console.error('Failed to fetch cron jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCronJobs();
    // Refresh every 30 seconds to update next run times
    const interval = setInterval(fetchCronJobs, 30000);
    return () => clearInterval(interval);
  }, [threadId, assistantId]);

  const handleCreateJob = async () => {
    if (!threadId || !assistantId) return;

    try {
      const payload = {
        assistant_id: assistantId,
        schedule: formData.schedule,
        input: formData.input ? JSON.parse(formData.input) : {},
        metadata: { description: formData.description },
        end_time: formData.endTime ? new Date(formData.endTime).toISOString() : undefined
      };

      await orchestratorAPI.createCronJob(threadId, payload);
      setShowCreateForm(false);
      setFormData({ schedule: '', description: '', input: '', endTime: '' });
      fetchCronJobs();
    } catch (error) {
      console.error('Failed to create cron job:', error);
    }
  };

  const handleDeleteJob = async (cronId: string) => {
    try {
      await orchestratorAPI.deleteCronJob(cronId);
      fetchCronJobs();
    } catch (error) {
      console.error('Failed to delete cron job:', error);
    }
  };

  const formatNextRun = (nextRunDate?: string) => {
    if (!nextRunDate) return 'Not scheduled';
    
    const date = new Date(nextRunDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Overdue';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}m`;
    if (diffMinutes > 0) return `${diffMinutes}m`;
    
    const diffSeconds = Math.floor(diffMs / 1000);
    return `${diffSeconds}s`;
  };

  const formatScheduledTime = (nextRunDate?: string) => {
    if (!nextRunDate) return 'No schedule';
    const date = new Date(nextRunDate);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getJobStatus = (job: CronJob) => {
    const now = new Date();
    const endTime = job.end_time ? new Date(job.end_time) : null;
    
    if (endTime && now > endTime) return 'expired';
    if (job.next_run_date) return 'scheduled';
    return 'inactive';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Pause className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'expired':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      default:
        return 'bg-gray-800/30 border-gray-700/30 text-gray-400';
    }
  };

  return (
    <motion.div
      key="schedules"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto tab-scrollbar"
    >
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-2xl font-light">SCHEDULED TASKS</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCronJobs}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1 text-sm rounded bg-gray-800/30 text-gray-400 border border-gray-700/30 hover:bg-gray-700/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-3 py-1 text-sm rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schedule Task
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-2">
          {cronJobs.length} cron job{cronJobs.length !== 1 ? 's' : ''} • {scheduledToolCalls.length} scheduled tool call{scheduledToolCalls.length !== 1 ? 's' : ''} • {executionPlanCalls.length} execution plan{executionPlanCalls.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Create Job Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-800/20 rounded-lg border border-gray-700/30"
          >
            <h3 className="text-white font-medium mb-4">Schedule New Task</h3>
            
            <div className="grid gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Cron Schedule</label>
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  placeholder="0 9 * * 1-5 (9 AM weekdays)"
                  className="w-full p-2 bg-gray-900/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Use cron format: minute hour day month weekday</p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Daily report generation"
                  className="w-full p-2 bg-gray-900/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Input (JSON)</label>
                <textarea
                  value={formData.input}
                  onChange={(e) => setFormData({ ...formData, input: e.target.value })}
                  placeholder='{"message": "Run daily report"}'
                  rows={3}
                  className="w-full p-2 bg-gray-900/50 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-blue-500 outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">End Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full p-2 bg-gray-900/50 border border-gray-700 rounded text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm rounded bg-gray-800/30 text-gray-400 border border-gray-700/30 hover:bg-gray-700/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateJob}
                disabled={!formData.schedule}
                className="px-4 py-2 text-sm rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                Create Schedule
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cron Jobs List */}
      <div className="space-y-3">
        {isLoading && cronJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Loading scheduled tasks...</p>
          </div>
        ) : cronJobs.length === 0 && executionPlanCalls.length === 0 && scheduledToolCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Clock className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No scheduled tasks</p>
            <p className="text-xs mt-2 opacity-70">Create a schedule to automate tasks</p>
          </div>
        ) : (
          cronJobs.map((job) => {
            const status = getJobStatus(job);
            const humanDescription = humanizeTaskDescription(job.metadata?.description || 'Scheduled Task', job.schedule);
            const humanSchedule = humanizeCronSchedule(job.schedule);
            const taskIcon = getTaskTypeIcon(job.metadata?.description || '', job.payload);
            
            return (
              <motion.div
                key={job.cron_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group p-4 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Clean minimal icon */}
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      {taskIcon}
                    </div>
                    
                    <div>
                      <h3 className="text-white font-medium text-sm leading-tight">
                        {humanDescription}
                      </h3>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {humanSchedule}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Countdown timer and schedule info */}
                    <div className="text-right">
                      <div className={`text-xs font-mono tabular-nums ${
                        status === 'scheduled' ? 'text-blue-400' :
                        status === 'expired' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {formatNextRun(job.next_run_date)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {formatScheduledTime(job.next_run_date)}
                      </div>
                    </div>
                    
                    {/* Status indicator */}
                    <div className={`w-2 h-2 rounded-full ${
                      status === 'scheduled' ? 'bg-blue-400 animate-pulse' :
                      status === 'expired' ? 'bg-red-400' :
                      'bg-gray-400'
                    }`} />
                    
                    {/* Minimal delete button */}
                    <button
                      onClick={() => handleDeleteJob(job.cron_id)}
                      className="w-6 h-6 rounded-full bg-red-500/0 hover:bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Remove"
                    >
                      <XCircle className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Execution Plans - Show actual scheduling activities */}
        {executionPlanCalls.length > 0 && (
          <div className="mt-8">
            <div className="space-y-3">
              {executionPlanCalls.map((activity, index) => {
                // Extract human-readable info from the activity
                const toolName = activity.data?.toolCall?.name || 'Task';
                const args = activity.data?.toolCall?.args || {};
                const result = activity.data?.toolCall?.result || '';
                
                // Determine if this was scheduling or actual execution
                const isSchedulingAction = toolName === 'schedule_task' || result.includes('scheduled');
                const isCompletedExecution = !isSchedulingAction && result.includes('completed');
                
                // Create human description based on tool call
                let humanDescription = 'Task activity';
                let statusText = 'Activity';
                let iconColor = 'blue';
                
                if (toolName === 'schedule_task') {
                  humanDescription = `Scheduled: ${args.message || 'New task'}`;
                  // Calculate execution time from delay
                  const executionTime = new Date(new Date(activity.timestamp).getTime() + (args.delay_minutes * 60000));
                  statusText = executionTime;
                  iconColor = 'orange';
                } else if (toolName.includes('calendar')) {
                  humanDescription = 'Calendar check scheduled';
                  statusText = 'Scheduled';
                  iconColor = 'blue';
                } else if (toolName.includes('list')) {
                  humanDescription = 'Task list check';
                  statusText = isCompletedExecution ? 'Completed' : 'Scheduled';
                  iconColor = isCompletedExecution ? 'green' : 'blue';
                }
                
                const borderColor = iconColor === 'green' ? 'border-green-500/[0.15]' : 
                                  iconColor === 'orange' ? 'border-orange-500/[0.15]' : 
                                  'border-blue-500/[0.15]';
                const bgColor = iconColor === 'green' ? 'bg-green-500/10' : 
                               iconColor === 'orange' ? 'bg-orange-500/10' : 
                               'bg-blue-500/10';
                const iconTextColor = iconColor === 'green' ? 'text-green-400' : 
                                     iconColor === 'orange' ? 'text-orange-400' : 
                                     'text-blue-400';
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl bg-white/[0.02] backdrop-blur-xl border ${borderColor} hover:bg-white/[0.03] transition-all duration-200`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Calendar widget or activity icon */}
                        {toolName === 'schedule_task' && args.delay_minutes && statusText instanceof Date ? (
                          <div className="relative">
                            {/* Mini calendar widget with time */}
                            <div className="w-20 h-20 bg-white/[0.03] border border-white/[0.08] rounded-lg flex flex-col items-center justify-center p-1">
                              <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">
                                {statusText.toLocaleDateString([], { month: 'short' })}
                              </div>
                              <div className={`text-lg font-bold ${iconTextColor} leading-none`}>
                                {statusText.getDate()}
                              </div>
                              <div className={`text-[9px] ${iconTextColor} opacity-80 mt-0.5`}>
                                {statusText.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            {/* Small indicator dot */}
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
                          </div>
                        ) : (
                          <div className={`w-8 h-8 rounded-full ${bgColor} border border-${iconColor}-500/20 flex items-center justify-center`}>
                            {isCompletedExecution ? 
                              <CheckCircle className={`w-4 h-4 ${iconTextColor}`} /> :
                              <Clock className={`w-4 h-4 ${iconTextColor}`} />
                            }
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-white font-medium text-sm leading-tight">
                            {humanDescription}
                          </h4>
                          <p className={`text-xs mt-0.5 ${iconTextColor}`}>
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Countdown info */}
                      {toolName === 'schedule_task' && args.delay_minutes && statusText instanceof Date ? (
                        <div className="text-right">
                          <div className="text-[10px] text-gray-500">
                            in {args.delay_minutes}min
                          </div>
                        </div>
                      ) : (
                        <div className={`text-xs font-medium ${iconTextColor} px-2 py-1 rounded-full ${bgColor}`}>
                          {typeof statusText === 'string' ? statusText : 'Scheduled'}
                        </div>
                      )}
                    </div>
                    
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scheduled Tool Calls */}
        {scheduledToolCalls.length > 0 && (
          <div className="mt-6">
            <h3 className="text-white text-lg font-light mb-3">SCHEDULED TOOL CALLS</h3>
            <div className="space-y-3">
              {scheduledToolCalls.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-lg border bg-blue-500/10 border-blue-500/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        <CheckCircle className="w-4 h-4 text-blue-400" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-white font-medium">
                          {activity.data?.toolCall?.name || 'Scheduled Tool Call'}
                        </h4>
                        <p className="text-blue-400 text-sm mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                        {activity.data?.toolCall?.args && (
                          <div className="mt-2 p-2 bg-black/20 rounded text-xs">
                            <pre className="text-gray-300 whitespace-pre-wrap">
                              {JSON.stringify(activity.data.toolCall.args, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {cronJobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-gray-800/20 rounded-lg border border-gray-700/30"
        >
          <h4 className="text-gray-400 text-xs mb-3">SCHEDULE SUMMARY</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-light text-green-400">
                {cronJobs.filter(job => getJobStatus(job) === 'scheduled').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Active</p>
            </div>
            <div>
              <p className="text-2xl font-light text-red-400">
                {cronJobs.filter(job => getJobStatus(job) === 'expired').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Expired</p>
            </div>
            <div>
              <p className="text-2xl font-light text-gray-400">
                {cronJobs.filter(job => getJobStatus(job) === 'inactive').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Inactive</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SchedulesTab;