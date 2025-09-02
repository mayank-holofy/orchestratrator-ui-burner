import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Play, Pause, Trash2, Plus, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
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
    
    if (diffDays > 0) return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `In ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
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
            
            return (
              <motion.div
                key={job.cron_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`
                  p-4 rounded-lg border transition-all duration-300
                  ${getStatusColor(status)}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(status)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-medium">
                            {job.metadata?.description || 'Scheduled Task'}
                          </h3>
                          <p className="text-gray-400 text-sm mt-1 font-mono">
                            {job.schedule}
                          </p>
                        </div>
                        
                        <div className="text-right text-sm">
                          <p className="text-gray-400">Next run:</p>
                          <p className="text-gray-300 font-medium">
                            {formatNextRun(job.next_run_date)}
                          </p>
                        </div>
                      </div>

                      {job.next_run_date && (
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            Created: {new Date(job.created_at).toLocaleDateString()}
                          </span>
                          {job.end_time && (
                            <span>
                              Ends: {new Date(job.end_time).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDeleteJob(job.cron_id)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      title="Delete scheduled task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Execution Plans */}
        {executionPlanCalls.length > 0 && (
          <div className="mt-6">
            <h3 className="text-white text-lg font-light mb-3">EXECUTION PLANS</h3>
            <div className="space-y-3">
              {executionPlanCalls.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-lg border bg-purple-500/10 border-purple-500/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        <CheckCircle className="w-4 h-4 text-purple-400" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-white font-medium">
                          {activity.data?.toolCall?.name || 'Execution Plan'}
                        </h4>
                        <p className="text-purple-400 text-sm mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                        {activity.data?.toolCall?.args && (
                          <div className="mt-2 p-2 bg-black/20 rounded text-xs">
                            <div className="text-purple-300 mb-1">Arguments:</div>
                            <pre className="text-gray-300 whitespace-pre-wrap">
                              {JSON.stringify(activity.data.toolCall.args, null, 2)}
                            </pre>
                          </div>
                        )}
                        {activity.data?.toolCall?.result && (
                          <div className="mt-2 p-2 bg-black/20 rounded text-xs">
                            <div className="text-purple-300 mb-1">Result:</div>
                            <div className="text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                              {typeof activity.data.toolCall.result === 'string' 
                                ? activity.data.toolCall.result
                                : JSON.stringify(activity.data.toolCall.result, null, 2)
                              }
                            </div>
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