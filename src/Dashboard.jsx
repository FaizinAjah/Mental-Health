import React, { useState, useEffect, useRef } from 'react';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import feather from 'feather-icons';

// --- DATA 6 PERTANYAAN KUESIONER (Sesuai Model ML) ---
const KUESIONER_QUESTIONS = [
    { id: 'mood', text: "1. Bagaimana suasana hatimu secara keseluruhan minggu ini?", min: "Sangat Buruk", max: "Sangat Baik" },
    { id: 'tidur', text: "2. Bagaimana kualitas tidurmu belakangan ini?", min: "Sangat Buruk", max: "Sangat Baik" },
    { id: 'aktivitas', text: "3. Seberapa aktif kamu bergerak atau berolahraga?", min: "Sangat Pasif", max: "Sangat Aktif" },
    { id: 'energi', text: "4. Seberapa besar energimu untuk menjalani hari?", min: "Sangat Lelah", max: "Sangat Bertenaga" },
    { id: 'stres', text: "5. Seberapa tinggi tingkat stres yang kamu rasakan?", min: "Sangat Tenang", max: "Sangat Tertekan" },
    { id: 'sosial', text: "6. Seberapa baik interaksi sosialmu dengan orang lain?", min: "Menarik Diri", max: "Sangat Aktif Sosial" }
];

