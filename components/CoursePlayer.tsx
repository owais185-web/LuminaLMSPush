
import React, { useState } from 'react';
import { Course, Module, Lesson, User, Review } from '../types';
import { PlayCircle, CheckCircle, Lock, FileText, Download, ChevronDown, ChevronRight, ArrowLeft, Star, Award, Clock } from 'lucide-react';
import { Button, Badge } from './Common';
import { db } from '../services/db';

interface CoursePlayerProps {
  course: Course;
  onBack: () => void;
  user: User;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ course, onBack, user }) => {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(
    course.content?.[0]?.lessons?.[0] || null
  );
  const [expandedModules, setExpandedModules] = useState<string[]>(
    course.content?.map(m => m.id) || []
  );
  const [activeTab, setActiveTab] = useState<'notes' | 'resources' | 'quiz' | 'reviews'>('notes');
  // Local state to track completions during session
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>(course.reviews || []);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const toggleModule = (modId: string) => {
    setExpandedModules(prev => 
      prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
    );
  };

  const toggleComplete = () => {
      if (!activeLesson) return;
      setCompletedLessons(prev => 
        prev.includes(activeLesson.id) 
            ? prev.filter(id => id !== activeLesson.id) 
            : [...prev, activeLesson.id]
      );
  };

  const handleDownloadCertificate = () => {
      // Simulating PDF generation
      const content = `
      CERTIFICATE OF COMPLETION
      -------------------------
      This certifies that
      ${user.name}
      has successfully completed
      ${course.title}
      
      Date: ${new Date().toLocaleDateString()}
      Instructor: ${course.instructor}
      `;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate-${course.id}.txt`; // Using txt for simple demo, IRL PDF
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newReview.comment) return;
      setIsReviewSubmitting(true);

      const review: Review = {
          id: `r${Date.now()}`,
          userId: user.id,
          userName: user.name,
          rating: newReview.rating,
          comment: newReview.comment,
          date: new Date()
      };

      setTimeout(() => {
          const updatedCourse = db.courses.addReview(course.id, review);
          if (updatedCourse) {
              setReviews(updatedCourse.reviews || []);
          }
          setNewReview({ rating: 5, comment: '' });
          setIsReviewSubmitting(false);
      }, 800);
  };

  // Completion Calculation
  const totalLessons = course.content?.reduce((acc, m) => acc + m.lessons.length, 0) || 0;
  const completedCount = (course.content?.reduce((acc, m) => acc + m.lessons.filter(l => l.isCompleted).length, 0) || 0) + completedLessons.length;
  // De-duplicate in case of overlap between DB state and local session state for accurate math
  // For MVP simplicity, we assume `completedLessons` tracks strictly new completions.
  // A robust solution would sync proper IDs.
  const progressPercent = Math.min(100, Math.round((completedCount / totalLessons) * 100));

  if (!course.content) return <div>No content available for this course.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] -m-4 md:-m-8 bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="h-16 bg-slate-900 flex items-center px-4 md:px-6 justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-semibold truncate max-w-[200px] md:max-w-md">{course.title}</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {progressPercent === 100 ? (
              <Button onClick={handleDownloadCertificate} className="bg-yellow-500 hover:bg-yellow-600 text-black border-none gap-2">
                  <Award size={16} /> Download Certificate
              </Button>
          ) : (
            <>
                <span className="hidden md:inline text-slate-400">Progress: {progressPercent}%</span>
                <div className="w-24 bg-slate-700 h-2 rounded-full hidden md:block">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Main Content Area (Video) */}
        <div className="flex-1 flex flex-col bg-slate-950 relative overflow-y-auto">
          <div className="aspect-video bg-black relative flex items-center justify-center group overflow-hidden">
             {/* Simulated Video Player */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity" />
             
             {/* Watermark Overlay */}
             {course.securityConfig?.watermarkText && (
                 <div className="absolute inset-0 z-0 pointer-events-none opacity-20 flex items-center justify-center">
                     <div className="text-slate-500 font-mono text-sm rotate-12 whitespace-pre-line text-center select-none">
                        {user.email}
                        {'\n'}
                        ID: {user.id}
                        {'\n'}
                        {new Date().toLocaleDateString()}
                     </div>
                 </div>
             )}

             {activeLesson?.type === 'video' ? (
                 <div className="text-center relative z-10">
                     <PlayCircle size={64} className="text-white opacity-80 mx-auto mb-4" />
                     <p className="text-slate-400 font-mono">Secure Stream: {activeLesson.id}</p>
                     <p className="text-slate-500 text-xs mt-2">DRM Protected • ID: {course.id}</p>
                 </div>
             ) : (
                 <div className="text-center p-8 relative z-10">
                     <FileText size={64} className="text-slate-600 mx-auto mb-4" />
                     <h3 className="text-xl font-bold">{activeLesson?.title}</h3>
                     <Button className="mt-4" variant="secondary">Open Content</Button>
                 </div>
             )}

             {/* Mock Controls */}
             <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-white cursor-pointer"><PlayCircle size={24}/></div>
                <div className="flex-1 h-1 bg-slate-600 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-red-600"></div>
                </div>
                <div className="text-xs text-white">05:20 / 15:00</div>
             </div>
          </div>

          {/* Lesson Details & Tabs */}
          <div className="p-6 bg-white text-slate-900 flex-1">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">{activeLesson?.title}</h1>
                    <p className="text-slate-500">Lesson {activeLesson?.id.replace('l','')} • {activeLesson?.duration}</p>
                </div>
                <Button 
                    variant="primary" 
                    icon={CheckCircle} 
                    onClick={toggleComplete}
                    className={(activeLesson?.isCompleted || completedLessons.includes(activeLesson?.id || '')) ? "bg-green-600 hover:bg-green-700" : ""}
                >
                    {(activeLesson?.isCompleted || completedLessons.includes(activeLesson?.id || '')) ? "Completed" : "Mark Complete"}
                </Button>
            </div>

            <div className="border-b border-slate-200 mb-6">
                <div className="flex gap-6">
                    {['notes', 'resources', 'quiz', 'reviews'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-3 px-1 capitalize font-medium transition-colors border-b-2 ${
                                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="prose max-w-none text-slate-600">
                {activeTab === 'notes' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800">Key Takeaways</h3>
                        <p>In this lesson, we covered the fundamental structure of the library. Remember that the core entry point is initialized with your API key.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Initialization patterns</li>
                            <li>Error handling strategies</li>
                            <li>Performance optimization tips</li>
                        </ul>
                    </div>
                )}
                {activeTab === 'resources' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                                <FileText className="text-red-500" size={20} />
                                <span>Lecture Slides.pdf</span>
                            </div>
                            <Download size={16} className="text-slate-400" />
                        </div>
                         <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                                <FileText className="text-blue-500" size={20} />
                                <span>Source Code.zip</span>
                            </div>
                            <Download size={16} className="text-slate-400" />
                        </div>
                    </div>
                )}
                 {activeTab === 'quiz' && (
                    <div className="text-center py-8 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                        <p className="text-slate-500 mb-4">Test your knowledge of this module.</p>
                        <Button>Start Quiz</Button>
                    </div>
                )}
                {activeTab === 'reviews' && (
                    <div className="space-y-8">
                        {/* Add Review */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                             <h4 className="font-bold text-slate-800 mb-2">Leave a Review</h4>
                             <div className="flex gap-1 mb-3">
                                 {[1,2,3,4,5].map(star => (
                                     <button key={star} onClick={() => setNewReview({...newReview, rating: star})} className="text-yellow-500 hover:scale-110 transition-transform">
                                         <Star size={24} fill={star <= newReview.rating ? "currentColor" : "none"} />
                                     </button>
                                 ))}
                             </div>
                             <textarea 
                                className="w-full p-2 border border-slate-300 rounded-lg mb-2 text-sm" 
                                placeholder="What did you think about this course?"
                                value={newReview.comment}
                                onChange={e => setNewReview({...newReview, comment: e.target.value})}
                             />
                             <div className="flex justify-end">
                                 <Button size="sm" onClick={handleSubmitReview} isLoading={isReviewSubmitting}>Submit Review</Button>
                             </div>
                        </div>

                        {/* List Reviews */}
                        <div className="space-y-4">
                            {reviews.length === 0 && <p className="text-slate-500 italic">No reviews yet.</p>}
                            {reviews.map(rev => (
                                <div key={rev.id} className="border-b border-slate-100 pb-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800">{rev.userName}</span>
                                            <span className="text-xs text-slate-500">{new Date(rev.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex text-yellow-500">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600">{rev.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Sidebar (Curriculum) */}
        <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 h-1/2 md:h-auto overflow-y-auto text-slate-900">
           <div className="p-4 border-b border-slate-200 font-bold text-lg">Course Content</div>
           <div className="flex-1 overflow-y-auto">
               {course.content.map((module, idx) => {
                   const isDripLocked = module.unlockDate && new Date(module.unlockDate) > new Date();
                   const unlockDateStr = module.unlockDate ? new Date(module.unlockDate).toLocaleDateString() : '';

                   return (
                   <div key={module.id} className="border-b border-slate-100">
                       <button 
                         onClick={() => toggleModule(module.id)}
                         className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
                       >
                           <div className="flex flex-col items-start">
                                <span className="font-medium text-sm text-left">{module.title}</span>
                                {isDripLocked && (
                                    <span className="text-[10px] text-red-500 flex items-center gap-1 font-semibold mt-0.5">
                                        <Clock size={10} /> Available: {unlockDateStr}
                                    </span>
                                )}
                           </div>
                           {expandedModules.includes(module.id) ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                       </button>
                       
                       {expandedModules.includes(module.id) && (
                           <div className="bg-slate-50">
                               {isDripLocked ? (
                                   <div className="p-4 text-center text-slate-400 text-sm">
                                       <Lock className="mx-auto mb-2" size={20} />
                                       Content is currently locked.
                                   </div>
                               ) : (
                                   module.lessons.map(lesson => {
                                       const isActive = activeLesson?.id === lesson.id;
                                       const isDone = lesson.isCompleted || completedLessons.includes(lesson.id);
                                       return (
                                           <button 
                                                key={lesson.id}
                                                onClick={() => !lesson.isLocked && setActiveLesson(lesson)}
                                                disabled={lesson.isLocked}
                                                className={`w-full px-4 py-3 flex items-center gap-3 text-sm transition-colors ${
                                                    isActive ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-100'
                                                } ${lesson.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                           >
                                               <div className="shrink-0">
                                                   {isDone ? (
                                                       <CheckCircle size={16} className="text-green-500" />
                                                   ) : lesson.isLocked ? (
                                                       <Lock size={16} className="text-slate-400" />
                                                   ) : (
                                                       <PlayCircle size={16} className={isActive ? "text-blue-600" : "text-slate-400"} />
                                                   )}
                                               </div>
                                               <div className="flex-1 text-left truncate">
                                                   <p className="truncate">{lesson.title}</p>
                                                   <p className="text-xs opacity-70 mt-0.5">{lesson.duration}</p>
                                               </div>
                                           </button>
                                       )
                                   })
                               )}
                           </div>
                       )}
                   </div>
               )})}
           </div>
        </div>
      </div>
    </div>
  );
};
