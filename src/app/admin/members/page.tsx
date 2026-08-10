'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, MoreVertical, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function AdminMembers() {
  const [search, setSearch] = useState('');

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);




  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'TeamMember',
    team: '',
  });





  useEffect(() => {
  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/admin/members');
      const data = await res.json();

      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  fetchMembers();
  }, []);



  const handleCreateMember = async () => {
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Failed to create member');
        return;
      }

      alert('Member Created Successfully');

      setShowModal(false);

      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'TeamMember',
        team: '',
      });

      const membersRes = await fetch('/api/admin/members');
      const membersData = await membersRes.json();

      if (membersData.success) {
        setMembers(membersData.members);
      }

    } catch (error) {
      console.error(error);
      alert('Something went wrong');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Member Management</h1>
          <p className="text-gray-400">View, manage roles, and activate/deactivate members.</p>
        </div>
        

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
          Add New Member
        </button>
      </div>

      <div className="glass rounded-2xl border-white/5 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input 
              type="text" 
              placeholder="Search members..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="p-4 text-sm font-semibold text-gray-400">Name</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Role</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Joined</th>
                <th className="p-4 text-sm font-semibold text-gray-400 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  Loading Members...
                </td>
              </tr>
              )}

              {members.map((member) => (
                <tr key={member._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{member.name}</span>
                      <span className="text-xs text-gray-500">{member.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300 border border-white/10">
                      {member.designation || member.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {member.status === 'active' && <CheckCircle className="w-4 h-4 text-green-400" />}
                      {member.status === 'inactive' && <XCircle className="w-4 h-4 text-red-400" />}
                      {member.status === 'pending' && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                      <span className={`text-sm ${
                        member.status === 'active' ? 'text-green-400' :
                        member.status === 'inactive' ? 'text-red-400' : 'text-orange-400'
                      }`}>
                        {member.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-400">{new Date(member.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-primary transition-colors bg-white/5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button className="p-2 text-gray-400 hover:text-red-400 transition-colors bg-white/5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-gray-400">
          <span> Showing {members.length} member(s)</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white/5 rounded hover:bg-white/10 transition-colors disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 bg-white/5 rounded hover:bg-white/10 transition-colors">Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md glass rounded-2xl p-6 border border-white/10">
      
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Add New Member
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">

              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white"
              />

              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white"
              />

              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white"
              />

              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="PI">PI</option>
                <option value="President">President</option>
                <option value="OfficeBearer">OfficeBearer</option>
                <option value="TeamLeader">TeamLeader</option>
                <option value="TeamMember">TeamMember</option>
                <option value="Alumni">Alumni</option>
              </select>

              <input
                type="text"
                placeholder="Team"
                value={formData.team}
                onChange={(e) =>
                  setFormData({ ...formData, team: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white"
              />

              <button
                onClick={handleCreateMember}
                className="w-full py-3 bg-primary text-white rounded-lg font-semibold"
              >
                Create Member
              </button>

            </div>
          </div>
        </div>
      )}


    </div>

  

  );
}