export default function Dashboard({ user }) {
    // --- STATE MANAGEMENT ---
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // State Chat
    const [chatHistory, setChatHistory] = useState([
        { id: 1, title: "Stres skripsi bab 4 yang tak kunjung di-acc", mood: "DISTRESSED", date: "25/05/2026", messages: [{ sender: 'user', text: "Stres skripsi bab 4 yang tak kunjung di-acc" }, { sender: 'ai', text: "Saya mengerti ini sangat berat. Mari kita urai satu per satu." }] },
        { id: 2, title: "Gelisah menunggu email hasil interview beasiswa", mood: "LOW", date: "24/05/2026", messages: [{ sender: 'user', text: "Gelisah menunggu email hasil interview" }] },
        { id: 3, title: "Sangat lega akhirnya presentasi berjalan sukses", mood: "GREAT", date: "23/05/2026", messages: [{ sender: 'user', text: "Sangat lega akhirnya presentasi sukses!" }] },
    ]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    // State Kuesioner
    const [age, setAge] = useState('');
    const [kuesionerAnswers, setKuesionerAnswers] = useState({
        mood: null, tidur: null, aktivitas: null, energi: null, stres: null, sosial: null
    });
    const [kuesionerResult, setKuesionerResult] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // --- EFEK & LIFECYCLE ---
    useEffect(() => {
        feather.replace();
    }, [activeTab, chatHistory, showModal, kuesionerAnswers]);

    useEffect(() => {
        if (activeTab === 'chatbot' || activeTab === 'newchat') {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatHistory, isTyping, activeTab]);

    // --- FUNGSI LOGIKA APP ---
    const handleSignOut = () => signOut(auth);

    const getDominantMood = () => {
        if (kuesionerResult) return kuesionerResult.mood;
        if (chatHistory.length === 0) return "-";
        const moods = chatHistory.map(c => c.mood);
        return moods.sort((a,b) => moods.filter(v => v===a).length - moods.filter(v => v===b).length).pop();
    };

    // Fungsi Submit Kuesioner (Diintegrasikan dengan Model ML)
    const submitKuesioner = async (e) => {
        e.preventDefault();
        
        const { mood, tidur, aktivitas, energi, stres, sosial } = kuesionerAnswers;
        
        if (!mood || !tidur || !aktivitas || !energi || !stres || !sosial || !age) {
            alert("Mohon isi umur dan jawab semua 6 pertanyaan kuesioner.");
            return;
        }

        /* 
        ========================================================================
        🔥 INTEGRASI API FASTAPI (Uncomment kode di bawah ini jika API sudah siap)
        ========================================================================
        try {
            const response = await fetch("http://localhost:8000/predict_mood", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mood, tidur, aktivitas, energi, stres, sosial })
            });
            const data = await response.json();
            const detectedMood = data.predicted_mood.toUpperCase();
        } catch (error) {
            console.error("Gagal terhubung ke API Model:", error);
        }
        ========================================================================
        */

        // 🧠 MOCKUP LOGIKA MODEL SEMENTARA (Sama persis dengan assign_label di Python temanmu)
        let skor = mood + tidur + aktivitas + energi + (6 - stres) + sosial;
        let detectedMood = "NEUTRAL";
        
        if (stres >= 5 && mood <= 1) {
            detectedMood = "DISTRESSED";
        } else if (mood >= 4 && energi >= 4 && stres <= 2) {
            detectedMood = "GREAT";
        } else if (skor <= 11) {
            detectedMood = "DISTRESSED";
        } else if (skor <= 15) {
            detectedMood = "LOW";
        } else if (skor <= 20) {
            detectedMood = "NEUTRAL";
        } else if (skor <= 25) {
            detectedMood = "GOOD";
        } else {
            detectedMood = "GREAT";
        }

        // Tentukan saran berdasarkan usia dan mood
        let advice = "Kondisi mentalmu terlihat stabil. Pertahankan rutinitas baikmu dan jangan lupa istirahat yang cukup.";
        if (detectedMood === "DISTRESSED" || detectedMood === "LOW") {
            advice = `Di usiamu yang menginjak ${age} tahun, tekanan memang terkadang sangat membebani. Model AI kami mendeteksi tingkat stres/kecemasan yang cukup signifikan. Cobalah mengambil jeda sejenak, lakukan teknik pernapasan 4-7-8, atau curhatkan bebanmu di menu Chat.`;
        } else if (detectedMood === "GREAT" || detectedMood === "GOOD") {
            advice = "Luar biasa! Energi dan interaksi sosialmu sangat positif minggu ini. Bagikan kebahagiaan ini dengan orang-orang terdekatmu.";
        }

        setKuesionerResult({ mood: detectedMood, advice });
        setShowModal(true);
    };

    // Fungsi Chatbot AI Mockup
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMsg = inputText;
        setInputText('');
        
        // Deteksi mood sederhana dari teks
        let msgMood = "NEUTRAL";
        const lowerMsg = userMsg.toLowerCase();
        if (lowerMsg.includes('stres') || lowerMsg.includes('capek') || lowerMsg.includes('pusing')) msgMood = "DISTRESSED";
        if (lowerMsg.includes('takut') || lowerMsg.includes('cemas') || lowerMsg.includes('gelisah')) msgMood = "LOW";
        if (lowerMsg.includes('senang') || lowerMsg.includes('lega') || lowerMsg.includes('bahagia')) msgMood = "GREAT";

        let chatIdToUpdate = currentChatId;

        // Buat chat baru jika sedang di menu 'newchat'
        if (activeTab === 'newchat' || !currentChatId) {
            const newChat = {
                id: Date.now(),
                title: userMsg.substring(0, 40) + "...",
                mood: msgMood,
                date: new Date().toLocaleDateString('id-ID'),
                messages: [{ sender: 'user', text: userMsg }]
            };
            setChatHistory([newChat, ...chatHistory]);
            chatIdToUpdate = newChat.id;
            setCurrentChatId(newChat.id);
            setActiveTab('chatbot');
        } else {
            setChatHistory(chatHistory.map(chat => {
                if (chat.id === currentChatId) {
                    return { ...chat, mood: msgMood, messages: [...chat.messages, { sender: 'user', text: userMsg }] };
                }
                return chat;
            }));
        }

        // Simulasi balasan AI
        setIsTyping(true);
        setTimeout(() => {
            let aiReply = "Aku di sini untuk mendengarkan. Bisa ceritakan lebih detail apa yang membuatmu merasa begitu?";
            if (msgMood === "DISTRESSED") aiReply = "Tarik napas dalam-dalam. Wajar merasa stres saat banyak tekanan. Apa hal spesifik yang paling membebanimu saat ini?";
            if (msgMood === "LOW") aiReply = "Kecemasan itu valid, tapi ingat bahwa ketakutan kita seringkali lebih besar dari kenyataannya. Mau coba bahas skenario tersebut bersamaku?";
            
            setChatHistory(prev => prev.map(chat => {
                if (chat.id === chatIdToUpdate) {
                    return { ...chat, messages: [...chat.messages, { sender: 'ai', text: aiReply }] };
                }
                return chat;
            }));
            setIsTyping(false);
        }, 1500);
    };

    const openChat = (id) => {
        setCurrentChatId(id);
        setActiveTab('chatbot');
        setIsSidebarOpen(false);
    };

    const handleAnswerChange = (key, value) => {
        setKuesionerAnswers(prev => ({ ...prev, [key]: value }));
    };

    // --- HELPER WARNA MOOD (Sesuai Visualisasi Model) ---
    const getMoodColor = (mood) => {
        switch(mood?.toUpperCase()) {
            case 'DISTRESSED': return 'text-[#d62728] border-[#d62728]/30 bg-[#d62728]/10'; // Merah
            case 'LOW': return 'text-[#ff7f0e] border-[#ff7f0e]/30 bg-[#ff7f0e]/10'; // Orange
            case 'NEUTRAL': return 'text-[#bcbd22] border-[#bcbd22]/30 bg-[#bcbd22]/10'; // Kuning/Olive
            case 'GOOD': return 'text-[#2ca02c] border-[#2ca02c]/30 bg-[#2ca02c]/10'; // Hijau
            case 'GREAT': return 'text-[#1f77b4] border-[#1f77b4]/30 bg-[#1f77b4]/10'; // Biru
            default: return 'text-[#C4C7C5] border-[#C4C7C5]/30 bg-white/5';
        }
    };

    const username = user?.email?.split('@')[0] || 'Pengguna';

    return (
        <div className="bg-[#131314] text-[#E3E3E3] font-sans flex h-[100dvh] overflow-hidden antialiased">
            {/* --- MODAL HASIL KUESIONER --- */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-[#1E1F20] w-[90%] max-w-md p-8 rounded-[28px] border border-white/10 shadow-2xl z-10 flex flex-col items-center text-center">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 border-4 shadow-lg ${getMoodColor(kuesionerResult.mood)}`}>
                            <i data-feather={kuesionerResult.mood === 'DISTRESSED' || kuesionerResult.mood === 'LOW' ? 'activity' : 'smile'} className="w-10 h-10"></i>
                        </div>
                        <h3 className="text-xl font-semibold mb-1">Hasil Analisa AI</h3>
                        <p className="text-[#C4C7C5] text-sm mb-4">Klasifikasi Mood: <strong className={getMoodColor(kuesionerResult.mood).split(' ')[0]}>{kuesionerResult.mood}</strong></p>
                        <p className="text-sm leading-relaxed mb-6 bg-[#282A2C] p-4 rounded-2xl border border-white/5 text-left">{kuesionerResult.advice}</p>
                        <button onClick={() => {setShowModal(false); setActiveTab('dashboard');}} className="w-full py-3.5 bg-[#004A77] text-[#A8C7FA] font-bold rounded-xl hover:brightness-125 transition-all">
                            Lihat Dashboard Analitik
                        </button>
                    </div>
                </div>
            )}

            {/* --- SIDEBAR --- */}
            <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[280px] bg-[#131314] flex flex-col transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 border-r border-white/5`}>
                <div className="h-16 flex items-center px-4 shrink-0">
                    <i data-feather="box" className="w-6 h-6 text-[#A8C7FA] mr-3"></i>
                    <span className="text-xl font-semibold text-white tracking-wide">MindSpace AI</span>
                </div>

                <div className="px-3 mt-4 space-y-1.5 shrink-0">
                    <button onClick={() => { setActiveTab('home'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl ${activeTab === 'home' ? 'bg-[#004A77] text-[#A8C7FA] font-medium' : 'text-[#C4C7C5] hover:bg-[#282A2C] hover:text-white transition-colors'}`}>
                        <i data-feather="home" className="w-5 h-5"></i> <span className="text-sm">Beranda</span>
                    </button>
                    <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl ${activeTab === 'dashboard' ? 'bg-[#004A77] text-[#A8C7FA] font-medium' : 'text-[#C4C7C5] hover:bg-[#282A2C] hover:text-white transition-colors'}`}>
                        <i data-feather="pie-chart" className="w-5 h-5"></i> <span className="text-sm">Dashboard Analitik</span>
                    </button>
                    <button onClick={() => { setActiveTab('kuesioner'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl ${activeTab === 'kuesioner' ? 'bg-[#004A77] text-[#A8C7FA] font-medium' : 'text-[#C4C7C5] hover:bg-[#282A2C] hover:text-white transition-colors'}`}>
                        <i data-feather="edit-3" className="w-5 h-5"></i> <span className="text-sm">Kuesioner Harian</span>
                    </button>
                    <button onClick={() => { setActiveTab('newchat'); setCurrentChatId(null); setIsSidebarOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3 mt-2 rounded-xl border border-[#A8C7FA]/30 text-[#A8C7FA] hover:bg-[#A8C7FA]/10 transition-colors">
                        <i data-feather="plus" className="w-5 h-5"></i> <span className="text-sm font-medium">New chat</span>
                    </button>
                </div>

                {/* Riwayat Chat Sidebar */}
                <div className="flex-1 overflow-y-auto mt-6 px-3 pb-4">
                    <h3 className="px-4 text-[11px] font-bold text-[#C4C7C5] mb-3 uppercase tracking-widest opacity-60">Chats</h3>
                    <div className="space-y-1">
                        {chatHistory.map(chat => (
                            <button key={chat.id} onClick={() => openChat(chat.id)} className={`w-full text-left truncate px-4 py-2.5 rounded-xl text-[13px] transition-colors ${currentChatId === chat.id ? 'bg-[#282A2C] text-[#A8C7FA]' : 'text-[#C4C7C5] hover:bg-[#282A2C] hover:text-white'}`}>
                                {chat.title}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-bold text-xs uppercase">{username.charAt(0)}</div>
                        <span className="text-sm font-medium text-white truncate w-24">{username}</span>
                    </div>
                    <button onClick={handleSignOut} title="Keluar" className="p-2 text-[#C4C7C5] hover:text-red-400 transition-colors"><i data-feather="log-out" className="w-4 h-4"></i></button>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 flex flex-col h-full relative min-w-0 bg-[#131314]">
                {/* Header Mobile Only */}
                <header className="h-16 flex items-center justify-between px-4 shrink-0 md:hidden border-b border-white/5">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white"><i data-feather="menu"></i></button>
                    <span className="text-lg font-medium">MindSpace AI</span>
                    <div className="w-8 h-8 rounded-full bg-[#14B8A6] flex items-center justify-center font-bold text-xs uppercase">{username.charAt(0)}</div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scroll p-4 lg:p-8">
                    
                    {/* --- VIEW: BERANDA --- */}
                    {activeTab === 'home' && (
                        <div className="max-w-5xl mx-auto flex flex-col gap-6 fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                <div className="md:col-span-3 bg-gradient-to-br from-[#004A77] to-[#002f4d] rounded-3xl p-8 text-white shadow-lg flex flex-col justify-center relative overflow-hidden">
                                    <h2 className="text-3xl font-semibold mb-2">Halo, {username}</h2>
                                    <p className="opacity-80 text-sm mb-8">Berikut adalah ringkasan interaksi & kesehatan mentalmu.</p>
                                    <div className="flex gap-4">
                                        <div className="bg-black/20 p-4 rounded-2xl flex-1 text-center backdrop-blur-sm border border-white/10">
                                            <p className="text-[10px] font-bold uppercase opacity-70 mb-1">Total Chat</p>
                                            <p className="text-3xl font-mono font-semibold">{chatHistory.length}</p>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-2xl flex-1 text-center backdrop-blur-sm border border-white/10">
                                            <p className="text-[10px] font-bold uppercase opacity-70 mb-1">Mood Dominan</p>
                                            <p className={`text-xl font-semibold uppercase mt-1.5 ${getDominantMood() === '-' ? '' : getMoodColor(getDominantMood()).split(' ')[0]}`}>{getDominantMood()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2 bg-[#1E1F20] rounded-3xl p-8 border border-white/5 flex flex-col">
                                    <h3 className="text-[11px] font-bold text-[#C4C7C5] uppercase tracking-widest mb-4">Aksi Cepat</h3>
                                    <div className="grid grid-cols-2 gap-4 h-full">
                                        <button onClick={() => {setActiveTab('newchat'); setCurrentChatId(null);}} className="flex flex-col items-center justify-center gap-3 bg-[#131314] hover:bg-[#282A2C] rounded-2xl p-4 transition-colors border border-white/5 group">
                                            <div className="w-12 h-12 rounded-full bg-[#1E1F20] group-hover:bg-[#004A77] flex items-center justify-center transition-colors"><i data-feather="message-circle" className="text-[#A8C7FA]"></i></div>
                                            <span className="text-[11px] font-bold text-[#C4C7C5]">MULAI CHAT</span>
                                        </button>
                                        <button onClick={() => setActiveTab('dashboard')} className="flex flex-col items-center justify-center gap-3 bg-[#131314] hover:bg-[#282A2C] rounded-2xl p-4 transition-colors border border-white/5 group">
                                            <div className="w-12 h-12 rounded-full bg-[#1E1F20] group-hover:bg-[#004A77] flex items-center justify-center transition-colors"><i data-feather="pie-chart" className="text-[#A8C7FA]"></i></div>
                                            <span className="text-[11px] font-bold text-[#C4C7C5]">DASHBOARD</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#1E1F20] rounded-3xl p-6 lg:p-8 border border-white/5">
                                <h3 className="text-[11px] font-bold text-[#C4C7C5] mb-6 uppercase tracking-widest">Interaksi Terakhir</h3>
                                <div className="flex flex-col gap-3">
                                    {chatHistory.slice(0,5).map(chat => (
                                        <div key={chat.id} onClick={() => openChat(chat.id)} className="flex justify-between items-center p-4 bg-[#232527] border border-white/5 rounded-2xl hover:bg-[#282A2C] cursor-pointer transition-colors">
                                            <div className="flex flex-col min-w-0 pr-4">
                                                <span className="text-[10px] font-mono opacity-50 mb-1 font-bold uppercase">{chat.date}</span>
                                                <p className="text-[14px] font-medium text-white truncate w-full">"{chat.title}"</p>
                                            </div>
                                            <span className={`px-4 py-1.5 text-[10px] font-bold rounded-full uppercase border shrink-0 tracking-widest ${getMoodColor(chat.mood)}`}>
                                                {chat.mood}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: DASHBOARD ANALITIK --- */}
                    {activeTab === 'dashboard' && (
                        <div className="max-w-5xl mx-auto flex flex-col gap-6 fade-in pb-20">
                            <h2 className="text-3xl font-semibold mb-2">Dashboard Analitik</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Kuesioner Card */}
                                <div className="bg-[#1E1F20] rounded-[24px] p-8 border border-white/5 flex flex-col items-center">
                                    <h3 className="text-[11px] font-bold text-[#C4C7C5] text-center mb-8 uppercase tracking-widest">Distribusi Emosi (Kuesioner)</h3>
                                    
                                    <div className="w-48 h-24 bg-[#232527] rounded-t-full border-t-8 border-x-8 border-[#A8C7FA] relative mb-10 flex items-end justify-center pb-2">
                                        {kuesionerResult ? (
                                            <span className={`text-xl font-bold uppercase tracking-widest ${getMoodColor(kuesionerResult.mood).split(' ')[0]}`}>{kuesionerResult.mood}</span>
                                        ) : (
                                            <span className="text-xs font-bold text-[#C4C7C5]">BELUM MENGISI</span>
                                        )}
                                    </div>

                                    <div className="w-full space-y-2.5">
                                        <div className="flex justify-between items-center p-3.5 bg-[#232527] rounded-xl border border-white/5 text-xs font-bold">
                                            <span className="text-[#1f77b4]">GREAT</span> <span className="text-white">{kuesionerResult?.mood === 'GREAT' ? '1' : '0'}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3.5 bg-[#232527] rounded-xl border border-white/5 text-xs font-bold">
                                            <span className="text-[#2ca02c]">GOOD</span> <span className="text-white">{kuesionerResult?.mood === 'GOOD' ? '1' : '0'}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3.5 bg-[#232527] rounded-xl border border-white/5 text-xs font-bold">
                                            <span className="text-[#bcbd22]">NEUTRAL</span> <span className="text-white">{kuesionerResult?.mood === 'NEUTRAL' ? '1' : '0'}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3.5 bg-[#232527] rounded-xl border border-white/5 text-xs font-bold">
                                            <span className="text-[#ff7f0e]">LOW</span> <span className="text-white">{kuesionerResult?.mood === 'LOW' ? '1' : '0'}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3.5 bg-[#232527] rounded-xl border border-white/5 text-xs font-bold">
                                            <span className="text-[#d62728]">DISTRESSED</span> <span className="text-white">{kuesionerResult?.mood === 'DISTRESSED' ? '1' : '0'}</span>
                                        </div>
                                    </div>

                                    {!kuesionerResult && (
                                        <button onClick={() => setActiveTab('kuesioner')} className="mt-6 w-full py-3 bg-[#004A77] text-[#A8C7FA] rounded-xl font-bold hover:brightness-125 transition-all text-sm">
                                            Isi Kuesioner Sekarang
                                        </button>
                                    )}
                                </div>

                                {/* Chat Distribution Card */}
                                <div className="bg-[#1E1F20] rounded-[24px] p-8 border border-white/5 flex flex-col items-center">
                                    <h3 className="text-[11px] font-bold text-[#C4C7C5] text-center mb-8 uppercase tracking-widest">Distribusi Emosi (Chat)</h3>
                                    
                                    <div className="w-32 h-32 rounded-full border-[12px] border-[#2ca02c] border-t-[#d62728] border-r-[#bcbd22] border-l-[#1f77b4] mb-8 flex items-center justify-center flex-col">
                                        <span className="text-3xl font-mono font-bold text-white leading-none">{chatHistory.length}</span>
                                        <span className="text-[9px] font-bold text-[#C4C7C5] tracking-widest mt-1">CHATS</span>
                                    </div>

                                    <div className="w-full space-y-2.5">
                                        <div className="flex justify-between items-center p-3.5 bg-[#232527] rounded-xl border border-white/5 text-xs font-bold">
                                            <span className="text-[#1f77b4]">GREAT</span> <span className="text-white">{chatHistory.filter(c => c.mood === 'GREAT').length}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3.5 bg-[#232527] rounded-xl border border-white/5 text-xs font-bold">
                                            <span className="text-[#2ca02c]">GOOD</span> <span className="text-white">{chatHistory.filter(c => c.mood === 'GOOD').length}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3.5 bg-[#232527] rounded-xl border border-white/5 text-xs font-bold">
                                            <span className="text-[#bcbd22]">NEUTRAL</span> <span className="text-white">{chatHistory.filter(c => c.mood === 'NEUTRAL').length}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3.5 bg-[#232527] rounded-xl border border-white/5 text-xs font-bold">
                                            <span className="text-[#ff7f0e]">LOW</span> <span className="text-white">{chatHistory.filter(c => c.mood === 'LOW').length}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3.5 bg-[#232527] rounded-xl border border-white/5 text-xs font-bold">
                                            <span className="text-[#d62728]">DISTRESSED</span> <span className="text-white">{chatHistory.filter(c => c.mood === 'DISTRESSED').length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: KUESIONER (Update Sesuai 6 Parameter Model ML) --- */}
                    {activeTab === 'kuesioner' && (
                        <div className="max-w-3xl mx-auto fade-in pb-20">
                            <h2 className="text-3xl font-semibold mb-2">Kuesioner Kesehatan Mental</h2>
                            <p className="text-[#C4C7C5] text-sm mb-8">Jawablah pertanyaan berikut dengan skala 1 sampai 5. Data ini akan diolah oleh AI untuk mengklasifikasi kondisi mentalmu.</p>
                            
                            <form onSubmit={submitKuesioner} className="space-y-10">
                                {/* Input Umur */}
                                <div className="space-y-4 bg-[#1E1F20] p-6 rounded-2xl border border-white/5">
                                    <h4 className="text-[15px] font-medium text-white">Berapa usia kamu saat ini?</h4>
                                    <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Contoh: 21" className="w-full md:w-1/2 bg-[#131314] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#A8C7FA]" required min="10" max="100"/>
                                </div>

                                {/* 6 Pertanyaan Kuesioner (Skala 1-5) */}
                                {KUESIONER_QUESTIONS.map((q) => (
                                    <div key={q.id} className="space-y-4">
                                        <h4 className="text-[15px] font-medium text-[#E3E3E3] leading-relaxed">{q.text}</h4>
                                        <div className="flex flex-col md:flex-row gap-2 md:gap-3 items-center w-full">
                                            <span className="text-xs text-[#C4C7C5] opacity-60 w-full md:w-auto text-left md:text-right">{q.min}</span>
                                            
                                            <div className="flex justify-between w-full md:w-auto gap-2 flex-1">
                                                {[1, 2, 3, 4, 5].map((val) => (
                                                    <label key={val} className="relative cursor-pointer flex-1 group">
                                                        <input type="radio" name={`q_${q.id}`} value={val} className="sr-only" required onChange={() => handleAnswerChange(q.id, val)}/>
                                                        <div className={`flex items-center justify-center py-3.5 rounded-xl text-sm font-bold transition-all border ${kuesionerAnswers[q.id] === val ? 'bg-[#004A77] border-[#A8C7FA] text-[#A8C7FA] shadow-[0_0_15px_rgba(168,199,250,0.2)]' : 'bg-[#1E1F20] border-white/5 text-[#C4C7C5] group-hover:bg-[#282A2C]'}`}>
                                                            {val}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>

                                            <span className="text-xs text-[#C4C7C5] opacity-60 w-full md:w-auto text-right md:text-left">{q.max}</span>
                                        </div>
                                    </div>
                                ))}

                                <button type="submit" className="w-full py-4 bg-[#004A77] text-[#A8C7FA] font-bold rounded-xl hover:brightness-125 transition-all tracking-wide">
                                    Simpan & Lihat Hasil Analisa
                                </button>
                            </form>
                        </div>
                    )}

                    {/* --- VIEW: NEW CHAT / CHATBOT --- */}
                    {(activeTab === 'newchat' || activeTab === 'chatbot') && (
                        <div className="max-w-3xl mx-auto flex flex-col h-full fade-in pb-24">
                            {activeTab === 'newchat' && (
                                <div className="flex flex-col items-start pt-10 md:pt-20">
                                    <h1 className="text-4xl md:text-[56px] font-semibold tracking-tight mb-2 leading-tight bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent w-max">
                                        Halo, {username}
                                    </h1>
                                    <h2 className="text-3xl md:text-[44px] font-semibold text-[#444746] tracking-tight leading-tight mb-10">Ada yang bisa dibantu hari ini?</h2>
                                    
                                    <div className="flex flex-wrap gap-3 w-full">
                                        <button onClick={() => setInputText('Aku merasa sangat stres dengan tugas kuliah belakangan ini.')} className="px-5 py-3 bg-[#1E1F20] hover:bg-[#282A2C] border border-white/5 rounded-xl text-[13px] transition-colors flex items-center gap-2"><i data-feather="edit-3" className="w-4 h-4 text-[#A8C7FA]"></i> Aku merasa stres</button>
                                        <button onClick={() => setInputText('Bantu aku mengatasi kecemasan tentang hari esok.')} className="px-5 py-3 bg-[#1E1F20] hover:bg-[#282A2C] border border-white/5 rounded-xl text-[13px] transition-colors flex items-center gap-2"><i data-feather="cloud-rain" className="w-4 h-4 text-[#A8C7FA]"></i> Atasi cemas</button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'chatbot' && (
                                <div className="flex-1 overflow-y-auto space-y-8 pt-4">
                                    {chatHistory.find(c => c.id === currentChatId)?.messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-start gap-4'} fade-in`}>
                                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-[#004A77] flex items-center justify-center shrink-0 mt-1"><i data-feather="cpu" className="w-4 h-4 text-[#A8C7FA]"></i></div>}
                                            <div className={`${msg.sender === 'user' ? 'bg-[#282A2C] text-white px-5 py-3.5 rounded-[24px] rounded-br-sm max-w-[85%]' : 'text-[#E3E3E3] leading-relaxed pt-1 w-full max-w-[90%]'} text-[15px]`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex items-center gap-4 fade-in text-[#A8C7FA]">
                                            <div className="w-8 h-8 rounded-full bg-[#004A77] flex items-center justify-center shrink-0"><i data-feather="cpu" className="w-4 h-4 animate-pulse"></i></div>
                                            <span className="text-sm italic">MindSpace sedang mengetik...</span>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* --- CHAT INPUT STICKY BOTTOM --- */}
                {(activeTab === 'newchat' || activeTab === 'chatbot') && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent z-20">
                        <div className="max-w-3xl mx-auto">
                            <form onSubmit={handleSendMessage} className="relative flex items-end bg-[#1E1F20] rounded-[24px] border border-white/10 focus-within:border-white/20 transition-colors shadow-2xl">
                                <textarea value={inputText} onChange={e => setInputText(e.target.value)} rows="1" className="w-full bg-transparent border-none focus:outline-none text-[15px] text-white py-4 pl-6 resize-none placeholder-[#C4C7C5]" placeholder="Ketik pesan di sini..." onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}></textarea>
                                <div className="p-2 shrink-0 flex items-center mb-1 pr-2">
                                    <button type="submit" disabled={!inputText.trim() || isTyping} className={`p-2 rounded-full flex items-center justify-center w-10 h-10 transition-transform ${inputText.trim() && !isTyping ? 'bg-white text-[#131314] active:scale-95' : 'bg-[#282A2C] text-gray-500 cursor-not-allowed'}`}>
                                        <i data-feather="arrow-up" className="w-5 h-5"></i>
                                    </button>
                                </div>
                            </form>
                            <p className="text-center text-[10px] text-gray-500 mt-3 hidden md:block">MindSpace AI dapat membuat kesalahan. Harap selalu utamakan bantuan profesional jika merasa darurat.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}