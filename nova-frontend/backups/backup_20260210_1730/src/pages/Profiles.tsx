import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NovaLogo from '../components/NovaLogo';
import { useAuth } from '../context/AuthContext';

export default function Profiles() {
    const navigate = useNavigate();
    const { selectProfile, profiles, addProfile, deleteProfile, loading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');
    const [isKidProfile, setIsKidProfile] = useState(false);

    const handleProfileClick = (profile: any) => {
        if (isEditing) {
            return; // Don't login when editing
        }
        selectProfile(profile);
        navigate('/');
    };

    const handleAddProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProfileName.trim()) return;

        const success = await addProfile(newProfileName, isKidProfile);
        if (success) {
            setShowAddModal(false);
            setNewProfileName('');
            setIsKidProfile(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this profile?')) {
            await deleteProfile(id);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center animate-fade-in relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="z-10 flex flex-col items-center w-full max-w-4xl px-4">
                <div className="mb-12 flex flex-col items-center">
                    <NovaLogo className="w-16 h-16 mb-6" />
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">Who's Watching?</h1>
                </div>

                <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-16">
                    {profiles.map((profile) => (
                        <div
                            key={profile.id}
                            onClick={() => handleProfileClick(profile)}
                            className="group flex flex-col items-center gap-4 cursor-pointer relative"
                        >
                            <div className={`relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden transition-all duration-300 ${!isEditing ? 'group-hover:scale-110 group-hover:ring-4 ring-white/20 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'opacity-80'}`}>
                                <img
                                    src={profile.avatar}
                                    alt={profile.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <i className="ri-pencil-fill text-white text-3xl"></i>
                                    </div>
                                )}
                            </div>
                            <span className="text-gray-400 font-medium text-lg group-hover:text-white transition-colors">
                                {profile.name}
                            </span>

                            {/* Delete Button (Only in Edit Mode) */}
                            {isEditing && profiles.length > 1 && (
                                <button
                                    onClick={(e) => handleDelete(e, profile.id)}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform z-20"
                                >
                                    <i className="ri-close-line"></i>
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Add Profile Button */}
                    {!isEditing && profiles.length < 5 && (
                        <div
                            onClick={() => setShowAddModal(true)}
                            className="group flex flex-col items-center gap-4 cursor-pointer"
                        >
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-transparent border-2 border-white/20 hover:border-white hover:bg-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                                <i className="ri-add-line text-5xl text-gray-400 group-hover:text-white transition-colors"></i>
                            </div>
                            <span className="text-gray-400 font-medium text-lg group-hover:text-white transition-colors">
                                Add Profile
                            </span>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-8 py-2.5 border font-semibold tracking-wide uppercase transition-all hover:bg-white/5 ${isEditing ? 'bg-white text-black border-white hover:bg-gray-200' : 'border-gray-500 text-gray-400 hover:text-white hover:border-white'}`}
                >
                    {isEditing ? 'Done' : 'Manage Profiles'}
                </button>
            </div>

            {/* Add Profile Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#18181b] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl scale-100 animate-scale-up">
                        <h2 className="text-2xl font-bold text-white mb-2">Add Profile</h2>
                        <p className="text-gray-400 mb-6">Add a profile for another person watching Nova.</p>

                        <form onSubmit={handleAddProfile}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden">
                                    <img src={`https://ui-avatars.com/api/?name=${newProfileName || 'New'}&background=random`} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={newProfileName}
                                    onChange={(e) => setNewProfileName(e.target.value)}
                                    className="flex-1 bg-[#27272a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                                    autoFocus
                                />
                            </div>

                            <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => setIsKidProfile(!isKidProfile)}>
                                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isKidProfile ? 'bg-violet-600 border-violet-600' : 'border-gray-500'}`}>
                                    {isKidProfile && <i className="ri-check-line text-white"></i>}
                                </div>
                                <span className="text-white select-none">Kid's Profile?</span>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-600 text-white font-medium rounded-lg hover:border-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newProfileName.trim()}
                                    className="flex-1 px-4 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
