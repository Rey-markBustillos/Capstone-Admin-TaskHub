

import React from 'react';
import QuizSubmissions from './QuizSubmissions';
import FallingBooks from '../components/FallingBooks';

export default function QuizSubmissionsPage() {
	// Placeholder: You can add quiz selection logic here if needed
	return (
		   <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-[#181a20] overflow-hidden">
			   <FallingBooks />
			   <div className="relative z-10 bg-[#23263a] rounded-2xl shadow-lg p-8 max-w-2xl w-full mt-10 border-4 border-indigo-900">
				   <h1 className="text-3xl font-bold mb-6 text-indigo-100">Quiz Submissions</h1>
				   <QuizSubmissions quizId={null} />
				   {/* You can add a quiz selector and pass the selected quizId to QuizSubmissions */}
			   </div>
		   </div>
	);
}

