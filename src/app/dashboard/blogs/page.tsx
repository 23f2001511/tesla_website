'use client';

import { Edit2, Eye, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardBlogs() {
  
  const [myBlogs, setMyBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const [showCreateModal, setShowCreateModal] = useState(false);


  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [saving, setSaving] = useState(false);


  const [blogData, setBlogData] = useState({
    title: '',
    category: '',
    tags: '',
    content: '',
    coverImage: ''
  });

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/blogs/my');
      const data = await res.json();

      if (data.success) {
        setMyBlogs(data.blogs);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  //Create new blogs

  const handleCreateBlog = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...blogData,
          tags: blogData.tags
            .split(',')
            .map(tag => tag.trim())
        })
      });

      const data = await res.json();
      console.log(data);

      // temporary 
      console.log('STATUS:', res.status);
      console.log('DATA:', data);



      if (!data.success) {
        alert(data.message);
        setSaving(false);
        return;
      }

      setShowCreateModal(false);

      setBlogData({
        title: '',
        category: '',
        tags: '',
        content: '',
        coverImage: ''
      });

      await fetchBlogs();
      setSaving(false);

    } catch (error) {
      console.error(error);
      setSaving(false);
    }
  };

  // update/Edit blogs

  const handleEditBlog = async () => {
    try {
      setSaving(true);
      const res = await fetch(
        `/api/blogs/${editingBlog._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...blogData,
            tags: blogData.tags
              .split(',')
              .map(tag => tag.trim())
          })
        }
      );

      const data = await res.json();

      //temporary 
      console.log('EDIT STATUS:', res.status);
      console.log('EDIT DATA:', data);


      if (!data.success) {
        alert('Update Failed');
        setSaving(false);
        return;
      }

      setEditingBlog(null);

      setShowCreateModal(false);

      await fetchBlogs();

      setSaving(false);



    } catch (error) {
      console.error(error);
      setSaving(false);
    }
  };

  //Delete any blogs

  const handleDelete = async (id: string) => {
    const ok = confirm(
      'Delete this blog?'
    );

    if (!ok) return;

    const res = await fetch(
      `/api/blogs/${id}`,
      {
        method: 'DELETE'
      }
    );

    const data = await res.json();

    if (data.success) {
      setMyBlogs(
        myBlogs.filter(
          blog => blog._id !== id
        )
      );
    }
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Blogs</h1>
          <p className="text-gray-400">Write, edit, and track the analytics of your published articles.</p>
        </div>
        
       <button
          onClick={() => {

            setEditingBlog(null);

            setBlogData({
              title: '',
              category: '',
              tags: '',
              content: '',
              coverImage: ''
            });

            setShowCreateModal(true);
          }}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Write New Blog
        </button>
          
      </div>

      <div className="glass rounded-2xl border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="p-4 text-sm font-semibold text-gray-400">Title</th>
                <th className="p-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-400 text-right">Analytics</th>
                <th className="p-4 text-sm font-semibold text-gray-400 text-right">Last Updated</th>
                <th className="p-4 text-sm font-semibold text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myBlogs.map((blog) => (
                <tr key={blog.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs block">{blog.title}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      blog.status === 'Published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      blog.status === 'Pending' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      blog.status === 'Rejected' ?'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-gray-300 font-medium">{blog.views} Views</span>
                      <span className="text-xs text-gray-500">{blog.likes} Likes</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-400 text-right">{blog.date}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-lg" title="View"><Eye className="w-4 h-4" /></button>


                      <button
                        onClick={() => {
                          setEditingBlog(blog);

                          setBlogData({
                            title: blog.title || '',
                            category: blog.category || '',
                            tags: blog.tags?.join(', ') || '',
                            content: blog.content || '',
                            coverImage: blog.coverImage || ''
                          });

                          setShowCreateModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-primary transition-colors bg-white/5 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button 
                      onClick={() =>
                        handleDelete(blog._id)
                      }
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors bg-white/5 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {myBlogs.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              You haven't written any blogs yet. Share your knowledge!
            </div>
          )}
        </div>
      </div>



      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="w-full max-w-3xl bg-[#111827] rounded-2xl p-6 border border-white/10">

            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingBlog ? 'Edit Blog' : 'Create Blog'}
              </h2>

              <button
                onClick={() => {
                  setShowCreateModal(false);

                  setEditingBlog(null);

                  setBlogData({
                    title: '',
                    category: '',
                    tags: '',
                    content: '',
                    coverImage: ''
                  });
                }}
                className="text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">

              <input
                placeholder="Blog Title"
                value={blogData.title}
                onChange={(e) =>
                  setBlogData({
                    ...blogData,
                    title: e.target.value
                  })
                }
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
              />

              <input
                placeholder="Category"
                value={blogData.category}
                onChange={(e) =>
                  setBlogData({
                    ...blogData,
                    category: e.target.value
                  })
                }
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
              />

              <input
                placeholder="Tags (comma separated)"
                value={blogData.tags}
                onChange={(e) =>
                  setBlogData({
                    ...blogData,
                    tags: e.target.value
                  })
                }
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
              />

              <input
                placeholder="Cover Image URL"
                value={blogData.coverImage}
                onChange={(e) =>
                  setBlogData({
                    ...blogData,
                    coverImage: e.target.value
                  })
                }
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
              />

              <textarea
                placeholder="Blog Content"
                value={blogData.content}
                onChange={(e) =>
                  setBlogData({
                    ...blogData,
                    content: e.target.value
                  })
                }
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white min-h-[200px]"
              />

              <button
                disabled={saving}
                onClick={
                  editingBlog
                    ? handleEditBlog
                    : handleCreateBlog
                }
                className="w-full bg-primary py-3 rounded-lg text-white disabled:opacity-50"
              >
                {saving
                  ? editingBlog
                    ? 'Updating Blog...'
                    : 'Publishing Blog...'
                  : editingBlog
                    ? 'Save Changes'
                    : 'Publish Blog'}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
