'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-hidden relative">
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] animate-[pulse_10s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px] animate-[pulse_12s_ease-in-out_infinite_2s]" />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none">
        {mounted && [...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-purple-400/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${6 + Math.random() * 8}s ease-in-out infinite ${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <header className="relative z-50 w-full px-6 py-5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Todoo
            </span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/signin"
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/25 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text */}
          <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm mb-8">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs font-medium text-purple-300">AI-Powered Task Management</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Manage Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Tasks with{' '}
              </span>
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                AI
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-lg">
              The smartest way to stay organized. Chat with your AI assistant to create, manage, and complete tasks using plain language.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="group relative px-8 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:-translate-y-1"
              >
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                href="/signin"
                className="px-8 py-4 rounded-2xl text-base font-semibold text-gray-300 hover:text-white border border-white/10 hover:border-white/25 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-white/5"
              >
                Login &rarr;
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure & private</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No setup needed</span>
              </div>
            </div>
          </div>

          {/* Right - 3D Floating Elements */}
          <div className={`relative h-[500px] lg:h-[580px] transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            style={{ perspective: '1200px' }}
          >
            {/* Main glass card - Task list */}
            <div
              className="absolute top-[10%] left-[10%] w-[280px] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl shadow-purple-900/20"
              style={{
                transform: 'rotateY(-8deg) rotateX(5deg)',
                animation: 'floatSlow 6s ease-in-out infinite',
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-gray-500 font-medium">My Tasks</span>
              </div>

              {/* Task items */}
              {[
                { title: 'Design landing page', done: true, color: 'from-purple-500 to-blue-500', progress: 100 },
                { title: 'Setup AI chatbot', done: true, color: 'from-blue-500 to-cyan-500', progress: 100 },
                { title: 'Write API endpoints', done: false, color: 'from-cyan-500 to-teal-500', progress: 65 },
                { title: 'Deploy to production', done: false, color: 'from-pink-500 to-purple-500', progress: 20 },
              ].map((task, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0"
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    task.done
                      ? `bg-gradient-to-br ${task.color} shadow-lg`
                      : 'border-2 border-white/20'
                  }`}>
                    {task.done && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                      {task.title}
                    </p>
                    <div className="mt-1 w-full h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${task.color}`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Floating chat bubble */}
            <div
              className="absolute top-[5%] right-[5%] w-[220px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl shadow-blue-900/20"
              style={{
                transform: 'rotateY(10deg) rotateX(-3deg)',
                animation: 'floatSlow 7s ease-in-out infinite 1s',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-300">AI Assistant</span>
              </div>
              <div className="space-y-2">
                <div className="bg-white/5 rounded-xl rounded-tl-sm px-3 py-2">
                  <p className="text-xs text-gray-400">Add 3 tasks for the sprint</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl rounded-tr-sm px-3 py-2">
                  <p className="text-xs text-purple-200">Done! Created 3 new tasks for your sprint backlog.</p>
                </div>
              </div>
            </div>

            {/* Floating calendar card */}
            <div
              className="absolute bottom-[8%] right-[8%] w-[180px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl shadow-purple-900/20"
              style={{
                transform: 'rotateY(12deg) rotateX(4deg)',
                animation: 'floatSlow 8s ease-in-out infinite 2s',
              }}
            >
              <div className="text-xs font-semibold text-gray-400 mb-3">February 2026</div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <div key={`h-${i}`} className="text-[9px] text-gray-600 font-medium">{d}</div>
                ))}
                {[...Array(28)].map((_, i) => {
                  const day = i + 1;
                  const isToday = day === 7;
                  const hasTask = [3, 7, 12, 15, 21].includes(day);
                  return (
                    <div
                      key={i}
                      className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-md transition-colors ${
                        isToday
                          ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold shadow-lg shadow-purple-500/30'
                          : hasTask
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'text-gray-500'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Floating stats pill */}
            <div
              className="absolute bottom-[15%] left-[5%] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-3 shadow-xl"
              style={{
                animation: 'floatSlow 9s ease-in-out infinite 0.5s',
              }}
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">12</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Done</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">5</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Pending</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">71%</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Progress</div>
                </div>
              </div>
            </div>

            {/* Glowing orb decorations */}
            <div className="absolute top-[30%] left-[0%] w-16 h-16 rounded-full bg-purple-500/30 blur-xl animate-pulse" />
            <div className="absolute bottom-[30%] right-[0%] w-12 h-12 rounded-full bg-blue-500/30 blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[60%] left-[40%] w-10 h-10 rounded-full bg-cyan-500/20 blur-lg animate-pulse" style={{ animationDelay: '4s' }} />
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Everything you need to{' '}
            </span>
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              stay productive
            </span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-lg mx-auto">
            Powered by AI, built for humans. A seamless task management experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              ),
              gradient: 'from-purple-500 to-blue-500',
              shadow: 'shadow-purple-500/20',
              title: 'Smart Task Management',
              desc: 'Create, organize, and track tasks with an intuitive interface. Progress bars, status tracking, and smart filters.',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              ),
              gradient: 'from-blue-500 to-cyan-500',
              shadow: 'shadow-blue-500/20',
              title: 'AI Chat Assistant',
              desc: 'Manage tasks through natural conversation. Just say "add a task" or "show my completed tasks."',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ),
              gradient: 'from-cyan-500 to-teal-500',
              shadow: 'shadow-cyan-500/20',
              title: 'Secure & Private',
              desc: 'JWT authentication, encrypted data, and zero cross-user access. Your data stays yours.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={`group relative rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 hover:bg-white/[0.05] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${feature.shadow} ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${600 + i * 150}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg ${feature.shadow} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {feature.icon}
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>

              {/* Hover glow */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24">
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-12 sm:p-16 text-center overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-purple-600/20 blur-[80px] rounded-full" />

          <h2 className="relative text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Ready to get organized?
            </span>
          </h2>
          <p className="relative text-gray-400 mb-10 max-w-md mx-auto">
            Join Todoo and let AI handle the heavy lifting. Start managing your tasks smarter today.
          </p>
          <Link
            href="/signup"
            className="relative inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:-translate-y-1"
          >
            Get Started Free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span>Todoo</span>
          <span className="text-gray-700">&mdash;</span>
          <span>Built with Next.js, FastAPI & AI</span>
        </div>
      </footer>

      {/* Custom keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
