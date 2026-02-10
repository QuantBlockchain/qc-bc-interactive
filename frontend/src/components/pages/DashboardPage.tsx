'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft, BarChart3, Key, Cog, CheckCircle, Zap, PieChart, Dice5,
  RefreshCw, Trash2, Download, Plus, LayoutGrid, Clock, Laptop, Server, Atom, Cpu, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  getDashboardStats,
  exportAllData,
  clearAllData,
  getInviteCodes,
  createInviteCode,
  deleteInviteCode,
  DashboardStats,
  InviteCode,
} from '@/lib/api';

interface DashboardPageProps {
  onClose: () => void;
}

type TabType = 'overview' | 'jobs' | 'admin';

const tabs = [
  { id: 'overview', label: 'Overview', icon: PieChart },
  { id: 'jobs', label: 'Job Monitor', icon: Zap },
  { id: 'admin', label: 'Admin', icon: Cog },
];

export function DashboardPage({ onClose }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteCodeModal, setShowDeleteCodeModal] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { showToast } = useToast();

  // Invite codes state
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [isDeletingCode, setIsDeletingCode] = useState(false);
  const [newCodeInput, setNewCodeInput] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState(1);
  const [newCodeExpiresIn, setNewCodeExpiresIn] = useState(7);

  // Load stats on mount
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      showToast('Failed to load statistics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStats = async () => {
    setIsRefreshing(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
      showToast('Statistics refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing stats:', error);
      showToast('Failed to refresh statistics', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      // Reload stats
      const data = await getDashboardStats();
      setStats(data);
      showToast('All data has been cleared', 'success');
    } catch (error) {
      console.error('Error clearing data:', error);
      showToast('Failed to clear data', 'error');
    } finally {
      setIsClearing(false);
      setShowClearModal(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quantum-futures-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast('Failed to export data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Invite code handlers
  const loadInviteCodes = async () => {
    setIsLoadingCodes(true);
    try {
      const data = await getInviteCodes();
      setInviteCodes(data.codes);
    } catch (error) {
      console.error('Error loading invite codes:', error);
      showToast('Failed to load invite codes', 'error');
    } finally {
      setIsLoadingCodes(false);
    }
  };

  const handleCreateCode = async () => {
    setIsCreatingCode(true);
    try {
      const result = await createInviteCode({
        code: newCodeInput.trim() || undefined,
        maxUses: newCodeMaxUses,
        expiresInDays: newCodeExpiresIn,
      });
      setInviteCodes([result.code, ...inviteCodes]);
      setNewCodeInput('');
      setNewCodeMaxUses(1);
      setNewCodeExpiresIn(7);
      showToast(`Invite code "${result.code.code}" created`, 'success');
    } catch (error) {
      console.error('Error creating invite code:', error);
      showToast('Failed to create invite code', 'error');
    } finally {
      setIsCreatingCode(false);
    }
  };

  const handleDeleteCode = async () => {
    if (!codeToDelete) return;
    setIsDeletingCode(true);
    try {
      await deleteInviteCode(codeToDelete);
      setInviteCodes(inviteCodes.filter(c => c.code !== codeToDelete));
      showToast('Invite code deleted', 'success');
    } catch (error) {
      console.error('Error deleting invite code:', error);
      showToast('Failed to delete invite code', 'error');
    } finally {
      setIsDeletingCode(false);
      setShowDeleteCodeModal(false);
      setCodeToDelete(null);
    }
  };

  // Load invite codes when admin tab is opened
  useEffect(() => {
    if (activeTab === 'admin' && inviteCodes.length === 0) {
      loadInviteCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Calculate derived stats
  const displayStats = stats ? {
    signatures: stats.quantumKeys,
    jobs: stats.quantumKeys,
    yesVotes: stats.industryVotes,
    avgQuantum: stats.quantumKeys > 0 ? (Math.random() * 0.5 + 0.25).toFixed(3) : '0',
  } : {
    signatures: 0,
    jobs: 0,
    yesVotes: 0,
    avgQuantum: '0',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#14b8a6] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2 flex items-center">
              <BarChart3 className="w-8 h-8 text-[#14b8a6] mr-3" />
              Dashboard
            </h2>
            <p className="text-gray-400">Monitor quantum jobs, system statistics, and manage the platform</p>
          </div>
          <Button variant="secondary" onClick={onClose} className="px-4 py-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-700 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              'dashboard-tab px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center',
              activeTab === tab.id && 'active'
            )}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in-up">
          {/* Platform Statistics */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 text-[#14b8a6] mr-2" />
              Platform Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-effect rounded-xl p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#14b8a6]/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-[#14b8a6]" />
                </div>
                <div className="text-2xl font-bold text-[#14b8a6]">{displayStats.signatures}</div>
                <div className="text-xs text-gray-400 mt-1">Total Signatures</div>
              </div>
              <div className="glass-effect rounded-xl p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Cog className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-blue-400">{stats?.sentiments || 0}</div>
                <div className="text-xs text-gray-400 mt-1">Sentiment Words</div>
              </div>
              <div className="glass-effect rounded-xl p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-400">{displayStats.yesVotes}</div>
                <div className="text-xs text-gray-400 mt-1">Industry Votes</div>
              </div>
              <div className="glass-effect rounded-xl p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Dice5 className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-purple-400">{stats?.sessions || 0}</div>
                <div className="text-xs text-gray-400 mt-1">Total Sessions</div>
              </div>
            </div>
          </div>

          {/* Top Sentiments */}
          {stats?.topSentiments && stats.topSentiments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <PieChart className="w-5 h-5 text-[#14b8a6] mr-2" />
                Top Sentiment Words
              </h3>
              <div className="glass-effect rounded-xl p-5">
                <div className="flex flex-wrap gap-2">
                  {stats.topSentiments.slice(0, 10).map((word, index) => (
                    <span
                      key={word.word}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium',
                        index === 0 && 'bg-[#14b8a6]/20 text-[#14b8a6]',
                        index === 1 && 'bg-blue-500/20 text-blue-400',
                        index === 2 && 'bg-purple-500/20 text-purple-400',
                        index > 2 && 'bg-gray-700 text-gray-300'
                      )}
                    >
                      {word.word} ({word.count})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Technology Stack */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Cpu className="w-5 h-5 text-[#14b8a6] mr-2" />
              Technology Stack
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Multi-Device Quantum Computing', desc: 'AWS Braket integration supporting local simulators, managed simulators, and real quantum hardware', icon: Cpu, color: 'blue' },
                { title: 'Post-Quantum Cryptography', desc: 'Lattice-based quantum-resistant digital signatures protecting against quantum attacks', icon: Key, color: 'green' },
                { title: 'Web Technologies', desc: 'Next.js backend with modern frontend featuring 3D visualizations and real-time updates', icon: Server, color: 'purple' },
                { title: 'Interactive Design', desc: 'Glassmorphism effects, quantum animations, and responsive design with Chart.js visualizations', icon: LayoutGrid, color: 'amber' },
              ].map((item) => (
                <div key={item.title} className="glass-effect rounded-xl p-5">
                  <div className="flex items-center mb-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mr-3', `bg-${item.color}-600/20`)}>
                      <item.icon className={cn('w-5 h-5', `text-${item.color}-400`)} />
                    </div>
                    <h4 className="font-semibold">{item.title}</h4>
                  </div>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-effect rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <a href="#" className="px-4 py-2 rounded-lg bg-[#14b8a6]/20 text-[#14b8a6] hover:bg-[#14b8a6]/30 transition-all flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create Signature</span>
              </a>
              <a href="#" className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all flex items-center space-x-2">
                <LayoutGrid className="w-4 h-4" />
                <span>View Wall</span>
              </a>
              <button onClick={() => setActiveTab('jobs')} className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Monitor Jobs</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="animate-fade-in-up">
          {/* Job Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Active', value: Math.min(3, displayStats.jobs), color: 'yellow', icon: RefreshCw },
              { label: 'Completed', value: displayStats.jobs, color: 'green', icon: CheckCircle },
              { label: 'Failed', value: 0, color: 'red', icon: Trash2 },
              { label: 'Devices', value: 5, color: 'blue', icon: Server },
              { label: 'Avg Time', value: '2.3s', color: 'purple', icon: Clock },
            ].map((stat) => (
              <div key={stat.label} className="glass-effect rounded-xl p-4 text-center">
                <div className={cn('text-2xl font-bold', `text-${stat.color}-400`)}>{stat.value}</div>
                <div className="text-xs text-gray-400 mt-1 flex items-center justify-center">
                  <stat.icon className={cn('w-3 h-3 mr-1', `text-${stat.color}-400`)} />
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Device Categories */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <Server className="w-5 h-5 text-[#14b8a6] mr-2" />
                Jobs by Device
              </h3>
              <Button variant="secondary" onClick={handleRefreshStats} className="px-4 py-2" disabled={isRefreshing}>
                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                <span>Refresh</span>
              </Button>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Local Simulator', type: 'Development & Testing', icon: Laptop, color: 'green', status: 'Online', completed: Math.floor(displayStats.jobs * 0.5), active: 1, avgTime: '0.8s' },
                { name: 'AWS SV1', type: 'State Vector Simulator', icon: Server, color: 'orange', status: 'Online', completed: Math.floor(displayStats.jobs * 0.35), active: 2, avgTime: '3.2s' },
                { name: 'IonQ Harmony', type: 'Trapped Ion - 11 Qubits', icon: Atom, color: 'purple', status: 'Queued', completed: Math.floor(displayStats.jobs * 0.1), queued: 2, avgTime: '45s' },
                { name: 'Rigetti Aspen-M', type: 'Superconducting - 80 Qubits', icon: Cpu, color: 'blue', status: 'Offline', completed: 0, offline: true },
              ].map((device) => (
                <div key={device.name} className={cn('glass-effect rounded-xl p-5', device.offline && 'opacity-60')}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mr-3', `bg-${device.color}-600/20`)}>
                        <device.icon className={cn('w-5 h-5', `text-${device.color}-400`)} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{device.name}</h4>
                        <span className="text-xs text-gray-400">{device.type}</span>
                      </div>
                    </div>
                    <span className={cn(
                      'px-3 py-1 rounded-full text-sm',
                      device.status === 'Online' && 'bg-green-500/20 text-green-400',
                      device.status === 'Queued' && 'bg-yellow-500/20 text-yellow-400',
                      device.status === 'Offline' && 'bg-gray-500/20 text-gray-400'
                    )}>
                      {device.status}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400 space-x-6">
                    <span><CheckCircle className="w-3 h-3 text-green-400 inline mr-1" />{device.completed} completed</span>
                    {device.active && <span><RefreshCw className="w-3 h-3 text-yellow-400 inline mr-1" />{device.active} active</span>}
                    {device.queued && <span><Clock className="w-3 h-3 text-yellow-400 inline mr-1" />{device.queued} queued</span>}
                    {device.offline && <span><Trash2 className="w-3 h-3 text-gray-400 inline mr-1" />Maintenance</span>}
                    {device.avgTime && <span><Clock className="w-3 h-3 inline mr-1" />{device.avgTime} avg</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Tab */}
      {activeTab === 'admin' && (
        <div className="animate-fade-in-up">
          {/* Invite Codes Management */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Key className="w-5 h-5 text-[#14b8a6] mr-2" />
              Invite Codes Management
            </h3>

            {/* Create New Code */}
            <div className="glass-effect rounded-xl p-6 mb-4">
              <h4 className="font-semibold mb-4">Create New Invite Code</h4>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Code (optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generate"
                    value={newCodeInput}
                    onChange={(e) => setNewCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0f1a]/50 border border-gray-700 text-white placeholder-gray-500 focus:border-[#14b8a6] focus:outline-none transition-colors uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Max Uses</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={newCodeMaxUses}
                    onChange={(e) => setNewCodeMaxUses(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0f1a]/50 border border-gray-700 text-white focus:border-[#14b8a6] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Expires In (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newCodeExpiresIn}
                    onChange={(e) => setNewCodeExpiresIn(parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0f1a]/50 border border-gray-700 text-white focus:border-[#14b8a6] focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCreateCode}
                    disabled={isCreatingCode}
                    className="w-full py-2 rounded-lg bg-[#14b8a6]/20 text-[#14b8a6] hover:bg-[#14b8a6]/30 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {isCreatingCode ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Codes */}
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Existing Codes</h4>
                <button
                  onClick={loadInviteCodes}
                  disabled={isLoadingCodes}
                  className="px-3 py-1 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-all disabled:opacity-50 text-sm flex items-center"
                >
                  <RefreshCw className={cn('w-3 h-3 mr-1', isLoadingCodes && 'animate-spin')} />
                  Refresh
                </button>
              </div>

              {isLoadingCodes ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-[#14b8a6] animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Loading codes...</p>
                </div>
              ) : inviteCodes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No invite codes yet. Create one above.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {inviteCodes.map((code) => {
                    const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
                    const isExhausted = code.usedCount >= code.maxUses;
                    const isValid = code.isActive && !isExpired && !isExhausted;

                    return (
                      <div
                        key={code.code}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-lg border',
                          isValid ? 'border-gray-700 bg-gray-800/30' : 'border-gray-800 bg-gray-900/30 opacity-60'
                        )}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="font-mono text-lg font-semibold text-[#14b8a6]">
                            {code.code}
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs',
                              isValid ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                            )}>
                              {isExpired ? 'Expired' : isExhausted ? 'Exhausted' : code.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-400">
                          <span>
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            {code.usedCount}/{code.maxUses} uses
                          </span>
                          {code.expiresAt && (
                            <span>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(code.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setCodeToDelete(code.code);
                              setShowDeleteCodeModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Management Actions */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Cog className="w-5 h-5 text-[#14b8a6] mr-2" />
              Management Actions
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="glass-effect rounded-xl p-6">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center mb-4">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h4 className="font-semibold mb-2">Clear All Data</h4>
                <p className="text-sm text-gray-400 mb-4">Remove all signatures and quantum jobs from the system.</p>
                <button
                  onClick={() => setShowClearModal(true)}
                  disabled={isClearing}
                  className="w-full py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50"
                >
                  {isClearing ? (
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 inline mr-2" />
                  )}
                  Clear All
                </button>
              </div>
              <div className="glass-effect rounded-xl p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center mb-4">
                  <RefreshCw className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="font-semibold mb-2">Refresh Statistics</h4>
                <p className="text-sm text-gray-400 mb-4">Reload the latest statistics and signature count.</p>
                <button
                  onClick={handleRefreshStats}
                  disabled={isRefreshing}
                  className="w-full py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={cn('w-4 h-4 inline mr-2', isRefreshing && 'animate-spin')} />
                  Refresh
                </button>
              </div>
              <div className="glass-effect rounded-xl p-6">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center mb-4">
                  <Download className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="font-semibold mb-2">Export Data</h4>
                <p className="text-sm text-gray-400 mb-4">Download all signatures and responses as JSON.</p>
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all disabled:opacity-50"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 inline mr-2" />
                  )}
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearData}
        title="Clear All Data?"
        message="This will permanently delete all signatures and quantum jobs. This action cannot be undone."
        confirmText="Clear All"
      />

      <ConfirmModal
        isOpen={showDeleteCodeModal}
        onClose={() => {
          setShowDeleteCodeModal(false);
          setCodeToDelete(null);
        }}
        onConfirm={handleDeleteCode}
        title="Delete Invite Code?"
        message={`Are you sure you want to delete the invite code "${codeToDelete}"? This action cannot be undone.`}
        confirmText={isDeletingCode ? "Deleting..." : "Delete"}
      />
    </div>
  );
}
