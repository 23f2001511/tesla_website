'use client';

import { useEffect, useState } from 'react';
import { Camera, Edit2 } from 'lucide-react';

export default function DashboardProfile() {

  const [user, setUser] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  

  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    branch: '',
    year: '',
    bio: '',
    portfolio:'',
    skills: [] as string[],
    linkedin: '',
    github: '',
    instagram: ''
  });

  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user/me');
        const data = await res.json();

        if (data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        rollNo: user.rollNo || '',
        branch: user.branch || '',
        year: user.year || '',
        bio: user.bio || '',
        portfolio: user.portfolio || '',
        skills: user.skills || [],
        linkedin: user.socialLinks?.linkedin || '',
        github: user.socialLinks?.github || '',
        instagram: user.socialLinks?.instagram || ''
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Update failed');
        return;
      }

      setUser(data.user);

      setEditOpen(false);

      alert('Profile Updated Successfully');
    } catch (error) {
      console.error(error);
      alert('Something went wrong');
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-gray-400">Manage your personal information and social links.</p>
      </div>

      <div className="glass rounded-2xl border-white/5 p-8 flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-32 h-32 rounded-full border-4 border-white/10 overflow-hidden group">
            <img src="https://i.pravatar.cc/150?u=current_user" alt="Avatar" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <button className="text-xs text-primary font-medium hover:underline">Remove Photo</button>
        </div>

        {/* Form */}
        <div className="flex-1 w-full space-y-6">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white">Basic Info</h2>
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Full Name</label>
              <div className="text-white font-medium bg-white/5 px-4 py-2.5 rounded-lg border border-white/10">{ user?.name || 'Not Set' }</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Email</label>
              <div className="text-white font-medium bg-white/5 px-4 py-2.5 rounded-lg border border-white/10">{user?.email || 'Not Set'}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Roll Number</label>
              <div className="text-white font-medium bg-white/5 px-4 py-2.5 rounded-lg border border-white/10">{user?.rollNo || 'Not Set'} </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Branch / Year</label>
              <div className="text-white font-medium bg-white/5 px-4 py-2.5 rounded-lg border border-white/10">{user?.branch || 'Not Set'} / {user?.year || 'Not Set'} </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Bio</label>
              <div className="text-white font-medium bg-white/5 px-4 py-2.5 rounded-lg border border-white/10 min-h-[100px]">
                
              {user?.bio || 'No bio added yet'}

              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Skills / Tags</label>
              <div className="flex flex-wrap gap-2">
                
              {user?.skills?.length > 0
                ? user.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold"
                    >
                      {skill}
                    </span>
                  ))
                : <span className="text-gray-400">No skills added</span>}

              </div>
            </div>
          </div>


          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
              Portfolio
            </label>

            <div className="text-white font-medium bg-white/5 px-4 py-2.5 rounded-lg border border-white/10 truncate">

              {user?.portfolio ? (
                <a
                  href={user.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {user.portfolio}
                </a>
              ) : (
                <span className="text-gray-400">Link Not Added</span>
              )}

            </div>
          </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">LinkedIn</label>
              <div className="text-white font-medium bg-white/5 px-4 py-2.5 rounded-lg border border-white/10 truncate">
              
              {user?.socialLinks?.linkedin ? (
                <a
                  href={user.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {user.socialLinks.linkedin}
                </a>
              ) : (
                <span className="text-gray-400">Not Added</span>
              )}

              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">GitHub</label>
              <div className="text-white font-medium bg-white/5 px-4 py-2.5 rounded-lg border border-white/10 truncate">
              {user?.socialLinks?.github ? (
                <a
                  href={user.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {user.socialLinks.github}
                </a>
              ) : (
                <span className="text-gray-400">Not Added</span>
              )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Instagram</label>
              <div className="text-white font-medium bg-white/5 px-4 py-2.5 rounded-lg border border-white/10 truncate">
              {user?.socialLinks?.instagram ? (
                <a
                  href={user.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {user.socialLinks.instagram}
                </a>
              ) : (
                <span className="text-gray-400">Not Added</span>
              )}
              </div>
            </div>
          </div>
        </div>
      
      
      {editOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl bg-[#111827] rounded-2xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Edit Profile
              </h2>

              <button
                onClick={() => setEditOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* YAHAN TUMHARA FORM AAYEGA */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Full Name"
                className="bg-white/5 border border-white/10 rounded-lg p-3 text-white"
              />

              <input
                value={formData.rollNo}
                onChange={(e) =>
                  setFormData({ ...formData, rollNo: e.target.value })
                }
                placeholder="Roll Number"
                className="bg-white/5 border border-white/10 rounded-lg p-3 text-white"
              />

              <input
                value={formData.branch}
                onChange={(e) =>
                  setFormData({ ...formData, branch: e.target.value })
                }
                placeholder="Branch"
                className="bg-white/5 border border-white/10 rounded-lg p-3 text-white"
              />

              <input
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                placeholder="Year"
                className="bg-white/5 border border-white/10 rounded-lg p-3 text-white"
              />

              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Bio"
                className="w-full md:col-span-2 bg-white/5 border border-white/10 rounded-lg p-3 text-white min-h-[120px]"
              />



              <input
                value={formData.portfolio}
                onChange={(e) =>
                  setFormData({ ...formData, portfolio: e.target.value })
                }
                placeholder="Portfolio URL"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
              />

              <div className="space-y-3">

                <label className="text-sm text-gray-300">
                  Skills
                </label>

                <div className="flex flex-wrap gap-2">

                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm flex items-center gap-2"
                    >
                      {skill}

                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            skills: formData.skills.filter(
                              (_, i) => i !== index
                            )
                          });
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}

                </div>

                <input
                  value={skillInput}
                  onChange={(e) =>
                    setSkillInput(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      skillInput.trim()
                    ) {
                      e.preventDefault();

                      if (
                        !formData.skills.includes(
                          skillInput.trim()
                        )
                      ) {
                        setFormData({
                          ...formData,
                          skills: [
                            ...formData.skills,
                            skillInput.trim()
                          ]
                        });
                      }

                      setSkillInput('');
                    }
                  }}
                  placeholder="Type skill and press Enter"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
                />

              </div>

              <input
                value={formData.linkedin}
                onChange={(e) =>
                  setFormData({ ...formData, linkedin: e.target.value })
                }
                placeholder="LinkedIn URL"
                className="bg-white/5 border border-white/10 rounded-lg p-3 text-white"
              />

              <input
                value={formData.github}
                onChange={(e) =>
                  setFormData({ ...formData, github: e.target.value })
                }
                placeholder="GitHub URL"
                className="bg-white/5 border border-white/10 rounded-lg p-3 text-white"
              />

              <input
                value={formData.instagram}
                onChange={(e) =>
                  setFormData({ ...formData, instagram: e.target.value })
                }
                placeholder="Instagram URL"
                className="bg-white/5 border border-white/10 rounded-lg p-3 text-white"
              />

              <div className="flex justify-end gap-3 mt-6">

                <button
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 bg-gray-700 rounded-lg text-white"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-primary rounded-lg text-white"
                >
                  Save Changes
                </button>

              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
