

import React from 'react';
import QuizSubmissions from './QuizSubmissions';

export default function QuizSubmissionsPage() {
	// Placeholder: You can add quiz selection logic here if needed
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-blue-200">
			<div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full mt-10">
				<h1 className="text-3xl font-bold mb-6 text-indigo-900">Quiz Submissions</h1>
				<QuizSubmissions quizId={null} />
				{/* You can add a quiz selector and pass the selected quizId to QuizSubmissions */}
			</div>
		</div>
	);
}

